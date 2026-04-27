from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from beanie import PydanticObjectId
from datetime import datetime
from backend.models.session import Session, ExerciseProgress, SetProgress
from backend.models.workout import Workout
from backend.models.exercise import Exercise
from backend.models.user import User
from backend.schemas.session import SessionCreate, SessionRead
from backend.utils import auth


router = APIRouter(tags=["sessions"])

def session_to_read(session: Session) -> dict:
    return {
        "id": str(session.id),
        "user_id": str(session.user_id),
        "workout_id": str(session.workout_id),
        "workout_name": session.workout_name,
        "date": session.date,
        "exercises": [
            {
                "exercise_id": str(exercise.exercise_id),
                "exercise_name": exercise.exercise_name,
                "sets": [
                    {
                        "weight": s.weight,
                        "reps": s.reps
                    } for s in exercise.sets
                ]
            } for exercise in session.exercises
        ]
    }

# Create Session
@router.post("/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: SessionCreate,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):
    workout = await Workout.get(session.workout_id)

    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout template not found")

    workout_id = workout.id
    workout_name = workout.name

    exercise_ids = [progress.exercise_id for progress in session.exercises]
    id_objects = [PydanticObjectId(id) for id in exercise_ids]
    found_exercises = await Exercise.find({"_id": {"$in": id_objects}}).to_list()
    names_map = {str(ex.id): ex.name for ex in found_exercises}

    exercises = [
    ExerciseProgress(
        exercise_id=progress.exercise_id,
        exercise_name=names_map.get(str(progress.exercise_id), "Unknown Exercise"), 
        sets=[
            SetProgress(
                weight=record.weight,
                reps=record.reps
            )
            for record in progress.sets
        ]
    )
    for progress in session.exercises
]
    new_session = Session(
        user_id=current_user.id,
        workout_id=PydanticObjectId(workout_id),
        workout_name=workout_name,
        date=session.date or datetime.now(),
        exercises=exercises
    )
    await new_session.insert()
    return session_to_read(new_session)


# Read ALL Sessions
@router.get("/sessions", response_model=list[SessionRead], status_code=status.HTTP_200_OK)
async def list_sessions(
    current_user: Annotated[User, Depends(auth.get_current_active_user)]
):
    sessions = await Session.find(
        Session.user_id == PydanticObjectId(current_user.id)
    ).sort(-Session.date).to_list()

    return [session_to_read(s) for s in sessions]

# Read recent Sessions
@router.get("/sessions/recent", response_model=list[SessionRead], status_code=status.HTTP_200_OK)
async def list_recent_sessions(
    current_user: Annotated[User, Depends(auth.get_current_active_user)]
):
    sessions = await Session.find(
        Session.user_id == PydanticObjectId(current_user.id)
    ).sort(-Session.date).limit(3).to_list()
    
    return [session_to_read(s) for s in sessions]

# # Read Session by ID - backend use
# @router.get("/sessions/{session_id}", response_model=SessionRead, status_code=status.HTTP_200_OK)
# async def read_session(session_id: PydanticObjectId):
#     session = await Session.get(PydanticObjectId(session_id))
#     if not session:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
#     return session_to_read(session)

# Update Session
# Delete Session
@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: PydanticObjectId,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]
):
    session = await Session.find_one(
        Session.id == session_id,
        Session.user_id == PydanticObjectId(current_user.id)
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    await session.delete()
    return None

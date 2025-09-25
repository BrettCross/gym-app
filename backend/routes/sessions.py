from fastapi import APIRouter, status, HTTPException
from beanie import PydanticObjectId
from datetime import datetime
from models.session import Session, ExerciseProgress, SetProgress
from schemas.session import SessionCreate, SessionRead


router = APIRouter(tags=["sessions"])

def session_to_read(session: Session) -> dict:
    return {
        "id": str(session.id),
        "user_id": str(session.user_id),
        "workout_id": str(session.workout_id),
        "date": session.date,
        "exercises": [
            {
                "exercise_id": str(exercise.exercise_id),
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
async def create_session(session: SessionCreate):
    exercises = [
    ExerciseProgress(
        exercise_id=progress.exercise_id,
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
        user_id=PydanticObjectId(session.user_id),
        workout_id=PydanticObjectId(session.workout_id),
        date=session.date or datetime.now(),
        exercises=exercises
    )
    await new_session.insert()
    return session_to_read(new_session)


# Read ALL Sessions
@router.get("/sessions", response_model=list[SessionRead], status_code=status.HTTP_200_OK)
async def list_sessions():
    sessions = await Session.find_all().to_list()
    return [session_to_read(s) for s in sessions]

# Read Session by ID - backend use
@router.get("/sessions/{session_id}", response_model=SessionRead, status_code=status.HTTP_200_OK)
async def read_session(session_id: str):
    session = await Session.get(PydanticObjectId(session_id))
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session_to_read(session)

# Update Session
# Delete Session
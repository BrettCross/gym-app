from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status, HTTPException
from beanie import PydanticObjectId
from beanie.operators import In

from backend.models.exercise import Exercise
from backend.models.session import Session, SessionExercise, SessionSet
from backend.models.user import User
from backend.models.workout import Workout
from backend.schemas.session import SessionCreate, SessionRead, SessionUpdate
from backend.utils import auth
from backend.utils.policies import SessionPolicy


router = APIRouter()

@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    session_in: SessionCreate
):
    """
    Used to start a session for the authenticated user. Snapshots exercise 
    metadata so historical data remains accurate even if templates are deleted.
    """

    # Fetch workout template if one was provided
    workout = None
    if session_in.workout_id:
        workout = await Workout.find_one(
            Workout.user_id == current_user.id,
            Workout.id == session_in.workout_id
        )

        if not workout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Workout template not found"
            )

    # extract exercise IDs from request or template
    # assume workout template not provided and overwrite if one was
    exercise_ids = [e.exercise_id for e in session_in.exercises]
    if workout:
        exercise_ids = [e.exercise_id for e in workout.exercises]
    
    #  query for exercise metadata
    exercise_templates = await Exercise.find(
        In(Exercise.id, exercise_ids)
    ).to_list()
    
    ex_map = {ex.id: ex for ex in exercise_templates}
    
    # build snapshot list
    session_exercises = []
    source_exercises = workout.exercises if workout else session_in.exercises

    for source_ex in source_exercises:
        exercise = ex_map.get(source_ex.exercise_id)
        session_sets = []
        if source_ex.sets:
            for s in source_ex.sets:
                session_sets.append(SessionSet(
                    weight=s.weight,
                    reps=s.reps
                ))
                
        session_exercises.append(SessionExercise(
            exercise_id=source_ex.exercise_id,
            exercise_name=exercise.name,
            muscle_group=exercise.muscle_group,
            sets=session_sets
        ))

    # create the active session
    new_session = Session(
        user_id=current_user.id,
        workout_id=workout.id if workout else None,
        workout_name=workout.name if workout else session_in.workout_name,
        exercises=session_exercises,
        start_time=session_in.start_time or datetime.now(timezone.utc),
        end_time=None,
        total_volume=0.0
    )

    await new_session.insert()
    return new_session


@router.get("", response_model=list[SessionRead], status_code=status.HTTP_200_OK)
async def list_sessions(
    current_user: Annotated[User, Depends(auth.get_current_active_user)]
):
    """
    Retrieve all of the sessions for the authenticated user sorted by most recent.
    """

    auth_filter = SessionPolicy.get_read_filter(current_user)
    sessions = await Session.find(auth_filter).sort(-Session.start_time).to_list()
    
    return [
        SessionRead(
            **s.model_dump(),
            can_edit=SessionPolicy.can_modify(current_user, s),
            can_delete=SessionPolicy.can_delete(current_user, s)
        )
        for s in sessions
    ]


@router.get("/recent", response_model=list[SessionRead], status_code=status.HTTP_200_OK)
async def list_recent_sessions(
    current_user: Annotated[User, Depends(auth.get_current_active_user)]
):
    """
    Retrieve the 3 most recent sessions for the authenticated user's dashboard sorting my most recent.
    """

    auth_filter = SessionPolicy.get_read_filter(current_user)

    sessions = await Session.find(auth_filter).sort(-Session.start_time).limit(3).to_list()

    return [
        SessionRead(
            **s.model_dump(),
            can_edit=SessionPolicy.can_modify(current_user, s),
            can_delete=SessionPolicy.can_delete(current_user, s)
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionRead, status_code=status.HTTP_200_OK)
async def read_session(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    session_id: PydanticObjectId
):
    """
    Retrieve a specific workout session by its ID for the authenticated user.

    Includes the full exercise snapshot and volume data.
    Returns a **404** if the session is unavailable. 
    """
    
    session = await Session.get(session_id)

    if not session or not SessionPolicy.can_view(current_user, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Session not found"
        )

    return SessionRead(
        **session.model_dump(),
        can_edit=SessionPolicy.can_modify(current_user, session),
        can_delete=SessionPolicy.can_delete(current_user, session)
    )


@router.patch("/{session_id}", response_model=SessionRead, status_code=status.HTTP_200_OK)
async def update_session(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    session_id: PydanticObjectId,
    session_update: SessionUpdate
):
    """
    Updates a session with new sets/exercises.

    Used to finalize an active session.
    """

    session = await Session.get(session_id)

    if not session or not SessionPolicy.can_modify(current_user, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    update_data = session_update.model_dump(exclude_unset=True)

    if "exercises" in update_data:
        exercise_ids = [e.exercise_id for e in session_update.exercises]
        ex_templates = await Exercise.find(
            In(Exercise.id, exercise_ids)
        ).to_list()
        ex_map = {ex.id: ex for ex in ex_templates}

        new_exercises = []
        for ex_in in session_update.exercises:
            template = ex_map.get(ex_in.exercise_id)
            session_sets = []
            if ex_in.sets:
                for s in ex_in.sets:
                    session_sets.append(SessionSet(
                        weight=s.weight,
                        reps=s.reps
                    ))

            new_exercises.append(SessionExercise(
                exercise_id=ex_in.exercise_id,
                exercise_name=template.name if template else "Unknown Exercise",
                muscle_group=template.muscle_group if template else [],
                sets=session_sets
            ))

        session.exercises = new_exercises

        total_vol = 0.0
        for ex in session.exercises:
            for s in ex.sets:
                total_vol += (s.weight * s.reps)
        session.total_volume = total_vol
    
    if "workout_name" in update_data:
        session.workout_name = update_data["workout_name"]

    if "end_time" in update_data:
        session.end_time = update_data["end_time"] or datetime.now(timezone.utc)
    
    session.updated_at = datetime.now(timezone.utc)
    await session.save()
    return SessionRead(
        **session.model_dump(),
        can_edit=SessionPolicy.can_modify(current_user, session),
        can_delete=SessionPolicy.can_delete(current_user, session)
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    session_id: PydanticObjectId
):
    """
    Deletes the session for the authenticated user.

    Returns a **404** if session is unavailable.
    """
    
    session = await Session.get(session_id)

    if not session or not SessionPolicy.can_delete(current_user, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Session not found"
        )

    await session.delete()
    return None

from beanie.operators import In

from backend.models.exercise import Exercise
from backend.models.user import User
from backend.models.workout import Workout
from backend.schemas.workout import WorkoutDetailRead
from backend.utils.policies import WorkoutPolicy

async def get_enriched_workout(user: User, workout: Workout) -> WorkoutDetailRead:
    # fetch all exercises in one database hit
    exercise_ids = [e.exercise_id for e in workout.exercises]
    exercises = await Exercise.find(
        In(Exercise.id, exercise_ids)
    ).to_list()
    
    exercise_map = {ex.id: ex for ex in exercises}
    
    detailed_exercises = []
    for e in workout.exercises:
        ex_info = exercise_map.get(e.exercise_id)
        if ex_info:
            detailed_exercises.append({
                **ex_info.model_dump(),
                "exercise_id": e.exercise_id,
                "order": e.order,
                "sets": [s.model_dump() for s in e.sets]
            })
    
    return WorkoutDetailRead(
        **workout.model_dump(exclude={"exercises"}),
        exercises=detailed_exercises,
        can_edit=WorkoutPolicy.can_modify(user, workout),
        can_delete=WorkoutPolicy.can_delete(user, workout)
    )
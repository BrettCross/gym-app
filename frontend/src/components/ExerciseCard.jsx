/**
 * ExerciseCard Component
 * Visual representation of an individual exercise item
 * 
 * @param {Object} props
 * @param {Object} props.exercise - The exercise data object.
 * @param {Function} props.actions - ???
 */
export default function ExerciseCard({ exercise, actions }) {
  return (
    <div className='result-container'>
      <div className='result'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className='result-title'>{exercise.name}</h3>
          {exercise.is_official && <span className="badge-system">✅</span>}
        </div>
        <h5 className='result-desc'>
          {exercise.user_id} | {exercise.muscle_group.join(", ")} | {exercise.equipment.join(", ")} | {exercise.exercise_type}
        </h5>
      </div>
      <div className='button-container'>
        {actions}
      </div>
    </div>
  );
}
export default function SessionCard({ session, showDelete, onDelete }) {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      
    const totalVolume = session.exercises.reduce((total, ex) => {
      const exVol = ex.sets.reduce((exSum, set) => exSum + (set.weight * set.reps), 0);
      return total + exVol;
    }, 0);

    const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div key={session.id} className="result-container">
        <div className="">
          <h3>{session.workout_name}</h3>
          <h5>{formattedDate}</h5>
          <h5>{totalSets} sets | volume: {totalVolume.toLocaleString()}lbs</h5>
        </div>
        
        <div className="">
          {session.exercises.slice(0,3).map((exercise) => (
            <span key={exercise.exercise_id}>
              {exercise.exercise_name}{" "}
            </span>
          ))}
          {session.exercises.length > 3 && (
            <span>and {session.exercises.length - 3} more...</span>
          )}
        </div>
        {showDelete &&(
          <button className="button-5" onClick={() => onDelete?.(session.id)}>X</button>
        )}
      </div>
    );
  };
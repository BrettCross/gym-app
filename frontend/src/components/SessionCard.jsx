/**
 * SessionCard.jsx
 * A summary card for a specific workout session.
 * Calculates total volume and sets, formats the date, and displays
 * a preview of the exercises performed.
 */

export default function SessionCard({ session, showDelete, onDelete }) {

  // Aggregate total sets across all exercises in the session
  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.length, 
    0
  );
    
  /**
   * Calculate Total Volume: (weight * reps) for every set in the session.
   * This provides a high-level metric of the work performed.
   */
  const totalVolume = session.exercises.reduce((total, ex) => {
    const exVol = ex.sets.reduce((exSum, set) => 
      exSum + (set.weight * set.reps), 0
    );
    return total + exVol;
  }, 0);

  // Format the ISO string into a human-readable format (e.g., Oct 12, 2023)
  const formattedDate = new Date(session.start_time).toLocaleDateString(undefined, {
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
        {/* Display only the first 3 exercises to keep the card compact */}
        {session.exercises.slice(0,3).map((exercise) => (
          <span key={exercise.exercise_id}>
            {exercise.exercise_name}{" "}
          </span>
        ))}
        {/* Indicate if there are more exercises than preview shows */}
        {session.exercises.length > 3 && (
          <span>and {session.exercises.length - 3} more...</span>
        )}
      </div>
      {showDelete &&(
        <button 
          className="button-5" onClick={() => onDelete?.(session.id)}>X</button>
      )}
    </div>
  );
};
/**
 * ExerciseListEditor.jsx
 * Shared component for managing a collection of exercises and sets.
 * Used by both WorkoutDetail (Templates) and SessionDetail (Logs).
 */
import { useState } from "react";
import ExerciseSearchModal from "./ExerciseSearchModal";

export default function ExerciseListEditor({ 
  exercises, 
  isEditing, 
  onUpdateExercises 
}) {

  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
  * Transforms raw library exercises into the 'Performance' structure 
  * required by the workout/session schema.
  */
  const handleConfirmSelection = (newFromLibrary) => {
    const newItems = newFromLibrary.map((ex) => ({
      exercise_id: ex.id,
      name: ex.name,
      sets: [{ weight: 0, reps: 0 }],
      // Add any other default metadata needed for a new log/template
    }));

    onUpdateExercises([...exercises, ...newItems]);
    setIsModalOpen(false);
  };
  
  const handleUpdateSet = (exerciseID, setIndex, field, value) => {
    const updated = exercises.map(ex => {
      if (ex.exercise_id !== exerciseID) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s)
      };
    });
    onUpdateExercises(updated);
  };

  const handleAddSet = (exerciseID) => {
    const updated = exercises.map(ex => {
      if (ex.exercise_id !== exerciseID) return ex;
      const lastSet = ex.sets[ex.sets.length - 1] || { weight: 0, reps: 0 };
      return { ...ex, sets: [...ex.sets, { ...lastSet }] };
    });
    onUpdateExercises(updated);
  };

  const handleRemoveSet = (exerciseID, setIndex) => {
    const updated = exercises.map(ex => {
      if (ex.exercise_id !== exerciseID) return ex;
      return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
    });
    onUpdateExercises(updated);
  };

  /**
   * Removes an entire exercise from the sequence.
   */
  const handleRemoveExercise = (exerciseID) => {
    const updated = exercises.filter(ex => ex.exercise_id !== exerciseID);
    onUpdateExercises(updated);
  };

  return (
    <section className="exercise-sequence">
      {exercises.map((exercise) => (
        <div key={exercise.exercise_id} className='exercise-card'>
          <header className='exercise-card-header'>
            <h3>{exercise.exercise_name || exercise.name}</h3>
            
            {isEditing && (
              <button 
                className='button-5-small' 
                onClick={() => handleRemoveExercise(exercise.exercise_id)}
              >
                Remove Exercise
              </button>
            )}
          </header>

          <table className="sets-table">
            <thead>
              <tr>
                <th>Set</th>
                <th>Weight</th>
                <th>Reps</th>
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((set, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={set.weight} 
                        onChange={(e) => handleUpdateSet(exercise.exercise_id, idx, "weight", parseFloat(e.target.value))}
                      />
                    ) : set.weight}
                  </td>
                  <td>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="table-input"
                        value={set.reps} 
                        onChange={(e) => handleUpdateSet(exercise.exercise_id, idx, "reps", parseInt(e.target.value))}
                      />
                    ) : set.reps}
                  </td>
                  {isEditing && (
                    <td className="action-cell">
                      <button 
                        className="button-icon-delete" 
                        onClick={() => handleRemoveSet(exercise.exercise_id, idx)}
                        title="Remove Set"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isEditing && (
            <button onClick={() => handleAddSet(exercise.exercise_id)}>+ Add Set</button>
          )}
        </div>
      ))}

      {isEditing && (
        <>
          <button className="button-3" onClick={() => setIsModalOpen(true)}>
            + Add Exercise
          </button>

          <ExerciseSearchModal 
            isOpen={isModalOpen}
            excludeIds={exercises.map(e => e.exercise_id)}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmSelection}
          />
        </>
      )}
    </section>
  );
}
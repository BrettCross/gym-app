/**
 * WorkoutDetail.jsx
 * 
 * Manages the granular details of a specific Workout Template.
 * 
 * Features:
 * - View mode for inspecting template structure.
 * - Edit mode using a "Drafting" pattern (editedWorkout) to allow discarding changes.
 * - Deep state management for nested sets and exercise sequences.
 * - Exercise selection via searchable modal.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, ServerRouter, useLocation, useParams } from 'react-router-dom';
import apiService from '@utils/apiService';

export default function WorkoutDetail() {
  const { id } = useParams();
  const location = useLocation();

  // UI State
  const [isEditing, setIsEditing] = useState(location.state?.autoEdit || false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [error, setError] = useState(null);

  // Data State
  const [workout, setWorkout] = useState(null);
  const [editedWorkout, setEditedWorkout] = useState(null); // the 'Draft' copy
  // const [workout, setWorkout] = useState({
  //   id: "",
  //   user_id: "",
  //   name: "",
  //   exercises: []
  // });
  
  // Modal/Search State
  const [availableExercises, setAvailableExercises] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const addExerciseDialogRef = useRef(null);
  // const filteredExercises = availableExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /**
   * Fetch template data on mount or when ID changes.
   */
  useEffect(() => {
      const fetchData = async () => {
        setError(null);
        // setIsLoading(true);

        try {
          const response = await apiService.get(`/workouts/${id}`);
          setWorkout(response.data);
          // if coming from 'Create Workout' - initialize draft immediately
          if (location.state?.autoEdit) {
            setEditedWorkout(response.data);
          }
        } catch (err) {
          const message = err.response?.data?.detail || "Failed to fetch workout";
          setError(message);
          // console.error("Failed to fetch workout", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [id, location.state?.autoEdit]);

  /**
   * Enters edit mode by creating a deep copy of the current workout.
   */
  const handleEditWorkout = () => {
    setIsEditing(true);
    setEditedWorkout({ ...workout, exercises: [...workout.exercises] });
  };

  /**
   * Discards changes. 
   * Note: If we added logic to delete a "New" workout on cancel, 
   * we would check location.state.autoEdit here.
   */
  // TODO: if coming from 'Create Workout' - delete? 
  const handleCancel = () => {
    setIsEditing(false);
    setEditedWorkout(null);
    setError(null);
  };

  /**
   * Persists changes to the backend.
   */
  const handleSave = async () => {
    setError(null);
    setActiveAction({ id: id, type: "save" });

    // Normalize payload for backend expectation
    const payload = {
      ...editedWorkout,
      exercises: editedWorkout.exercises.map((e, index) => ({
        exercise_id: e.exercise_id,
        order: index,
        sets: e.sets
      }))
    };

    try {
      const response = await apiService.patch(`/workouts/${id}`, payload);
      setWorkout(response.data);
      setIsEditing(false);
      setEditedWorkout(null);
    } catch (err) {
      // console.error(error.response?.data);
      const message = err.response?.data?.detail || "Failed to save workout";
      setError(message);
    } finally {
      setActiveAction({ id: null, type: null });
    }
  };

  /**
   * Logic for Exercise Search and Selection
   */
  const handleOpenAddExercise = async () => {
    setError(null);
    try {
      const response = await apiService.get('/exercises');
      const currentExIDs = editedWorkout.exercises.map(e => e.exercise_id);
      const filtered = response.data.filter(e => !currentExIDs.includes(e.id));
      setAvailableExercises(filtered);
      addExerciseDialogRef.current.showModal();
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to get exercises";
      setError(message);
    }
  };

  /**
   * Exercise selection toggle within dialog
   */
  const handleToggleExercise = (exercise) => {
    if (selectedExercises.some(e => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  /**
   * Confirm selection of searched exercises
   */
  const handleConfirmAddExercises = () => {
    const newExercises = selectedExercises.map((e, index) => ({
      exercise_id: e.id,
      order: editedWorkout.exercises.length + index,
      sets: [{ weight: 0, reps: 0 }],
      name: e.name,
      muscle_group: e.muscle_group,
      equipment: e.equipment,
      exercise_type: e.exercise_type
    }));

    setEditedWorkout({
      ...editedWorkout,
      exercises: [
        ...editedWorkout.exercises, 
        ...newExercises
      ]
    });

    setSelectedExercises([])
    addExerciseDialogRef.current.close();
  }

  /**
   * Delete exercise from workout template
   * For use within 'Edit' mode
   */
  const handleRemoveExercise = (exerciseID) => {
    setEditedWorkout({
      ...editedWorkout, 
      exercises: editedWorkout.exercises.filter(ex => 
        ex.exercise_id !== exerciseID
      )
    });
  };

  /**
   * Adds a new set to an exercise, duplicating values from the previous set if available.
   */
  const handleAddSet = (exerciseID) => {
    setEditedWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exercise_id !== exerciseID) return ex;
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: 0, reps: 0 };
        return {
          ...ex,
          sets: [...ex.sets, { ...lastSet }]
        };
      })
    }));
  };

  /**
   * Updates the nested 'sets' array for a specific exercise in the draft.
   */
  const handleUpdateSet = (exerciseID, setIndex, field, value) => {
    setEditedWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exercise_id !== exerciseID) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, i) => 
            i === setIndex ? { ...s, [field]: value } : s
          )
        };
      })
    }));
  };

  /**
   * Removes a set from a specific exercise in the draft
   */
  const handleRemoveSet = (exerciseID, setIndex) => {
    setEditedWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exercise_id !== exerciseID) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((_, i) => i !== setIndex)
        };
      })
    }));
    
    // setEditedWorkout({
    //   ...editedWorkout, 
    //   exercises: editedWorkout.exercises.map(e => {
    //     if (e.exercise_id === exerciseID) {
    //       return {
    //         ...e,
    //         sets: e.sets.filter((_, i) => i !== setIndex)
    //       };
    //     }
    //     return e;
    //   })
    // });
  };

  const filteredExercises = availableExercises.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="loading">Loading workout details...</div>;
  if (!workout) return <div className="error">Workout not found.</div>;

  const displayExercises = isEditing ? editedWorkout.exercises : workout.exercises;

    return (
    <>
      {error && <div className="error-banner">{error}</div>}

      {/* Exercise Selection Modal */}
      <dialog ref={addExerciseDialogRef} className="modal-base">
        <header className="container-h">
          <h4>Select Exercises</h4>
          <input
            type="text"
            className="search-input"
            placeholder='Search library...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>
        
        <div className="search-results-list">
          {filteredExercises.map((exercise) => (
            <div 
              key={exercise.id} 
              className={`search-result-item ${selectedExercises.some(e => e.id === exercise.id) ? 'active' : ''}`}
              onClick={() => handleToggleExercise(exercise)}
            >
              <span>{exercise.name}</span>
              <small>{exercise.muscle_group.join(", ")}</small>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className='button-3' onClick={handleConfirmAddExercises} disabled={selectedExercises.length === 0}>
            Add {selectedExercises.length} Selected
          </button>
          <button className='button-link' onClick={() => addExerciseDialogRef.current.close()}>Cancel</button>
        </div>
      </dialog>

      <div className='container-v'>
        <nav>
          <Link to="/workouts">
            <button className="button-link">← Back to Workouts</button>
          </Link>
        </nav>

        {/* Header Toggle: Edit vs View */}
        <header className="workout-header">
          {isEditing ? (
            <div className='container-h'>
              <input 
                className="input-title"
                value={editedWorkout.name} 
                onChange={(e) => setEditedWorkout({...editedWorkout, name: e.target.value})} 
              />
              <div className="button-group">
                <button className='button-4' onClick={handleCancel}>Cancel</button>
                <button 
                  className='button-3' 
                  onClick={handleSave}
                  disabled={activeAction.type === 'save'}
                >
                  {activeAction.type === 'save' ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="container-h">
              <h2>{workout.name}</h2>
              <button className='button-4' onClick={handleEditWorkout}>Edit Template</button>
            </div>
          )}
        </header>

        {/* Localized Edit Controls */}
        {isEditing && (
          <div className="edit-actions-bar">
            <button className='button-3' onClick={handleOpenAddExercise}>+ Add Exercise</button>
          </div>
        )}

        {/* Exercise List */}
        <section className="exercise-sequence">
          {displayExercises.length === 0 ? (
            <p className="empty-notice">No exercises in this template yet. Add some to get started!</p>
          ) : (
            displayExercises.map((exercise) => (
              /* The Exercise Card */
              <div key={exercise.exercise_id} className='exercise-card'>
                <header className='exercise-card-header'>
                  <div className="title-group">
                    <h3 className='exercise-name'>{exercise.name}</h3>
                    <span className="exercise-meta">
                      {exercise.muscle_group.join(", ")} | {exercise.exercise_type}
                    </span>
                  </div>
                  
                  {isEditing && (
                    <button 
                      className='button-5-small' 
                      onClick={() => handleRemoveExercise(exercise.exercise_id)}
                    >
                      Remove
                    </button>
                  )}
                </header>

                <div className="exercise-card-body">
                  <table className="sets-table">
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight (lbs)</th>
                        <th>Reps</th>
                        {isEditing && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, index) => (
                        <tr key={index}>
                          <td className="set-number-cell">{index + 1}</td>
                          
                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="table-input"
                                value={set.weight} 
                                onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "weight", parseFloat(e.target.value))}
                              />
                            ) : (
                              <span className="static-value">{set.weight}</span>
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                className="table-input"
                                value={set.reps} 
                                onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "reps", parseInt(e.target.value))}
                              />
                            ) : (
                              <span className="static-value">{set.reps}</span>
                            )}
                          </td>

                          {isEditing && (
                            <td className="action-cell">
                              <button 
                                className="button-icon-delete" 
                                onClick={() => handleRemoveSet(exercise.exercise_id, index)}
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
                    <button 
                      className="button-add-set" 
                      onClick={() => handleAddSet(exercise.exercise_id)}
                    >
                      + Add Set
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
  // return (
  //   <>
  //   {error && <div className="error-banner">{error}</div>}

  //   {/* Exercise Selection Modal */}
  //   <dialog ref={addExerciseDialogRef}>
  //     <input
  //       type="text"
  //       placeholder='Search...'
  //       value={searchQuery}
  //       onChange={(e) => setSearchQuery(e.target.value)}
  //     />
  //     {filteredExercises.map((exercise) => (
  //       <div key={exercise.id} onClick={() => handleToggleExercise(exercise)}>
  //       {exercise.name} | ID: {exercise.id} | _ID: {exercise._id}
  //       </div>
  //     ))}
  //     <button className='button-3' onClick={() => handleConfirmAddExercises()}>Add</button>
  //   </dialog>
  //   <div className='container-v'>
  //     <Link to="/workouts">
  //       <button>Back</button>
  //     </Link>
  //       {isEditing ? (
  //       <div className='container-h'>
  //         <input 
  //           value={editedWorkout.name} 
  //           onChange={(e) => setEditedWorkout({...editedWorkout, name: e.target.value})} 
  //         />
  //         <div>
  //           <button className='button-4' onClick={() => handleCancel()}>Cancel</button>
  //           <button className='button-3' onClick={() => handleSave()}>Save</button>
  //         </div>
  //         <div><button className='button-4' onClick={() => handleOpenAddExercise()}>Add Exercise</button></div>
  //       </div>
  //       ) : (
  //         <div className="container-h">
  //           <h3>{workout.name}</h3>
  //           <button className='button-4' onClick={() => handleEditWorkout()}>Edit Workout</button>
  //         </div>
  //       )}
  //     {(isEditing ? editedWorkout.exercises : workout.exercises).map((exercise) => (
  //       <div key={exercise.exercise_id} className='result-container'>
  //         <div className='result'>
  //           <h3 className='result-title'>{exercise.name}</h3>
  //           <ol>
  //             {exercise.sets.map((set, index) => (
  //               <li key={index}>
  //                 {isEditing ? (
  //                   <>
  //                     <input 
  //                       type="number" 
  //                       value={set.weight} 
  //                       onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "weight", parseFloat(e.target.value))}
  //                     />
  //                     <span>lbs x</span>
  //                     <input 
  //                       type="number" 
  //                       value={set.reps} 
  //                       onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "reps", parseInt(e.target.value))}
  //                     />
  //                     <span>reps</span>
  //                     <button onClick={() => handleRemoveSet(exercise.exercise_id, index)}>Remove</button>
  //                   </>
  //                 ) : (
  //                   <h4>{set.weight}lbs x {set.reps} reps</h4>
  //                 )}
  //               </li>
  //             ))}
  //           </ol>
  //           {isEditing && (
  //             <button onClick={() => handleAddSet(exercise.exercise_id)}>Add Set</button>
  //           )}
  //         </div>
  //         <div className='button-container'>
  //           {isEditing && (
  //             <button className='button-5' onClick={() => handleRemoveExercise(exercise.exercise_id)}>remove exercise</button>
  //             )}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  //   </>
  // );
// }
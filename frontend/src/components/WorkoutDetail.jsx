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
import { useAuth } from '../context/AuthContext';

export default function WorkoutDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // UI State
  const [isEditing, setIsEditing] = useState(location.state?.autoEdit || false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [error, setError] = useState(null);

  // Data State
  const [workout, setWorkout] = useState(null);
  const [editedWorkout, setEditedWorkout] = useState(null); 
  
  // Modal/Search State
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [libraryTypes, setLibraryTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addExerciseDialogRef = useRef(null);

  /**
   * Fetch template data on mount or when ID changes.
   */
  useEffect(() => {
      const initializeData = async () => {
        setError(null);

        try {
          // const response = await apiService.get(`/workouts/${id}`);
          // setWorkout(response.data);
          const [workoutRes, libRes, typesRes] = await Promise.all([
            apiService.get(`/workouts/${id}`),
            apiService.get('/exercises'),
            apiService.get('/exercises/libraries')
          ]);

          setWorkout(workoutRes.data);
          setExerciseLibrary(libRes.data);
          setLibraryTypes(typesRes.data);

          if (typesRes.data.length > 0) setActiveTab(typesRes.data[0])

          // if coming from 'Create Workout' - initialize draft immediately
          if (location.state?.autoEdit) {
            setEditedWorkout(workoutRes.data);
          }
        } catch (err) {
          const message = err.response?.data?.detail || "Failed to load workout data";
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };
      initializeData();
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
      setExerciseLibrary(filtered);
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
  };

  const filteredExercises = exerciseLibrary.filter(e => {
    const isOwner = e.user_id === currentUserId;

    if (activeTab === 'official' && isOwner) return false;
    if (activeTab === 'personal' && !isOwner) return false;

    const term = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.muscle_group.some(m => m.toLowerCase().includes(term))
    )
  });

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
          <div className="tabs-container">
            {libraryTypes.map(type => (
              <button 
                key={type} 
                onClick={() => setActiveTab(type)}
                className={activeTab === type ? 'active' : ''}
              >
                {type}
              </button>
            ))}
          </div>
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
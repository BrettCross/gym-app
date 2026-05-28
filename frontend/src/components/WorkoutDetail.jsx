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

import { useEffect, useState } from 'react';
import { Link, ServerRouter, useLocation, useParams } from 'react-router-dom';
import apiService from '@utils/apiService';
import ExerciseListEditor from './ExerciseListEditor';
// import { useAuth } from '../context/AuthContext';

export default function WorkoutDetail() {
  const { id } = useParams();
  const location = useLocation();
  // const { user } = useAuth();
  // const currentUserId = user?.id;

  // UI State
  const [isEditing, setIsEditing] = useState(location.state?.autoEdit || false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [error, setError] = useState(null);

  // Data State
  const [workout, setWorkout] = useState(null);
  const [editedWorkout, setEditedWorkout] = useState(null); 

  /**
   * Fetch template data on mount or when ID changes.
   */
  useEffect(() => {
      const initializeData = async () => {
        setError(null);

        try {
          const response = await apiService.get(`/workouts/${id}`);
          setWorkout(response.data);

          // if coming from 'Create Workout' - initialize draft immediately
          if (location.state?.autoEdit) {
            setEditedWorkout(response.data);
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

  if (isLoading) return <div className="loading">Loading workout details...</div>;
  if (!workout) return <div className="error">Workout not found.</div>;

    return (
    <>
      {error && (
        <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <div className='container-v'>
        <nav>
          <Link to="/workouts">
            <button className="button-link">← Back to Workouts</button>
          </Link>
        </nav>

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
              {workout.can_edit && (
                <button className='button-4' onClick={handleEditWorkout}>Edit Template</button>
              )}
            </div>
          )}
        </header>

        <ExerciseListEditor 
          exercises={isEditing ? editedWorkout.exercises : workout.exercises}
          isEditing={isEditing}
          onUpdateExercises={(updated) => setEditedWorkout({ ...editedWorkout, exercises: updated })}
        />
      </div>
    </>
  );
}
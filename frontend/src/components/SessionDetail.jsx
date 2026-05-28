/**
 * SessionDetail.jsx
 * 
 * Manages the granular details of a specific Session.
 * 
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ExerciseListEditor from "./ExerciseListEditor";
import apiService from "../utils/apiService";

export default function SessionDetail() {
  const { id } = useParams();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(location.state?.editMode || false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [session, setSession] = useState(null);
  const [editedSession, setEditedSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      setError(null);
      try {
        const response = await apiService.get(`/sessions/${id}`);
        setSession(response.data);

        if (location.state?.editMode) {
          setEditedSession(response.data);
        }
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to load session data.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [id, location.state?.editMode]);

  /**
   * Enters edit mode by creating a deep copy of the current workout.
   */
  const handleEdit = () => {
    setIsEditing(true);
    setEditedSession({ ...session, exercises: [...session.exercises] });
  };

  /**
   * Discards changes
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditedSession(null);
    setError(null);
  };

  /**
   * Persists changes to the backend.
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const payload = {
      ...editedSession,
      exercises: editedSession.exercises.map((e, index) => ({
        exercise_id: e.exercise_id,
        order: index,
        sets: e.sets
      }))
    };
    try {
      const response = await apiService.patch(`/sessions/${id}`, payload);
      setSession(response.data);
      setIsEditing(false);
      setEditedSession(null);
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to save session";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // /**
  //  * Adds a new set to an exercise, duplicating values from the previous set if available.
  //  */
  // const handleAddSet = (exerciseID) => {
  //   setEditedSession(prev => ({
  //     ...prev,
  //     exercises: prev.exercises.map(ex => {
  //       if (ex.exercise_id !== exerciseID) return ex;
  //       const lastSet = ex.sets[ex.sets.length - 1] || { weight: 0, reps: 0 };
  //       return {
  //         ...ex,
  //         sets: [...ex.sets, { ...lastSet }]
  //       };
  //     })
  //   }));
  // };

  // /**
  //  * Updates the nested 'sets' array for a specific exercise in the session.
  //  */
  // const handleUpdateSet = (exerciseID, setIndex, field, value) => {
  //   setEditedSession(prev => ({
  //     ...prev,
  //     exercises: prev.exercises.map(ex => {
  //       if (ex.exercise_id !== exerciseID) return ex;
  //       return {
  //         ...ex,
  //         sets: ex.sets.map((s, i) => 
  //           i === setIndex ? { ...s, [field]: value } : s
  //         )
  //       };
  //     })
  //   }));
  // };

  // /**
  //  * Removes a set from a specific exercise in the draft
  //  */
  // const handleRemoveSet = (exerciseID, setIndex) => {
  //   setEditedSession(prev => ({
  //     ...prev,
  //     exercises: prev.exercises.map(ex => {
  //       if (ex.exercise_id !== exerciseID) return ex;
  //       return {
  //         ...ex,
  //         sets: ex.sets.filter((_, i) => i !== setIndex)
  //       };
  //     })
  //   }));
  // };

  if (isLoading) return <div className="loading">Loading session details...</div>;
  if (!session) return <div className="error">Session not found.</div>;

  // const displayData = isEditing ? editedSession : session;
  
  return (
    <div className='container-v'>
      {error && (
        <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      <nav>
        <Link to="/sessions" className="button-link">← Back to Sessions</Link>
      </nav>

      <header className="workout-header">
        <div className="container-h">
          {isEditing ? (
             <input 
               className="input-title"
               value={editedSession.workout_name} 
               onChange={(e) => setEditedSession({...editedSession, workout_name: e.target.value})} 
             />
          ) : (
            <h2>{session.workout_name}</h2>
          )}
          
          <div className="button-group">
            {isEditing ? (
              <>
                <button className='button-4' onClick={handleCancel}>Cancel</button>
                <button className='button-3' onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              session.can_edit && <button className='button-4' onClick={handleEdit}>Edit Log</button>
            )}
          </div>
        </div>
        <p className="session-date-subtitle">
          {new Date(session.start_time).toLocaleString()}
        </p>
      </header>

      <ExerciseListEditor 
        exercises={isEditing ? editedSession.exercises : session.exercises}
        isEditing={isEditing}
        onUpdateExercises={(updated) => setEditedSession({ ...editedSession, exercises: updated })}
      />
    </div>
  );
}
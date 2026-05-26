/**
 * Workouts.jsx
 * 
 * Acts as the management hub for Workout Templates (blueprints).
 * 
 * Responsibilities:
 * - Fetches and displays all user-defined workout templates.
 * - Handles template lifecycle: Creation, Deletion, and Initialization.
 * - Orchestrates the transition from a Template to an active Training Session (Snapshot).
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import apiService from '@utils/apiService'

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  /**
   * Fetches the user's workout library on mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.get('/workouts');
        setWorkouts(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load workouts. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * Creates a new blank workout template and redirects to the editor.
   * Uses a timestamped placeholder name to ensure uniqueness.
   */
  const handleNewWorkout = async () => {
    setError(null);
    // workout doesn't exist yet so no ID
    setActiveAction({ id: null, type: "create"});

    const uniqueName = `New Workout ${new Date().toJSON()}`;
    try {
      const response = await apiService.post('/workouts', {
        name: uniqueName,
        exercises: []
      });
      navigate(`/workouts/${response.data.id}`, { state: { autoEdit: true } });
    } catch (err) {
      console.error("Error creating workout:", err);
    } finally {
      setActiveAction({ id: null, type: null });
    }
  };

  /**
   * Permanently removes a workout template.
   * Note: This does not affect historical Sessions already created from this template.
   */
  const handleDelete = async (workoutID) => {
    setError(null);
    if (!window.confirm("Are you sure? This template will be lost forever!")) return;
    
    setActiveAction({ id: workoutID, type: "delete" });
    try {
      await apiService.delete(`/workouts/${workoutID}`);
      setWorkouts(prev => prev.filter(ex => ex.id !== workoutID));
    } catch (err) {
      const message = err.response?.data?.detail || "Error deleting workout";
      setError(message);
      console.error("Error deleting workout:", err.response?.data);
    } finally {
      setActiveAction({ id: null, type: null });
    }
  };

  /**
   * THE SNAPSHOT HAND-OFF:
   * Takes a template and creates a new 'Session' entry in the DB.
   * This preserves the state of the workout at the moment of starting.
   */
  const handleStartSession = async (workoutID, workoutName) => {
    setError(null);
    setActiveAction({ id: workoutID, type: "start" });

    try {
      // The backend uses the workout_id to pull the template exercises 
      // and 'snap' them into a new Session document.
      const response = await apiService.post("/sessions", {
        workout_id: workoutID,
        workout_name: workoutName
      });

      navigate(`/session/${response.data.id}`);
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to start session";
      setError(message);
    } finally {
      setActiveAction({ id: null, type: null });
    }
  };

  if (isLoading) return <div className="loading">Fetching templates...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <>
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Workouts</h4>

        <button 
          className='button-3' 
          disabled={activeAction.type === "create"}
          onClick={handleNewWorkout}
        >
          {activeAction.type === "create" ? "Creating..." : "New Workout"}
        </button>
      </div>
      {workouts.map((workout) => (
        <div key={workout.id} className='result-container'>
          <div className='result'>
            <Link to={`/workouts/${workout.id}`}>
              <h3 className='result-title'>{workout.name}</h3>
            </Link>
            <h5 className='result-desc'>
              {workout.exercises.length} {workout.exercises.length == 1 ? "exercise" : "exercises"}
            </h5>

            <button 
              className='button' 
              disabled={activeAction.type === "start" && activeAction.id === workout.id}
              onClick={() => handleStartSession(workout.id, workout.name)}
            >
              {activeAction.type === "start" && activeAction.id === workout.id ? "Starting..." : "Start Session"}
            </button>

          </div>
          <div className='button-container'>
            {workout.can_delete && (
              <button 
                className='button-5' 
                disabled={activeAction.type === "delete" && activeAction.id === workout.id}
                onClick={() => handleDelete(workout.id)}
                >
                {activeAction.type === "delete" && activeAction.id === workout.id ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
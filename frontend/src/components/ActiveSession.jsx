/**
 * ActiveSession.jsx
 * 
 * Manages an ongoing workout session. 
 * Includes logic for tracking sets, adding/removing exercises.
 * 
 * Features:
 * - Track completed sets/exercises
 * - add/remove exercises
 * - add/remove sets
 * - Exercise selection via searchable modal
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../utils/apiService";

export default function ActiveSession() {
  // Data State
  const [activeSession, setActiveSession] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([])
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [error, setError] = useState(null);

  const addExerciseDialogRef = useRef(null);
  const navigate = useNavigate();
  const { sessionID } = useParams();
  
  // Filter logic for exercise selection modal
  const filteredExercises = availableExercises.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Effect: Initial data fetch for the session.
   */
  useEffect(() => {
    const fetchData = async () => {
      setError(null);

      try {
        setIsLoading(true);
        const response = await apiService.get(`/sessions/${sessionID}`)
      
        const decoratedExercises = response.data.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => ({
            ...set,
            completed: false
          }))
        }));

        setActiveSession({
          ...response.data,
          exercises: decoratedExercises
        });
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to fetch session";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionID]);

  // --- Set Management ---

  const toggleSetCompletion = (exerciseID, setIndex) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exercise_id !== exerciseID) return ex;
        const updatedSets = ex.sets.map((set, i) => {
          if (i !== setIndex) return set;
          return { ...set, completed: !set.completed };
        });
        return { ...ex, sets: updatedSets };
      })
    }));
  };

  const handleAddSet = (exerciseID) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.exercise_id === exerciseID) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, {
              reps: lastSet ? lastSet.reps : 0,
              weight: lastSet ? lastSet.weight : 0,
              completed: false
            }]
          };
        }
        return e;
      })
    }));
  };

  const handleUpdateSet = (exerciseID, setIndex, field, value) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.exercise_id === exerciseID) {
          return {
            ...e,
            sets: e.sets.map((s, i) => 
              i === setIndex ? { ...s, [field]: value } : s
            )
          };
        }
        return e;
      })
    }));
  };

  const handleDeleteSet = (exerciseID, setIndex) => {
    setActiveSession(prev => ({
      ...prev, 
      exercises: prev.exercises.map(e => {
        if (e.exercise_id === exerciseID) {
          return {
            ...e,
            sets: e.sets.filter((_, i) => i !== setIndex)
          };
        }
        return e;
      })
    }));
  };

  // --- Exercise Management ---

  const handleAddExerciseRequest = async () => {
    setError(null);
    setActiveAction({ id: null, type: "add" })

    try {
      const response = await apiService.get('/exercises');
      const curExIDs = activeSession.exercises.map(e => e.exercise_id);
      const filtered = response.data.filter(e => !curExIDs.includes(e.id));
      setAvailableExercises(filtered);
      addExerciseDialogRef.current.showModal();
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to add exercise";
      setError(message);
    } finally {
      setActiveAction({ id: null, type: null })
    }
  };

  const handleDeleteExercise = (exerciseID) => {
      setActiveAction({ id: exerciseID, type: "delete" })
      setActiveSession(prev => ({
        ...prev, 
        exercises: prev.exercises.filter(ex => ex.exercise_id !== exerciseID)
      }));
      setActiveAction({ id: null, type: null })
    };

  const handleCancel = async () => {
    const isConfirmed = window.confirm("Are you sure? This will discard all progress of the current session.");
    if (isConfirmed) {
      try {
        setActiveAction({ id: null, type: "cancel" })
        await apiService.delete(`/sessions/${sessionID}`);
        navigate("/workouts");
      } catch (error) {
        console.error("Error deleting session:", error.response?.data);
        navigate("/workouts");
      } finally {
        setActiveAction({ id: null, type: null })
      }
    }
  };

  const handleFinish = async () => {
    // collect only the completed sets
    const filteredExercises = activeSession.exercises
    .map(ex => ({
      exercise_id: ex.exercise_id,
      sets: ex.sets.filter(s => s.completed)
      .map(s => ({
        reps: s.reps,
        weight: s.weight
      }))
    }))
    .filter(ex => ex.sets.length > 0);

    if (filteredExercises.length === 0) {
      alert("You haven't completed any sets!");
      return;
    }

    try {
      setError(null);
      setActiveAction({ id: null, type: "finish" });
      const payload = {
        exercises: filteredExercises,
        end_time: new Date().toISOString()
      };
      await apiService.patch(`/sessions/${activeSession.id}`, payload);
      navigate('/workouts');
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to log session. Please try again.";
      setError(message);
    } finally {
      setActiveAction({ id: null, type: null });
    }
  };

  const handleToggleExercise = (exercise) => {
    if (selectedExercises.some(e => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleConfirmAddExercises = () => {
    const newExercises = selectedExercises.map((e, index) => ({
      exercise_id: e.id,
      order: activeSession.exercises.length + index,
      sets: [{ weight: 0, reps: 0, completed: false }],
      name: e.name
    }));

    setActiveSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...newExercises]
    }));
    setSelectedExercises([])
    setSearchQuery('');
    addExerciseDialogRef.current.close();
  }

  if (isLoading) return <div>Loading your workout...</div>;

  return (
    <>
    {error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}

    <dialog ref={addExerciseDialogRef}>
      <input
        type="text"
        placeholder='Search...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {filteredExercises.map((exercise) => (
        <div key={exercise.id} onClick={() => handleToggleExercise(exercise)}>
        {exercise.name}
        </div>
      ))}
      <button className='button-3' onClick={() => handleConfirmAddExercises()}>Add</button>
    </dialog>
    <div className='container-h'>
      <div className='result'>
        <h3 className='result-title'>{activeSession.workout_name}</h3>
      </div>
      <div className='button-container'>
        <button 
          className='button-4'
          disabled={activeAction.type === "cancel"}
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button 
        className='button-3' 
        disabled={activeAction.type === "finish"}
        onClick={handleFinish}
        >
          {activeAction.type === "finish" ? "Saving..." : "Finish"}
        </button>
      </div>
    </div>
    {activeSession.exercises.map((exercise) => (
      <div key={exercise.exercise_id}>
        <div className="container-h">
          <h4>{exercise.exercise_name}</h4>
          <button 
            className='button-5' 
            disabled={activeAction.id === exercise.exercise_id && activeAction.type === "delete"}
            onClick={() => handleDeleteExercise(exercise.exercise_id)}
          >
            Delete
          </button>
        </div>
        {exercise.sets.map((set, setIdx) => (
          <div key={setIdx}>
            <span>Set {setIdx + 1}</span>
            <input 
              type="number"
              value={set.weight}
              onChange={(e) => handleUpdateSet(exercise.exercise_id, setIdx, 'weight', e.target.value)}
            />
            <span>lbs </span>
            <input 
              type="number"
              value={set.reps}
              onChange={(e) => handleUpdateSet(exercise.exercise_id, setIdx, 'reps', e.target.value)}
            />
            <span>reps </span>
            <input 
              type="checkbox" 
              checked={set.completed} 
              onChange={() => toggleSetCompletion(exercise.exercise_id, setIdx)} 
            />
            <button onClick={() => handleDeleteSet(exercise.exercise_id, setIdx)}>x</button>
          </div>
        ))}
        <button onClick={() => handleAddSet(exercise.exercise_id)}>Add Set</button>
      </div>
    ))}

    <button 
      className="button-3" 
      disabled={activeAction.type === "add"}
      onClick={() => handleAddExerciseRequest()}
    >
      {activeAction.type === "add" ? "Saving..." : "Add Exercise"}
    </button>
    </>
  );
}
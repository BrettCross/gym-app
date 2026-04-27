import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../utils/apiService";

export default function ActiveSession() {
  const [activeSession, setActiveSession] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([])
  const [searchQuery, setSearchQuery] = useState('');
  const filteredExercises = availableExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const addExerciseDialogRef = useRef(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  
  const navigate = useNavigate();
  let params = useParams();
  const workoutID = params.workoutID;
  
  

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get(`/workouts/${workoutID}`)
      
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
    };
    fetchData();
  }, [workoutID]);

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
    setActiveSession({
      ...activeSession,
      exercises: activeSession.exercises.map(e => {
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
    });
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

  const handleAddExercise = async () => {
    // setIsAddingExercise(true);
    try {
      const response = await apiService.get('/exercises');
      const exercises = response.data;
      const curExIDs = activeSession.exercises.map(e => e.exercise_id);
      const filtered = exercises.filter(e => !curExIDs.includes(e.id));
      setAvailableExercises(filtered);
      addExerciseDialogRef.current.showModal();
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  const handleDeleteExercise = (exerciseID) => {
      console.log(`exerciseID: ${exerciseID}`)
      setActiveSession(prev => ({
        ...prev, 
        exercises: prev.exercises.filter(ex => ex.exercise_id !== exerciseID)
      }));
    };

  const handleCancel = () => {
    const isConfirmed = window.confirm("Are you sure? This will discard all progress of the current session.");
    if (isConfirmed) {
      navigate("/workouts");
    }
  };

  const handleFinish = async () => {
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

    const payload = {
      workout_id: workoutID,
      workout_name: activeSession.name,
      exercises: filteredExercises,
      date: new Date().toISOString()
    };

    try {
      await apiService.post('/sessions', payload);
      navigate('/workouts');
    } catch (error) {
      console.error("Failed to save session", error)
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

  if (!activeSession) return <div>Loading your workout...</div>;

  return (
    <>
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
        <h3 className='result-title'>{activeSession.name}</h3>
      </div>
      <div className='button-container'>
            <button className='button-4' onClick={handleCancel}>Cancel</button>
            <button className='button-3' onClick={handleFinish}>Finish</button>
          </div>
    </div>
    {activeSession.exercises.map((exercise) => (
      <div key={exercise.exercise_id}>
        <div className="container-h">
          <h4>{exercise.name}</h4>
          <button className='button-5' onClick={() => handleDeleteExercise(exercise.exercise_id)}>Delete</button>
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
    <button className="button-3" onClick={() => handleAddExercise()}>Add Exercise</button>
    </>
  );
}
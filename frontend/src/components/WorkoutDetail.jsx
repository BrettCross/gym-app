import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiService from '@utils/apiService';

export default function WorkoutDetail() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedWorkout, setEditedWorkout] = useState(null)
  const [workout, setWorkout] = useState({
    id: "",
    user_id: "",
    name: "",
    exercises: []
  });
  // const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [availableExercises, setAvailableExercises] = useState([])
  const [searchQuery, setSearchQuery] = useState('');
  const filteredExercises = availableExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const addExerciseDialogRef = useRef(null);
  const [selectedExercises, setSelectedExercises] = useState([]);

  const params = useParams();

  useEffect(() => {
      const fetchData = async () => {
        const response = await apiService.get(`/workouts/${params.id}`);
        console.log(response)
        setWorkout(response.data);
      };
      fetchData(params.id);
    }, [params.id]);

    const handleEditWorkout = () => {
      setIsEditing(true);
      setEditedWorkout({ ...workout, exercises: [...workout.exercises] });
    };

    const handleCancel = () => {
      setIsEditing(false);
      setEditedWorkout(null);
    };

    const handleSave = async () => {
      const payload = {
        ...editedWorkout,
        exercises: editedWorkout.exercises.map((e, index) => ({
          exercise_id: e.exercise_id,
          order: index,
          sets: e.sets
        }))
      };

      try {
        const response = await apiService.patch(`/workouts/${workout.id}`, payload);
        // const detail = await apiService.get(`/workouts/${params.id}`);
        setWorkout(response.data);
        setIsEditing(false);
        setEditedWorkout(null);
      } catch (error) {
        console.error(error.response?.data);
      }
    };

    const handleAddExercise = async () => {
      // setIsAddingExercise(true);
      try {
        const response = await apiService.get('/exercises');
        const exercises = response.data;
        const curExIDs = editedWorkout.exercises.map(e => e.exercise_id);
        const filtered = exercises.filter(e => !curExIDs.includes(e.id));
        setAvailableExercises(filtered);
        addExerciseDialogRef.current.showModal();
      } catch (error) {
        console.error(error.response?.data);
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
        order: editedWorkout.exercises.length + index,
        sets: [{ weight: 0, reps: 0 }],
        name: e.name,
        muscleGroup: e.muscleGroup,
        equipment: e.equipment,
        exerciseType: e.exerciseType
      }));

      setEditedWorkout({
        ...editedWorkout,
        exercises: [...editedWorkout.exercises, ...newExercises]
      });
      setSelectedExercises([])
      addExerciseDialogRef.current.close();
    }
    const handleRemoveExercise = (exerciseID) => {
      console.log(`exerciseID: ${exerciseID}`)
      setEditedWorkout({...editedWorkout, exercises: editedWorkout.exercises.filter(ex => ex.exercise_id !== exerciseID)});
    };

    const handleAddSet = (exerciseID) => {
      setEditedWorkout({
        ...editedWorkout,
        exercises: editedWorkout.exercises.map(e => {
          if (e.exercise_id === exerciseID) {
            const lastSet = e.sets[e.sets.length - 1];
            return {
              ...e,
              sets: [...e.sets, { weight: lastSet.weight, reps: lastSet.reps }]
            };
          }
          return e;
        })
      });
    };

    const handleUpdateSet = (exerciseID, setIndex, field, value) => {
      setEditedWorkout({
        ...editedWorkout,
        exercises: editedWorkout.exercises.map(e => {
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
      });
    };

    const handleRemoveSet = (exerciseID, setIndex) => {
      setEditedWorkout({
        ...editedWorkout, 
        exercises: editedWorkout.exercises.map(e => {
          if (e.exercise_id === exerciseID) {
            return {
              ...e,
              sets: e.sets.filter((_, i) => i !== setIndex)
            };
          }
          return e;
        })
      });
    };

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
    <div className='container-v'>
      <Link to="/workouts">
        <button>Back</button>
      </Link>
        {isEditing ? (
        <div className='container-h'>
          <input 
            value={editedWorkout.name} 
            onChange={(e) => setEditedWorkout({...editedWorkout, name: e.target.value})} 
          />
          <div>
            <button className='button-4' onClick={() => handleCancel()}>Cancel</button>
            <button className='button-3' onClick={() => handleSave()}>Save</button>
          </div>
          <div><button className='button-4' onClick={() => handleAddExercise()}>Add Exercise</button></div>
        </div>
        ) : (
          <div className="container-h">
            <h3>{workout.name}</h3>
            <button className='button-4' onClick={() => handleEditWorkout()}>Edit Workout</button>
          </div>
        )}
      {(isEditing ? editedWorkout.exercises : workout.exercises).map((exercise) => (
        <div key={exercise.exercise_id} className='result-container'>
          <div className='result'>
            <h3 className='result-title'>{exercise.name}</h3>
            <ol>
              {exercise.sets.map((set, index) => (
                <li key={index}>
                  {isEditing ? (
                    <>
                      <input 
                        type="number" 
                        value={set.weight} 
                        onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "weight", parseFloat(e.target.value))}
                      />
                      <span>lbs x</span>
                      <input 
                        type="number" 
                        value={set.reps} 
                        onChange={(e) => handleUpdateSet(exercise.exercise_id, index, "reps", parseInt(e.target.value))}
                      />
                      <span>reps</span>
                      <button onClick={() => handleRemoveSet(exercise.exercise_id, index)}>Remove</button>
                    </>
                  ) : (
                    <h4>{set.weight}lbs x {set.reps} reps</h4>
                  )}
                </li>
              ))}
            </ol>
            {isEditing && (
              <button onClick={() => handleAddSet(exercise.exercise_id)}>Add Set</button>
            )}
          </div>
          <div className='button-container'>
            {isEditing && (
              <button className='button-5' onClick={() => handleRemoveExercise(exercise.exercise_id)}>remove exercise</button>
              )}
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
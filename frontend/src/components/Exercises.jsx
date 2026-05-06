import { useEffect, useRef, useState } from 'react'
import apiService from '@utils/apiService'

function ExerciseForm({ onExerciseAdded, exerciseToEdit }) {
  const [exercise, setExercise] = useState(
    exerciseToEdit ? {
      name: exerciseToEdit.name,
      equipment: exerciseToEdit.equipment.join(", "),
      muscle_group: exerciseToEdit.muscle_group.join(", "),
      exercise_type: exerciseToEdit.exercise_type,
    } : {
      name: "",
      equipment: "",
      muscle_group: "",
      exercise_type: "",
    }
  );

  // useEffect(() => {
  //   if (exerciseToEdit) {
  //     setExercise({
  //       name: exerciseToEdit.name,
  //       equipment: exerciseToEdit.equipment.join(", "),
  //       muscleGroup: exerciseToEdit.muscleGroup.join(", "),
  //       exerciseType: exerciseToEdit.exerciseType,
  //     });
  //   } else {
  //     setExercise({
  //       name: "",
  //       equipment: "",
  //       muscleGroup: "",
  //       exerciseType: "",
  //     });
  //   }
  // }, [exerciseToEdit]);

  const handleChange = (e) => {
    setExercise({ ...exercise, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      ...exercise,
    };

    const equipList = payload.equipment.split(",");
    const cleanEquipList = equipList.map(item => item.trim());
    payload.equipment = cleanEquipList;

    const muscleList = payload.muscle_group.split(",");
    const cleanMuscleList = muscleList.map(item => item.trim());
    payload.muscle_group = cleanMuscleList;

    // check if editing or creating
    if (exerciseToEdit != null) {
      await apiService.put(`/exercises/${exerciseToEdit.id}`, payload)
      onExerciseAdded({ ...payload, id: exerciseToEdit.id }, "edit")
    } else {
      const response = await apiService.post('/exercises', payload);
      onExerciseAdded(response.data, "create");
    }

    // reset form
    setExercise({
      name: "",
      equipment: "",
      muscle_group: "",
      exercise_type: "",
    });
  };

  return (
    <form action="" onSubmit={handleSubmit}>
      {["name", "equipment", "muscle_group", "exercise_type"].map((field) => (
        <div key={field}>
          <label htmlFor={field}>{field}</label>
          <input 
          type="text" 
          key={field} 
          name={field} 
          placeholder={field} 
          value={exercise[field]} 
          onChange={handleChange} 
          required
          />
        </div>
      ))}
      <button type='submit' className='button-3'>Add</button>
    </form>
  );
}

export default function Exercises() {

  // Define and set state
  const [exercises, setExercises] = useState([]);
  const [exerciseToEdit, setExerciseToEdit] = useState(null)
  
  // form visibility state
  // const [showForm, setShowForm] = useState(false);

  const dialogRef = useRef(null);

  const handleShowForm = (exercise) => {
    // setShowForm(true);
    setExerciseToEdit(exercise);
    dialogRef.current.showModal();
  };

  const handleCloseAndRefresh = (updatedExercise, action) => {
    dialogRef.current.close();
    setExerciseToEdit(null);
    // loadExercises();
    if (action === "edit") {
      setExercises(exercises.map( ex => 
        ex.id === updatedExercise.id ? updatedExercise : ex
      ));
    } else if (action === "create") {
      setExercises([...exercises, updatedExercise])
    }
  };
  
  const handleDelete = async (exerciseID) => {
    await apiService.delete(`/exercises/${exerciseID}`);
    setExercises(exercises.filter(ex => ex.id !== exerciseID));
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get('/exercises');
      setExercises(response.data);
    };
    fetchData();
  }, []);

  return (
    <>
    <dialog ref={dialogRef}>
      <ExerciseForm
        key={exerciseToEdit ? exerciseToEdit.id : "create"}
        onExerciseAdded={handleCloseAndRefresh} 
        exerciseToEdit={exerciseToEdit} 
      />
    </dialog>
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Exercises</h4>
        <button className='button-3' onClick={() => handleShowForm(null)}>Create Exercise</button>
      </div>
      {exercises.map((exercise) => (
        <div key={exercise.id} className='result-container'>
          <div className='result'>
            <h3 className='result-title'>{exercise.name}</h3>
            <h5 className='result-desc'>{exercise.muscle_group} | {exercise.equipment} | {exercise.exercise_type}</h5>
          </div>
          <div className='button-container'>
            {/* <button className='button-4' onClick={() => handleEdit(exercise.id)}>Edit</button> */}
            <button className='button-4' onClick={() => handleShowForm(exercise)}>Edit</button>
            <button className='button-5' onClick={() => handleDelete(exercise.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
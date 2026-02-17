import { useEffect, useState } from 'react'
import apiService from '@utils/apiService'


export default function ExerciseList() {

  // Define and set state
  const [exercises, setExercises] = useState([]);

  
  // Load all books when component is first mounted
  useEffect(() => {
    // Get exercises from Database
    const loadExercises = async() => {
      const response = await apiService.get('/exercises');
      setExercises(response.data);
    };

    loadExercises();

  }, []);

  return (
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Exercises</h4>
        <button className='button-3'>Create Exercise</button>
      </div>
      {exercises.map((exercise) => (
        <div key={exercise.id} className='result-container'>
          <div className='result'>
            <h3 className='result-title'>{exercise.name}</h3>
            <h5 className='result-desc'>{exercise.muscleGroup}</h5>
          </div>
          <div className='button-container'>
            <button className='button-4'>Edit</button>
            <button className='button-5'>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
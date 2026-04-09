import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import apiService from '@utils/apiService'

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get('/workouts');
      setWorkouts(response.data);
    };
    fetchData();
  }, []);

  const handleDelete = async (workoutID) => {
    await apiService.delete(`/workouts/${workoutID}`);
    setWorkouts(workouts.filter(ex => ex.id !== workoutID));
  };

  return (
    <>
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Workouts</h4>
        <button className='button-3'>New Workout</button>
      </div>
      {workouts.map((workout) => (
        <div key={workout.id} className='result-container'>
          <div className='result'>
            <Link to={`/workouts/${workout.id}`}>
              <h3 className='result-title'>{workout.name}</h3>
            </Link>
            <h5 className='result-desc'>{workout.exercises.length} {workout.exercises.length == 1 ? "exercise" : "exercises"}</h5>
          </div>
          <div className='button-container'>
            <button className='button-5' onClick={() => handleDelete(workout.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
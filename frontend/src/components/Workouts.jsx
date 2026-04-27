import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import apiService from '@utils/apiService'

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get('/workouts');
      setWorkouts(response.data);
    };
    fetchData();
  }, []);

  const handleNewWorkout = async () => {
    const uniqueName = `New Workout ${new Date().toLocaleDateString()}`;
    const response = await apiService.post('/workouts', {
      name: uniqueName,
      exercises: []
    });
    navigate(`/workouts/${response.data.id}`, { state: { autoEdit: true } });
  };

  const handleDelete = async (workoutID) => {
    await apiService.delete(`/workouts/${workoutID}`);
    setWorkouts(workouts.filter(ex => ex.id !== workoutID));
  };

  const handleStartSession = (workoutID) => {
    navigate(`/session/${workoutID}`);
  };

  return (
    <>
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Workouts</h4>
        <button className='button-3' onClick={handleNewWorkout}>New Workout</button>
      </div>
      {workouts.map((workout) => (
        <div key={workout.id} className='result-container'>
          <div className='result'>
            <Link to={`/workouts/${workout.id}`}>
              <h3 className='result-title'>{workout.name}</h3>
            </Link>
            <h5 className='result-desc'>{workout.exercises.length} {workout.exercises.length == 1 ? "exercise" : "exercises"}</h5>
            <button className='button' onClick={() => handleStartSession(workout.id)}>Start Session</button>
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
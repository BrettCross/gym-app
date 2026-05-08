/**
 * Exercises.jsx
 * 
 * Manages the exercise library. 
 * Features:
 * - CRUD operations for exercise definitions.
 * - Modal-based form for creating and editing exercises.
 * - Robust parsing of comma-separated inputs for equipment and muscle groups.
 */
import { useEffect, useRef, useState } from 'react'
import apiService from '@utils/apiService'

/**
 * ExerciseForm Component
 * Handles the state and submission logic for creating or updating an exercise.
 * 
 * @param {Function} props.onExerciseAdded - Callback triggered after successful API response.
 * @param {Object|null} props.exerciseToEdit - Existing exercise data if in "edit" mode.
 */
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

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setExercise({ ...exercise, [e.target.name]: e.target.value });
  };

  /**
   * Sanitizes input data before sending to the backend.
   * Converts comma-separated strings into trimmed arrays.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Prepare payload: split strings into arrays and remove whitespace/empty entries
    const payload = {
      ...exercise,
      equipment: exercise.equipment.split(",").map(i => i.trim()).filter(Boolean),
      muscle_group: exercise.muscle_group.split(",").map(i => i.trim()).filter(Boolean),
    };

    try {
      if (exerciseToEdit) {
        await apiService.put(`/exercises/${exerciseToEdit.id}`, payload)
        onExerciseAdded({ ...payload, id: exerciseToEdit.id }, "edit")
      } else {
        const response = await apiService.post('/exercises', payload);
        onExerciseAdded(response.data, "create");
      }
      // Reset form fields on success
      setExercise({ name: "", equipment: "", muscle_group: "", exercise_type: "" });
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to save exercise. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className='error-message'>{error}</div>}
      {["name", "equipment", "muscle_group", "exercise_type"].map((field) => (
        <div key={field}>
          <label htmlFor={field}>{field.replace("_", " ")}</label>
          <input 
          type="text" 
          name={field} 
          placeholder={field.replace("_", " ")} 
          value={exercise[field]} 
          onChange={handleChange} 
          required
          disabled={isSubmitting}
          />
        </div>
      ))}
      <button type='submit' className='button-3' disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : exerciseToEdit ? "Save Changes" : "Add Exercise"}
      </button>
    </form>
  );
}

/**
 * Main Exercises Page Component
 * Handles the display, fetching, and deletion of the exercise library.
 */
export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref for controlling the <dialog> element
  const dialogRef = useRef(null);

  /**
   * Opens the modal.
   * @param {Object|null} exercise - The exercise to edit, or null to create new.
   */
  const handleShowForm = (exercise) => {
    setExerciseToEdit(exercise);
    dialogRef.current.showModal();
  };

  /**
   * Handles the state update after form is submitted.
   * Optimistically updates the UI list to avoid a full page refresh.
   */
  const handleCloseAndRefresh = (updatedExercise, action) => {
    dialogRef.current.close();
    setExerciseToEdit(null);
    if (action === "edit") {
      setExercises(exercises.map( ex => 
        ex.id === updatedExercise.id ? updatedExercise : ex
      ));
    } else {
      setExercises([...exercises, updatedExercise])
    }
  };
  
  const handleDelete = async (exerciseID) => {
    if (!window.confirm("Delete this exercise?")) return;
    try {
      await apiService.delete(`/exercises/${exerciseID}`);
      setExercises(exercises.filter(ex => ex.id !== exerciseID));
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to delete exercise. Try again."
      setError(message);
    }
  };
  
  /**
   * Fetch library on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.get('/exercises');
        setExercises(response.data);
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to load exercises. Try again."
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="loading">Loading exercise library...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <>
    <dialog ref={dialogRef}>
      <ExerciseForm
        key={exerciseToEdit ? exerciseToEdit.id : "create"}
        onExerciseAdded={handleCloseAndRefresh} 
        exerciseToEdit={exerciseToEdit} 
      />
      <button className="button-link" onClick={() => dialogRef.current.close()}>Cancel</button>
    </dialog>
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Exercises</h4>
        <button className='button-3' onClick={() => handleShowForm(null)}>Create Exercise</button>
      </div>
      {exercises.length === 0 ? (
        <p>No exercises found. Get started by creating your first one!</p>
      ) : (exercises.map((exercise) => (
          <div key={exercise.id} className='result-container'>
            <div className='result'>
              <h3 className='result-title'>{exercise.name}</h3>
              <h5 className='result-desc'>
                {/* visual join for array-based data fields */}
                {exercise.muscle_group.join(", ")} | {exercise.equipment.join(", ")} | {exercise.exercise_type}
              </h5>
            </div>
            <div className='button-container'>
              <button className='button-4' onClick={() => handleShowForm(exercise)}>Edit</button>
              <button className='button-5' onClick={() => handleDelete(exercise.id)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
    </>
  );
}
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
import { useAuth } from '../context/AuthContext';

/**
 * Main Exercises Page Component
 * Handles the display, fetching, and deletion of the exercise library.
 */
export default function Exercises() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  
  const [exercises, setExercises] = useState([]);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [libraryTypes, setLibraryTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("");


  // Ref for controlling the <dialog> element
  const dialogRef = useRef(null);

  /**
   * Opens the create/edit modal.
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
        const [exResponse, libResponse] = await Promise.all([
          apiService.get('/exercises'),
          apiService.get('/exercises/libraries')
        ]);
        setExercises(exResponse.data);
        setLibraryTypes(libResponse.data);

        // default to 'all' enum value
        if (libResponse.data.length > 0) {
          setActiveTab(libResponse.data[0]);
        }
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to load exercises. Try again."
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter exercises based on search term
  const filteredExercises = exercises.filter(ex => {
    const isOwner = ex.user_id === currentUserId;

    if (activeTab === 'official' && isOwner) return false;
    if (activeTab === 'personal' && !isOwner) return false;

    const term = searchTerm.toLowerCase();
    return (
      ex.name.toLowerCase().includes(term) ||
      ex.muscle_group.some(m => m.toLowerCase().includes(term))
    )
  });

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

      {/* Search Input */}
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search by exercise name or muscle group..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabbed Filter UI */}
      <div className="tabs-container">
        {libraryTypes.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Exercise List Rendering */}
      {filteredExercises.length > 0 ? (
        filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            // canManage={user?.role === "admin" || exercise.user_id === currentUserId}
            onEdit={() => handleShowForm(exercise)}
            onDelete={() => handleDelete(exercise.id)}
          />
        ))
      ) : (
        <EmptyState
          activeTab={activeTab}
          onAction={() => handleShowForm(null)}
        />
      )}
    </div>
    </>
  );
}

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
 * ExerciseCard Component
 * Visual representation of an individual exercise item
 * 
 * @param {Object} props
 * @param {Object} props.exercise - The exercise data object.
 * @param {Function} props.onEdit - Callback to trigger edit modal
 * @param {Function} props.onDelete - Callback to trigger delete logic
 */
function ExerciseCard({ exercise, onEdit, onDelete }) {
  return (
    <div className='result-container'>
      <div className='result'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className='result-title'>{exercise.name}</h3>
          {exercise.is_official && <span className="badge-system">✅</span>}
        </div>
        <h5 className='result-desc'>
          {exercise.muscle_group.join(", ")} | {exercise.equipment.join(", ")} | {exercise.exercise_type}
        </h5>
      </div>
      <div className='button-container'>
        {exercise.can_edit && (
            <button className='button-4' onClick={onEdit}>Edit</button>
        )}
        {exercise.can_delete && (
            <button className='button-5' onClick={onDelete}>Delete</button>
        )}
      </div>
    </div>
  );
}


/**
 * EmptyState Component
 * Provides visual feedback and a Call to Action when no exercises are found.
 * 
 * @param {Object} props
 * @param {string} props.activeTab - The currently selected library filter.
 * @param {Function} props.onAction - Callback to open the creation form.
 */
function EmptyState({ activeTab, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
      <p>No {activeTab === 'all' ? '' : activeTab} exercises found.</p>
      <button onClick={onAction} className="button-link">Create one now</button>
    </div>
  );
}
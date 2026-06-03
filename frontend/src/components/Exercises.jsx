/**
 * @file Exercises.jsx
 * 
 * @description Manages the exercise library. 
 * Features:
 * - CRUD operations for exercise definitions.
 * - Modal-based form for creating and editing exercises.
 * - Robust parsing of comma-separated inputs for equipment and muscle groups.
 */
import { useEffect, useRef, useState } from 'react'
import apiService from '@utils/apiService'
import { useAuth } from '../context/AuthContext';
import ExerciseCard from './ExerciseCard';

/**
 * Main Exercises Page Component
 * Handles the display, fetching, and deletion of the exercise library.
 */
export default function Exercises() {
  const { user } = useAuth();
  
  const [exercises, setExercises] = useState([]);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [uiState, setUiState] = useState({ loading: true, error: null, search: "", tab: "" });
  const [libraryTypes, setLibraryTypes] = useState([]);

  const dialogRef = useRef(null);

  /**
   * Opens the create/edit modal.
   * @param {Object|null} exercise - The exercise to edit, or null to create new.
   */
  const handleEdit = (exercise) => {
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

    const exerciseWithPermissions = {
      ...updatedExercise,
      can_edit: true,
      can_delete: true
    };

    if (action === "edit") {
      setExercises(exercises.map( ex => 
        ex.id === updatedExercise.id ? exerciseWithPermissions : ex
      ));
    } else {
      setExercises(prev => [...prev, exerciseWithPermissions]);
    }
  };
  
  const handleDelete = async (exerciseID) => {
    if (!window.confirm("Delete this exercise?")) return;
    try {
      await apiService.delete(`/exercises/${exerciseID}`);
      setExercises(exercises.filter(ex => ex.id !== exerciseID));
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to delete exercise. Try again."
      setUiState(prev => ({ ...prev, error: message }));
    }
  };

  /**
 * Promotes a community exercise to 'official' status.
 * Only accessible by users with the 'admin' role.
 */
const handleVerify = async (exerciseID) => {
  try {
    // Hits the new endpoint in routes/admin.py
    const response = await apiService.patch(`/admin/exercises/${exerciseID}/verify`);
    
    // Update local state: find the exercise and flip the is_official flag
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseID ? { ...ex, is_official: true } : ex
    ));
    
    console.log(response.data.detail);
  } catch (err) {
    const message = err.response?.data?.detail || "Failed to promote exercise.";
    setUiState(prev => ({ ...prev, error: message }));
  }
};
  
  /**
   * Fetch library on component mount
   */
  useEffect(() => {
    (async () => {
      try {
        const [exResponse, libResponse] = await Promise.all([
          apiService.get('/exercises'),
          apiService.get('/exercises/libraries')
        ]);
        setExercises(exResponse.data);
        setLibraryTypes(libResponse.data);
        setUiState(prev => ({ ...prev, tab: libResponse.data[0], loading: false }));
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to load exercises. Try again."
        setUiState(prev => ({ ...prev, error: message, loading: false }));
      }
    })();
  }, []);

  // Filter exercises based on search term
  const filteredExercises = exercises.filter(ex => {
    const matchesTab = uiState.tab === 'all' || 
      (uiState.tab === 'official' && ex.is_official) || 
      (uiState.tab === 'personal' && ex.user_id === user?.id);
    const matchesSearch = ex.name.toLowerCase().includes(uiState.search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (uiState.loading) return <div>Loading...</div>;
  if (uiState.error) return <div className="error-banner">{uiState.error}</div>;

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
        <button className='button-3' onClick={() => handleEdit(null)}>Create Exercise</button>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search by exercise name or muscle group..." 
          className="search-input"
          value={uiState.search}
          onChange={(e) => setUiState(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {/* Tabbed Filter UI */}
      <div className="tabs-container">
        {libraryTypes.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${uiState.tab === tab ? 'active' : ''}`}
            onClick={() => setUiState(prev => ({ ...prev, tab: tab }))}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Exercise List Rendering */}
      {filteredExercises.length > 0 ? (
        filteredExercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            actions={
              <>
                {ex.can_edit && <button className="button-4" onClick={() => handleEdit(ex)}>Edit</button>}
                {ex.can_delete && <button className="button-5" onClick={() => handleDelete(ex.id)}>Delete</button>}
                {user?.role === 'admin' && !ex.is_official && <button onClick={() => handleVerify(ex.id)}>Verify</button>}
              </>
            }
          />
        ))
      ) : (
        <EmptyState
          activeTab={uiState.tab}
          onAction={() => handleEdit(null)}
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
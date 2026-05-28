/**
 * ExerciseSearchModal.jsx
 * A reusable dialog for searching and selecting exercises from the library.
 */
import { useState, useEffect, useRef } from "react";
import apiService from "../utils/apiService";

export default function ExerciseSearchModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  excludeIds = [] 
}) {
  const [library, setLibrary] = useState([]);
  const [types, setTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const dialogRef = useRef();

   /**
   * Syncs the native <dialog> state with the isOpen prop.
   * .showModal() centers the element and handles the backdrop.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen) {
      // Prevents error if already open
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);
  
  // Fetch library data only when the modal opens
  useEffect(() => {
    if (isOpen) {
      const loadLibrary = async () => {
        const [libRes, typesRes] = await Promise.all([
          apiService.get('/exercises'),
          apiService.get('/exercises/libraries')
        ]);
        setLibrary(libRes.data.filter(ex => !excludeIds.includes(ex.id)));
        setTypes(typesRes.data);
        if (typesRes.data.length > 0) setActiveTab(typesRes.data[0]);
      };
      loadLibrary();
    }
  }, [isOpen, excludeIds]);

  const filtered = library.filter(e => {
    const term = searchQuery.toLowerCase();
  const matchesSearch = 
    e.name.toLowerCase().includes(term) ||
    (e.muscle_group && e.muscle_group.some(m => m.toLowerCase().includes(term)));

  if (!matchesSearch) return false;

  if (activeTab === 'official') {
    return e.is_official === true;
  }
  if (activeTab === 'personal') {
    return e.is_official === false;
  }

  return true;
  });

  const handleToggle = (ex) => {
    selected.some(s => s.id === ex.id)
      ? setSelected(selected.filter(s => s.id !== ex.id))
      : setSelected([...selected, ex]);
  };

  return (
    // <dialog open={isOpen} className="modal-base">
    <dialog
      ref={dialogRef}
      className="modal-base"
      onClose={onClose}
    >
      <header className="container-h">
        <h4>Select Exercises</h4>
        <input 
          type="text"
          placeholder="Search..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <div className="tabs-container">
            {types.map(type => (
              <button 
                key={type} 
                onClick={() => setActiveTab(type)}
                className={activeTab === type ? 'active' : ''}
              >
                {type}
              </button>
            ))}
          </div>
      </header>
      <div className="search-results">
        {filtered.map(ex => (
          <div 
            key={ex.id} 
            className={`item ${selected.some(s => s.id === ex.id) ? 'active' : ''}`}
            onClick={() => handleToggle(ex)}
          >
            {ex.name}
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button onClick={() => { onConfirm(selected); setSelected([]); }}>
          Add {selected.length} Selected
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </dialog>
  );
}
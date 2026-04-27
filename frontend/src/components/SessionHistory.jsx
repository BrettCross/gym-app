import { useEffect, useState } from "react";
import SessionCard from "./SessionCard";
import apiService from "../utils/apiService";

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get('/sessions');
      setSessions(response.data);
    };
    fetchData();
  }, []);

  const handleDelete = async (sessionID) => {
    if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) {
      return;
    }
    try {
      await apiService.delete(`/sessions/${sessionID}`);
      setSessions(sessions.filter(s => s.id !== sessionID));
    } catch (error) {
      console.error("Failed to delete session:", error);
      setError("Failed to delete session. Please check your connection.");
    }
  };

  return (
    <>
    {error && <p className="error-text">{error}</p>}
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Sessions</h4>
      </div>
      {sessions.map(s => (
        <SessionCard 
          key={s.id} 
          session={s} 
          showDelete={true} 
          onDelete={handleDelete} 
        />
      ))}
    </div>
    </>
  );
}
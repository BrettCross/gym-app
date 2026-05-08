/**
 * SessionHistory.jsx
 * Renders the complete historical list of workout sessions.
 * Allows users to view high-level summaries and permanently delete records.
 * 
 * Features:
 * - Full CRUD capability for session deletion.
 * - Loading and empty state handling.
 * - Error notification for network failures.
 */
import { useEffect, useState } from "react";
import SessionCard from "./SessionCard";
import apiService from "../utils/apiService";

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Effect: Fetch all sessions on component mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.get('/sessions');
        setSessions(response.data);
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to fetch sessions.";
        setError(message);
        setSessions([]);
      }
    };
    fetchData();
  }, []);

  /**
   * Handler: Deletes a specific session.
   * Note: The confirmation dialog is handled within the SessionCard for a 
   * cleaner separation of concerns, or passed here.
   * 
   */
  const handleDelete = async (sessionID) => {
    if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) {
      return;
    }
    try {
      setIsDeleting(true);
      setError(null);
      await apiService.delete(`/sessions/${sessionID}`);

      // filter out deleted session
      setSessions(sessions.filter(s => s.id !== sessionID));
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to delete session. Please try again."
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessions === null && !error) {
    return <div className="loading-state">Loading history...</div>;
  }

  return (
    <>
    {error && <p className="error-text">{error}</p>}
    <div className='container-v'>
      <div className='container-h'>
        <h4>All Sessions</h4>
      </div>
      {error && <p className="error-text" style={{ color: 'red' }}>{error}</p>}
      
      {sessions.length === 0 ? (
        <div className="empty-history">
          <p>You haven't recorded any sessions yet. Time to hit the weights!</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map(s => (
            <SessionCard 
              key={s.id} 
              session={s} 
              showDelete={true} 
              onDelete={handleDelete} 
              disabled={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
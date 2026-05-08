/**
 * RecentActivity.jsx
 * Fetches and displays a list of the user's most recent workout sessions.
 * 
 * UI States:
 * - Loading: Displays a generic loading message during the API fetch.
 * - Empty: Encourages the user to start working out if no sessions are found.
 * - Error: Provides feedback if the API call fails.
 */
import { useEffect, useState } from "react";
import SessionCard from "./SessionCard";
import apiService from "../utils/apiService";

export default function RecentActivity() {
  const [recentSessions, setRecentSessions] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Effect: Fetch recent sessions on component mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await apiService.get(`/sessions/recent`);

        // ensure we are setting array even if backend returns something unexpected
        setRecentSessions(response.data);
      } catch (err) {
        const message = err.response?.data?.detail || "We couldn't load your recent activity. Please try again later."
        setError(message);
        setRecentSessions([]);
      }
    };

    fetchData();
  }, []);

  // 1. Loading State: recentSessions is still null
  if (recentSessions === null && !error) {
    return <div className="loading-message">Fetching your latest gains...</div>;
  }

  // 2. Error State: Display the error message if the fetch failed
  if (error) {
    return <div className="error-message" style={{ color: 'red' }}>{error}</div>;
  }

  // 3. Empty State: The request finished, but the array is empty
  if (recentSessions.length === 0) {
    return (
      <div className="empty-state">
        <p>Your recent activity will show here once you finish a workout!</p>
      </div>
    );
  }

  // 4. Success State: Render the list of session cards
  return (
    <div className="recent-activity-list">
      {recentSessions.map((session) => (
        <SessionCard 
          key={session.id} 
          session={session} 
          // Disable delete functionality for the dashboard preview
          showDelete={false} 
        />
      ))}
    </div>
  );
}
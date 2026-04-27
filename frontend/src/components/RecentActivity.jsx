import { useEffect, useState } from "react";
import SessionCard from "./SessionCard";
import apiService from "../utils/apiService";

export default function RecentActivity() {
  const [recentSessions, setRecentSessions] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiService.get(`/sessions/recent`)

      setRecentSessions(response.data)
    };
    fetchData();
  }, []);

  if (!recentSessions) return <div>Loading...</div>
  if (recentSessions.length === 0) return <div>Your recent activity will show here!</div>

  return (
    <>
    {recentSessions.map(s => (
      <SessionCard 
        key={s.id} 
        session={s} 
        showDelete={false} 
      />
    ))}
    </>
  );
}
import RecentActivity from "./RecentActivity";

/**
 * Home Component
 * Serves as the primary dashboard view, displaying a list of all 
 * recorded workout sessions via the RecentActivity component.
 */
export default function Home() {
  return (
    <main className="container-v">
      <header className="container-h">
        <h4>All Sessions</h4>
      </header>
      <RecentActivity />
    </main>
  );
}
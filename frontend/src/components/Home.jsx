import RecentActivity from "./RecentActivity";

export default function Home() {
  return (
    <>
      <div className="container-v">
        <div className='container-h'>
          <h4>All Sessions</h4>
        </div>
        <RecentActivity />
      </div>
    </>
  );
}
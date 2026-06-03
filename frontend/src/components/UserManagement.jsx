/**
 * @file UserManagement.jsx
 * @description Admin-only view for managing the user database.
 */
import { useEffect, useState } from 'react';
import apiService from '@utils/apiService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/users')
        setUsers(response.data);
      } catch (err) {
        const message = err.response?.data?.detail || "Failed to fetch users";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This action is permanent.")) return;
    try {
      await apiService.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to delete user";
      setError(message);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="container-v">
      <h3>User Management</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td><span className={`badge-${u.role}`}>{u.role}</span></td>
              <td><code>{u.id}</code></td>
              <td>
                <button 
                  className="button-5" 
                  onClick={() => handleDeleteUser(u.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminApi.getUsers().then(res => setUsers(res.data)).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Admin</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td><td>{user.username}</td><td>{user.email}</td><td>{user.is_admin ? 'Yes' : 'No'}</td>
                <td><button className="text-red-500">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
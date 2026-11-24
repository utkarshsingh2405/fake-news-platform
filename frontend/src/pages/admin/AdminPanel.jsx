import React from 'react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/users" className="card text-center hover:shadow-lg transition">User Management</Link>
        <Link to="/admin/model" className="card text-center hover:shadow-lg transition">Model Management</Link>
      </div>
    </div>
  );
};

export default AdminPanel;
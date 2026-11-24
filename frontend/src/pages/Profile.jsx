import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  return (
    <>


      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <span className="eyebrow mb-1 inline-block">Account</span>
        <h1 className="text-3xl font-display font-bold text-white">Profile</h1>
      </div>

      <div className="glass-panel p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-black mb-4" style={{ background: 'linear-gradient(135deg, #00FF87, #60EFFF)', color: '#070a13' }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 className="text-xl font-display font-bold text-white">{user?.username || 'User'}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>

        {/* Info Fields */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Username</p>
                <p className="text-sm text-white font-medium">{user?.username || 'Not set'}</p>
              </div>
              <i className="fas fa-user text-slate-600"></i>
            </div>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-white font-medium">{user?.email || 'Not set'}</p>
              </div>
              <i className="fas fa-envelope text-slate-600"></i>
            </div>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-sm text-white font-medium">{user?.full_name || 'Not set'}</p>
              </div>
              <i className="fas fa-id-card text-slate-600"></i>
            </div>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Member Since</p>
                <p className="text-sm text-white font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</p>
              </div>
              <i className="fas fa-calendar text-slate-600"></i>
            </div>
          </div>
          <div className="glass p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Role</p>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${user?.is_admin ? 'badge-real' : ''}`} style={!user?.is_admin ? { background: 'rgba(96,239,255,0.08)', color: '#60EFFF', border: '1px solid rgba(96,239,255,0.15)' } : {}}>
                  {user?.is_admin ? 'Administrator' : 'User'}
                </span>
              </div>
              <i className="fas fa-shield-alt text-slate-600"></i>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Profile;
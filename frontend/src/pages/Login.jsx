import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Google Client ID – set VITE_GOOGLE_CLIENT_ID in frontend/.env
// e.g. VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
// Treat missing or placeholder value as "not configured"
const GOOGLE_CLIENT_ID = (() => {
  const val = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  return val && val !== 'YOUR_GOOGLE_CLIENT_ID_HERE' ? val : '';
})();

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Initialise Google Identity Services once the script loads
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };

    // Script may already be loaded
    if (window.google?.accounts) {
      initGoogle();
    } else {
      // Wait for the async GSI script to finish loading
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initGoogle);
        return () => script.removeEventListener('load', initGoogle);
      }
    }
  }, []);

  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    const success = await loginWithGoogle(response.credential);
    setGoogleLoading(false);
    if (success) navigate('/dashboard');
  };

  const handleGoogleButtonClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('Google Sign-In is not configured yet.\nAdd VITE_GOOGLE_CLIENT_ID to your frontend/.env file.');
      return;
    }
    if (!window.google?.accounts) {
      alert('Google Sign-In script is still loading. Please try again in a moment.');
      return;
    }
    window.google.accounts.id.prompt();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="glass-panel p-8 sm:p-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #00FF87, #60EFFF)' }}>
            <i className="fas fa-shield-alt text-xl" style={{ color: '#070a13' }}></i>
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Welcome Back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to access your dashboard</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleButtonClick}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-4 rounded-xl font-semibold text-sm transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e2e8f0',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            opacity: googleLoading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        >
          {googleLoading ? (
            <><i className="fas fa-circle-notch fa-spin"></i> Signing in with Google…</>
          ) : (
            <>
              {/* Google logo SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
          <span className="text-xs text-slate-600 font-medium">or sign in with email</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="input-glass" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input-glass" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 mt-2">
            {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Signing In...</> : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="gradient-text font-semibold hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', show: isAuthenticated },
    { name: 'Predict', path: '/predict', show: isAuthenticated },
    { name: 'History', path: '/history', show: isAuthenticated },
    { name: 'Analytics', path: '/analytics', show: isAuthenticated },
    { name: 'Admin', path: '/admin', show: isAuthenticated && user?.is_admin },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(7,10,19,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* GodSEye Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/godseye_emblem.png"
              alt="GodSEye"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(0,255,135,0.6))',
              }}
            />
            <span className="text-lg font-bold font-display hidden sm:block" style={{
              background: 'linear-gradient(135deg, #00FF87, #60EFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}>
              GodSEye
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => link.show && (
              <Link
                key={link.name}
                to={link.path}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition text-sm">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00FF87, #60EFFF)', color: '#070a13' }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-300 font-medium">{user?.username}</span>
                  <i className="fas fa-chevron-down text-xs text-slate-500"></i>
                </button>
                <div className="absolute right-0 mt-1 w-48 glass-card py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition">
                    <i className="fas fa-user mr-2 text-slate-500"></i> Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition">
                    <i className="fas fa-sign-out-alt mr-2"></i> Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary px-4 py-2 text-sm">Login</Link>
                <Link to="/register" className="btn-primary px-4 py-2 text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-300 p-2">
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => link.show && (
              <Link key={link.name} to={link.path} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/register" className="block px-3 py-2 rounded-lg text-sm font-medium gradient-text" onClick={() => setIsOpen(false)}>Get Started</Link>
              </>
            )}
            {isAuthenticated && (
              <>
                <Link to="/profile" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400">Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
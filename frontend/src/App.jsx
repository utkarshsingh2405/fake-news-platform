import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CinematicIntro from './components/CinematicIntro';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10, position: 'absolute', left: 0, right: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="w-full"
  >
    {children}
  </motion.div>
);

// Layout wrapper that conditionally shows Navbar/Footer
const AppLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Global Pure CSS Tech-Noir Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050810]">
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
               backgroundSize: '32px 32px' 
             }}>
        </div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00FF87]/5 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[#60EFFF]/5 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Show Navbar on all pages except landing (which has its own nav) */}
        {!isLanding && <Navbar />}
        
        <main className="flex-grow w-full relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
              <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
              <Route path="/predict" element={<ProtectedRoute><PageTransition><Predict /></PageTransition></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><PageTransition><History /></PageTransition></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

function App() {
  // Show intro once per browser session (clears on tab close)
  const [introPlayed, setIntroPlayed] = useState(
    () => localStorage.getItem('godseye_intro_played') === 'true'
  );

  const handleIntroDone = useCallback(() => {
    localStorage.setItem('godseye_intro_played', 'true');
    setIntroPlayed(true);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1729',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#00FF87', secondary: '#070a13' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#070a13' },
            },
          }}
        />

        {/* Cinematic intro — shown once per session */}
        {!introPlayed && <CinematicIntro onDone={handleIntroDone} />}

        {/* Main app — rendered beneath the intro overlay */}
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
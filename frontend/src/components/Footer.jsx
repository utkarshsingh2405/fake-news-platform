import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-white/5" style={{ background: 'rgba(7,10,19,0.95)' }}>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/godseye_emblem.png"
                alt="GodSEye"
                style={{
                  width: '36px',
                  height: '36px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 7px rgba(0,255,135,0.5))',
                }}
              />
              <span className="text-lg font-bold font-display" style={{ background: 'linear-gradient(135deg, #00FF87, #60EFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.05em' }}>GodSEye</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Omniscient AI truth detection. Nothing escapes the God's Eye — trusted by researchers and journalists worldwide.
            </p>
          </div>
          <div>
            <h4 className="eyebrow mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/predict" className="hover:text-white transition">Predict News</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition">Analytics</Link></li>
              <li><Link to="/history" className="hover:text-white transition">History</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><span className="cursor-default">API Documentation</span></li>
              <li><span className="cursor-default">Research Papers</span></li>
              <li><span className="cursor-default">Model Architecture</span></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Data Processing</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} GodSEye. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-600">
            <a href="#" className="hover:text-white transition"><i className="fab fa-github text-lg"></i></a>
            <a href="#" className="hover:text-white transition"><i className="fab fa-twitter text-lg"></i></a>
            <a href="#" className="hover:text-white transition"><i className="fab fa-linkedin text-lg"></i></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
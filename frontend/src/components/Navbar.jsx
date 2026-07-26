import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <div className="absolute inset-0 rounded-xl bg-indigo-500/30 animate-pulse"></div>
            <svg
              className="w-6 h-6 text-white relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                RouteWise
              </span>
            </div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Smart Trip Planning & Driver Logs
            </span>
          </div>
        </Link>

        {/* Navigation Links & System Badge */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-white/5">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive('/')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/planner"
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                isActive('/planner')
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>Trip Planner</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HOS Engine Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  // Theme Toggle State (Dark / Light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('routewise_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('routewise_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 transition-colors duration-300">
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

        {/* Navigation Links, Theme Toggle Switch & System Badge */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-white/5">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive('/')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/planner"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
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

          {/* Interactive Theme Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Webpage Theme Mode"
            className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 transition-all duration-200 flex items-center space-x-1.5 group"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline text-xs font-mono font-medium">Light</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="hidden sm:inline text-xs font-mono font-medium">Dark</span>
              </>
            )}
          </button>

          {/* System Online Status Badge */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HOS Engine Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

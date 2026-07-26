import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center z-10">
        {/* Animated Pill Badge */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-slate-900/90 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xl backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Next-Gen OpenRouteService & FMCSA Compliance Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight mb-8">
          Optimize Commercial Routes with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            RouteWise
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-3xl leading-relaxed mb-12">
          Calculate commercial truck routes, enforce 70-hour / 8-day Hours of Service (HOS) rules, schedule 1000-mile fuel stops, and render multi-day FMCSA driver logs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/planner"
            className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 transition-all duration-200 text-base flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
          >
            <span>Launch Trip Planner Workspace</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Quick Platform Metrics Pills Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <span className="text-slate-500 block uppercase tracking-wider mb-1">Fuel Stops</span>
            <span className="text-sm font-bold text-amber-400">Every 1000 Miles</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <span className="text-slate-500 block uppercase tracking-wider mb-1">HOS Rule Set</span>
            <span className="text-sm font-bold text-indigo-400">70h / 8-Day Cycle</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <span className="text-slate-500 block uppercase tracking-wider mb-1">Maps Engine</span>
            <span className="text-sm font-bold text-cyan-400">React Leaflet v4</span>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <span className="text-slate-500 block uppercase tracking-wider mb-1">Daily Logs</span>
            <span className="text-sm font-bold text-emerald-400">24.0 Hours / Day</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800 flex items-center justify-center mb-6 font-bold text-2xl shadow-inner">
              📍
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">OpenRouteService Geometry</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Calculate exact driving paths connecting Current Location, Pickup, and Dropoff waypoints using OpenRouteService GeoJSON APIs.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-800 flex items-center justify-center mb-6 font-bold text-2xl shadow-inner">
              ⏱️
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">FMCSA HOS & Stop Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enforce 11h driving, 14h window, 30m break after 8h, 10h rest, and 70h cycle limits merged with 1000m fuel stop scheduling.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center mb-6 font-bold text-2xl shadow-inner">
              📑
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Multi-Day FMCSA Driver Logs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate structured multi-day daily log sheets categorizing hours into 4 duty statuses with 24.0-hour total verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

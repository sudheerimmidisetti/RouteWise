import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            R
          </div>
          <span className="font-semibold text-slate-200">RouteWise</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400">Smart Trip Planning & Driver Logs</span>
        </div>

        <div className="text-xs text-slate-500">
          &copy; 2026 RouteWise. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

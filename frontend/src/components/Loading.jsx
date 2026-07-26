import React from 'react';

const Loading = ({ message = 'Calculating optimal route...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-sm shadow-xl min-h-[220px]">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
        </div>
      </div>
      <p className="text-slate-200 font-medium text-sm animate-pulse">{message}</p>
      <p className="text-slate-500 text-xs mt-1 font-mono">OpenRouteService API</p>
    </div>
  );
};

export default Loading;

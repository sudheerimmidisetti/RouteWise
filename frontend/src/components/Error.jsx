import React from 'react';

const Error = ({
  title = 'Route Calculation Error',
  message = 'Unable to calculate route. Please check location inputs.',
  onRetry,
}) => {
  return (
    <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-6 text-rose-200 shadow-xl backdrop-blur-sm">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-rose-900/50 rounded-xl text-rose-400 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-rose-300 mb-1">{title}</h3>
          <p className="text-sm text-rose-300/80 leading-relaxed mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-md shadow-rose-900/40"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Error;

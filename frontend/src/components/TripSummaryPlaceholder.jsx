import React from 'react';

const TripSummaryPlaceholder = ({ data }) => {
  const hasData = Boolean(data && data.total_distance !== undefined);

  const totalDistance = hasData ? `${data.total_distance} miles` : '—';
  const totalDuration = hasData ? `${data.total_duration} hours` : '—';
  const currentLocation = data?.current_location || '—';
  const pickupLocation = data?.pickup_location || '—';
  const dropoffLocation = data?.dropoff_location || '—';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Trip Summary</span>
        </h3>
        <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${hasData ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
          {hasData ? 'Calculated' : 'Awaiting Form'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Total Distance */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Total Distance
          </span>
          <span className={`text-lg font-bold font-mono ${hasData ? 'text-cyan-300' : 'text-slate-600'}`}>
            {totalDistance}
          </span>
        </div>

        {/* Driving Duration */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Driving Duration
          </span>
          <span className={`text-lg font-bold font-mono ${hasData ? 'text-indigo-300' : 'text-slate-600'}`}>
            {totalDuration}
          </span>
        </div>
      </div>

      {/* Locations breakdown */}
      <div className="space-y-2.5 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Current Location:</span>
          <span className={`font-mono font-medium ${hasData ? 'text-emerald-400' : 'text-slate-600'}`}>{currentLocation}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Pickup Location:</span>
          <span className={`font-mono font-medium ${hasData ? 'text-cyan-400' : 'text-slate-600'}`}>{pickupLocation}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Dropoff Location:</span>
          <span className={`font-mono font-medium ${hasData ? 'text-rose-400' : 'text-slate-600'}`}>{dropoffLocation}</span>
        </div>
      </div>
    </div>
  );
};

export default TripSummaryPlaceholder;

import React from 'react';
import { getStopTypeBadge, getTimelineStatusBadge } from '../utils/uiHelpers';

/**
 * StopSchedule component displaying ordered stops and merged HOS timeline.
 * @param {Object} props
 * @param {Array} props.stops - Array of scheduled stop objects
 * @param {Array} props.timeline - Array of HOS timeline items
 */
const StopSchedule = ({ stops = [], timeline = [] }) => {
  const hasStops = stops.length > 0;
  const hasTimeline = timeline.length > 0;

  return (
    <div className="space-y-6">
      {/* Ordered Stops Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-bold text-slate-100">Ordered Trip Schedule & Waypoints</h3>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${hasStops ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
            {hasStops ? `${stops.length} Scheduled Stops` : 'Awaiting Route'}
          </span>
        </div>

        {!hasStops ? (
          <div className="py-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
            <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-slate-400 font-mono">No stops calculated yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">Submit the trip form above to generate ordered fuel & location stops.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Stop Type</th>
                  <th className="py-3 px-3">Location Name</th>
                  <th className="py-3 px-3">Coordinates (Lat, Lon)</th>
                  <th className="py-3 px-3 text-right">Activity Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {stops.map((stop, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold font-mono text-slate-400">{stop.sequence_order}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStopTypeBadge(stop.stop_type)}`}>
                        {stop.stop_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-100">{stop.location_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {stop.latitude && stop.longitude
                        ? `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-right text-indigo-300">
                      {stop.duration_minutes ? `${stop.duration_minutes} mins` : 'Origin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merged HOS Trip Timeline List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-100">Merged HOS & Operational Timeline</h3>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${hasTimeline ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
            {hasTimeline ? 'FMCSA Compliant' : 'Awaiting Timeline'}
          </span>
        </div>

        {!hasTimeline ? (
          <div className="py-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
            <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400 font-mono">No HOS timeline calculated yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">Submit the trip form above to generate chronological driving and rest schedules.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shrink-0 ${getTimelineStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-100">{item.remarks}</div>
                    <div className="text-slate-400 text-[11px] font-mono mt-0.5">{item.location_name}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-indigo-300 font-semibold">{item.duration_hours} hrs</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StopSchedule;

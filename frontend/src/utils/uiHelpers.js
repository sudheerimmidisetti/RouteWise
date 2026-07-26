/**
 * Helper utilities for UI badge styling and status formatting.
 */

/**
 * Returns Tailwind CSS badge classes based on stop type.
 * @param {string} type - Stop type ('CURRENT' | 'PICKUP' | 'DROPOFF' | 'FUEL' | 'REST_BREAK' | 'SLEEPER')
 * @returns {string} Tailwind CSS class string
 */
export const getStopTypeBadge = (type) => {
  switch (type) {
    case 'CURRENT':
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    case 'PICKUP':
      return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    case 'DROPOFF':
      return 'bg-rose-950 text-rose-300 border-rose-800';
    case 'FUEL':
      return 'bg-amber-950 text-amber-300 border-amber-800';
    case 'REST_BREAK':
    case 'SLEEPER':
      return 'bg-purple-950 text-purple-300 border-purple-800';
    default:
      return 'bg-slate-900 text-slate-300 border-slate-700';
  }
};

/**
 * Returns Tailwind CSS badge classes based on timeline status.
 * @param {string} status - Timeline status ('Driving' | 'Break' | 'Rest' | 'Pickup' | 'Dropoff')
 * @returns {string} Tailwind CSS class string
 */
export const getTimelineStatusBadge = (status) => {
  switch (status) {
    case 'Driving':
      return 'bg-indigo-950 text-indigo-300 border-indigo-800';
    case 'Break':
      return 'bg-amber-950 text-amber-300 border-amber-800';
    case 'Rest':
      return 'bg-purple-950 text-purple-300 border-purple-800';
    case 'Pickup':
      return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    case 'Dropoff':
      return 'bg-rose-950 text-rose-300 border-rose-800';
    default:
      return 'bg-slate-900 text-slate-300 border-slate-700';
  }
};

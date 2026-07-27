import React from 'react';

/**
 * DriverManifestForm Component
 * Renders input controls for Driver Name, Truck Number, DVL/Manifest No.,
 * Shipper & Commodity, and Driver Signature right below the Trip Summary.
 * Live-syncs inputs with the official FMCSA Driver Daily Log sheets.
 */
const DriverManifestForm = ({ details, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange({
        ...details,
        [name]: value,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Driver & Shipping Manifest Details</span>
        </h3>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
          Live Log Sync
        </span>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Driver Name & Truck Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Driver Name
            </label>
            <input
              type="text"
              name="driver_name"
              value={details.driver_name || ''}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Truck / Tractor Number
            </label>
            <input
              type="text"
              name="vehicle_number"
              value={details.vehicle_number || ''}
              onChange={handleChange}
              placeholder="e.g. TRK-001 / Trailer #TR-88"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>
        </div>

        {/* DVL or Manifest No. & Shipper & Commodity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              DVL or Manifest No.
            </label>
            <input
              type="text"
              name="shipping_number"
              value={details.shipping_number || ''}
              onChange={handleChange}
              placeholder="e.g. AUTO-0001 / DVL-9921"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Shipper & Commodity
            </label>
            <input
              type="text"
              name="shipper_commodity"
              value={details.shipper_commodity || ''}
              onChange={handleChange}
              placeholder="e.g. GENERAL FREIGHT / DRY VAN"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>
        </div>

        {/* Driver Signature Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Driver Signature
          </label>
          <input
            type="text"
            name="driver_signature"
            value={details.driver_signature || ''}
            onChange={handleChange}
            placeholder="Sign Name (e.g. John Doe)"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-serif italic text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>
      </div>
    </div>
  );
};

export default DriverManifestForm;

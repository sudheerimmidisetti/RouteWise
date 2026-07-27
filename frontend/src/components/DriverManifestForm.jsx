import React from 'react';

/**
 * DriverManifestForm Component
 * Renders input controls for:
 * - Driver Name, Truck Number, DVL/Manifest No., Shipper & Commodity, Driver Signature
 * - Name of Carrier, Main Office Address, Home Terminal Address
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      {/* 1. Driver & Shipping Manifest Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
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

      {/* 2. Carrier & Terminal Information Section */}
      <div className="pt-3 border-t border-slate-800 space-y-3.5 text-xs">
        <div className="flex items-center justify-between pb-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Carrier & Terminal Information</span>
          </h4>
        </div>

        {/* Name of Carrier */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Name of Carrier
          </label>
          <input
            type="text"
            name="carrier_name"
            value={details.carrier_name || ''}
            onChange={handleChange}
            placeholder="e.g. RouteWise Logistics"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>

        {/* Main Office Address & Home Terminal Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Main Office Address
            </label>
            <input
              type="text"
              name="main_office_address"
              value={details.main_office_address || ''}
              onChange={handleChange}
              placeholder="e.g. 100 Transport Way, Suite 400, Chicago, IL 60601"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Home Terminal Address
            </label>
            <input
              type="text"
              name="home_terminal_address"
              value={details.home_terminal_address || ''}
              onChange={handleChange}
              placeholder="e.g. 100 Transport Way, Suite 400, Chicago, IL 60601"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverManifestForm;

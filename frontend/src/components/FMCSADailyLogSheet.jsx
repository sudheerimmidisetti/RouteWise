import React from 'react';
import FMCSADutyGraph from './FMCSADutyGraph';

/**
 * FMCSADailyLogSheet component replicating the official FMCSA Drivers Daily Log paper form
 * with pixel-level accuracy based on government document standards.
 */
const FMCSADailyLogSheet = ({ log = {}, manifestDetails = {} }) => {
  const {
    day_number = 1,
    date = new Date().toISOString().split('T')[0],
    miles_today = 0,
    carrier_name = 'RouteWise Logistics',
    main_office_address = '100 Transport Way, Suite 400, Chicago, IL 60601',
    co_driver = 'N/A',
    driving_hours = 0,
    on_duty_hours = 0,
    off_duty_hours = 24,
    sleeper_hours = 0,
    total_hours = 24.0,
    remaining_cycle_hours = 70.0,
    remarks_detail = [],
    segments = [],
  } = log;

  // Use live manifest details if supplied by user form, otherwise fallback to log object values
  const driver_name = manifestDetails.driver_name || log.driver_name || 'Demo Driver';
  const vehicle_number = manifestDetails.vehicle_number || log.vehicle_number || 'TRK-001 / Trailer #TR-88';
  const shipping_number = manifestDetails.shipping_number || log.shipping_number || 'AUTO-0001';
  const shipper_commodity = manifestDetails.shipper_commodity || log.shipper_commodity || 'GENERAL FREIGHT / DRY VAN';
  const driver_signature = manifestDetails.driver_signature || log.driver_signature || driver_name;

  const totals = {
    off_duty: off_duty_hours,
    sleeper: sleeper_hours,
    driving: driving_hours,
    on_duty: on_duty_hours,
  };

  // Parse date into month, day, year
  let monthStr = '';
  let dayStr = '';
  let yearStr = '';
  try {
    const dt = new Date(date);
    if (!isNaN(dt.getTime())) {
      monthStr = (dt.getMonth() + 1).toString().padStart(2, '0');
      dayStr = dt.getDate().toString().padStart(2, '0');
      yearStr = dt.getFullYear().toString();
    }
  } catch (e) {
    // fallback
  }

  // Calculate Recap values
  const onDutyToday = driving_hours + on_duty_hours;

  return (
    <div className="w-full bg-white text-black p-6 border border-black shadow-lg font-sans text-xs select-none">
      {/* 1. Official Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-black pb-3 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-black">
            Drivers Daily Log
          </h1>
          <span className="text-sm font-semibold text-black">(24 hours)</span>
        </div>

        {/* Date Month/Day/Year Block */}
        <div className="text-center font-mono">
          <div className="flex items-center space-x-2 border-b border-black pb-1">
            <span className="font-bold text-sm min-w-[30px]">{monthStr || '07'}</span>
            <span>/</span>
            <span className="font-bold text-sm min-w-[30px]">{dayStr || '25'}</span>
            <span>/</span>
            <span className="font-bold text-sm min-w-[45px]">{yearStr || '2026'}</span>
          </div>
          <div className="flex justify-between text-[9px] text-black px-1 mt-0.5">
            <span>(month)</span>
            <span>(day)</span>
            <span>(year)</span>
          </div>
        </div>

        {/* Original / Duplicate File Notice */}
        <div className="text-right text-[10px] font-sans leading-snug">
          <div><strong>Original</strong> - File at home terminal.</div>
          <div><strong>Duplicate</strong> - Driver retains in his/her possession for 8 days.</div>
        </div>
      </div>

      {/* From / To Subheader */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-b border-black text-xs font-mono">
        <div>
          <span className="font-bold mr-2">From:</span>
          <span className="border-b border-black font-semibold uppercase">{log.from_location || 'ORIGIN TERMINAL'}</span>
        </div>
        <div>
          <span className="font-bold mr-2">To:</span>
          <span className="border-b border-black font-semibold uppercase">{log.to_location || 'DESTINATION TERMINAL'}</span>
        </div>
      </div>

      {/* 2. Official Information Block Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-3 border-b-2 border-black text-xs">
        {/* Left Column: 3 Boxes */}
        <div className="lg:col-span-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="border border-black p-2 text-center font-mono font-bold text-sm min-h-[36px] flex items-center justify-center">
                {miles_today}
              </div>
              <span className="block text-[9px] text-center font-semibold mt-1">Total Miles Driving Today</span>
            </div>
            <div>
              <div className="border border-black p-2 text-center font-mono font-bold text-sm min-h-[36px] flex items-center justify-center">
                {miles_today}
              </div>
              <span className="block text-[9px] text-center font-semibold mt-1">Total Mileage Today</span>
            </div>
          </div>

          <div>
            <div className="border border-black p-2 font-mono font-semibold text-xs min-h-[44px] flex items-center">
              {vehicle_number}
            </div>
            <span className="block text-[9px] font-semibold mt-1 leading-tight">
              Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)
            </span>
          </div>
        </div>

        {/* Right Column: 3 Underlined Fields */}
        <div className="lg:col-span-7 space-y-3 font-mono">
          <div>
            <span className="block text-[10px] font-bold text-black uppercase">Name of Carrier or Carriers</span>
            <div className="border-b border-black pb-1 font-semibold text-slate-900">{carrier_name}</div>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-black uppercase">Main Office Address</span>
            <div className="border-b border-black pb-1 font-semibold text-slate-900">{main_office_address}</div>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-black uppercase">Home Terminal Address</span>
            <div className="border-b border-black pb-1 font-semibold text-slate-900">{main_office_address}</div>
          </div>
        </div>
      </div>

      {/* 3. Official 24-Hour Duty Status SVG Graph */}
      <div className="py-3">
        <FMCSADutyGraph segments={segments} totals={totals} />
      </div>

      {/* 4. Remarks & Shipping Documents Section */}
      <div className="border-t-2 border-black pt-3 space-y-3">
        <h2 className="text-base font-bold text-black uppercase tracking-wider">Remarks</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Shipping Documents Block */}
          <div className="lg:col-span-4 border-2 border-black p-3 space-y-3 text-xs font-mono">
            <h3 className="font-bold uppercase text-black border-b border-black pb-1">
              Shipping Documents:
            </h3>
            <div>
              <span className="block text-[10px] font-semibold">DVL or Manifest No. or</span>
              <span className="font-bold text-slate-900 block mt-0.5">{shipping_number}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold">Shipper & Commodity</span>
              <span className="font-bold text-slate-900 block mt-0.5">{shipper_commodity}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold">Driver's Signature:</span>
              <span className="font-bold text-slate-900 block mt-0.5 font-serif italic border-b border-black pb-0.5">{driver_signature}</span>
            </div>
          </div>

          {/* Right Remarks Table & Instructions */}
          <div className="lg:col-span-8 space-y-2">
            <p className="text-[10px] text-black font-semibold leading-snug">
              Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.
            </p>

            <div className="border border-black overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-black text-white text-[10px] uppercase font-bold border-b border-black">
                    <th className="py-1.5 px-2 border-r border-slate-700">Time</th>
                    <th className="py-1.5 px-2 border-r border-slate-700">Location</th>
                    <th className="py-1.5 px-2 border-r border-slate-700">Duty Status</th>
                    <th className="py-1.5 px-2">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black">
                  {remarks_detail && remarks_detail.length > 0 ? (
                    remarks_detail.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-100">
                        <td className="py-1.5 px-2 border-r border-black font-bold">{entry.time}</td>
                        <td className="py-1.5 px-2 border-r border-black">{entry.location}</td>
                        <td className="py-1.5 px-2 border-r border-black uppercase font-bold">{entry.status}</td>
                        <td className="py-1.5 px-2">{entry.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-2 px-2 text-center text-slate-500 italic">
                        Normal driving operations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Official Bottom Recap Section */}
      <div className="border-t-2 border-black pt-3 mt-4 text-[10px] font-mono">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          <div className="lg:col-span-3 font-bold uppercase text-black">
            Recap: Complete at end of day
          </div>

          <div className="lg:col-span-6 border border-black p-2 space-y-1 bg-slate-50">
            <div className="font-bold border-b border-black pb-1 uppercase">70 Hour / 8 Day Drivers</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span>On duty hours today:</span>
                <span className="font-bold ml-1">{onDutyToday.toFixed(1)} hrs</span>
              </div>
              <div>
                <span>Remaining Cycle:</span>
                <span className="font-bold text-emerald-800 ml-1">{remaining_cycle_hours} hrs</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 text-[9px] text-slate-800 italic leading-tight">
            *If you took 34 consecutive hours off duty you have 60/70 hours available.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FMCSADailyLogSheet;

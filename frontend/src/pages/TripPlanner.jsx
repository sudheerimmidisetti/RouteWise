import React, { useState } from 'react';
import TripForm from '../components/TripForm';
import TripSummaryPlaceholder from '../components/TripSummaryPlaceholder';
import DriverManifestForm from '../components/DriverManifestForm';
import MapPlaceholder from '../components/MapPlaceholder';
import DailyLogPlaceholder from '../components/DailyLogPlaceholder';
import StopSchedule from '../components/StopSchedule';
import Loading from '../components/Loading';
import Error from '../components/Error';
import tripService from '../services/tripService';

const TripPlanner = () => {
  const [viewState, setViewState] = useState('idle'); // 'idle' | 'loading' | 'error' | 'success'
  const [tripData, setTripData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Driver & Shipping Manifest Form State
  const [manifestDetails, setManifestDetails] = useState({
    driver_name: 'Demo Driver',
    vehicle_number: 'TRK-001 / Trailer #TR-88',
    shipping_number: 'AUTO-0001',
    shipper_commodity: 'GENERAL FREIGHT / DRY VAN',
    driver_signature: 'Demo Driver',
  });

  const handleFormSubmit = async (formData) => {
    setViewState('loading');
    setErrorMessage('');
    try {
      const response = await tripService.planTrip(formData);
      if (response && response.data) {
        setTripData(response.data);
        setViewState('success');
      } else {
        throw new Error('Invalid response structure from backend service.');
      }
    } catch (err) {
      console.error('Trip Planning Error:', err);
      let detail = err?.response?.data?.message || err?.message || 'Failed to calculate route geometry.';

      if (err.message === 'Network Error' || !err.response) {
        detail = 'Network Error: Unable to connect to the backend API server. If deployed on Vercel, set VITE_API_BASE_URL in Vercel project settings to your backend URL (e.g. https://routewise-backend.onrender.com/api). If running locally, ensure backend is active at http://localhost:8000.';
      }

      setErrorMessage(detail);
      setViewState('error');
    }
  };

  const handleFormReset = () => {
    setTripData(null);
    setViewState('idle');
    setErrorMessage('');
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Workspace Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Trip Planner Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              OpenRouteService Route Geometry, Stop Planner, and FMCSA Multi-Day Daily Logs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-300">FMCSA Daily Logs Active</span>
          </div>
        </div>

        {/* Main Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form, Trip Summary & Driver Manifest Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <TripForm onSubmit={handleFormSubmit} onReset={handleFormReset} />
            <TripSummaryPlaceholder data={tripData} />
            <DriverManifestForm details={manifestDetails} onChange={setManifestDetails} />
          </div>

          {/* Right Column: Map & Daily Log */}
          <div className="lg:col-span-7 space-y-6">
            {/* Conditional Views */}
            {viewState === 'loading' && <Loading message="Generating FMCSA Daily Logs, route geometry, and timeline..." />}
            {viewState === 'error' && (
              <Error
                title="Route Calculation Error"
                message={errorMessage || 'Unable to fetch route geometry from backend.'}
                onRetry={() => setViewState('idle')}
              />
            )}
            {(viewState === 'idle' || viewState === 'success') && (
              <MapPlaceholder
                geometry={tripData?.geometry || []}
                stops={tripData?.stops || []}
              />
            )}

            {/* Dynamic Multi-day FMCSA Daily Log Sheets with Live Manifest Details */}
            <DailyLogPlaceholder
              logs={tripData?.daily_logs || []}
              dailyLogs={tripData?.daily_logs || []}
              manifestDetails={manifestDetails}
            />
          </div>
        </div>

        {/* Ordered Stop Schedule Table */}
        <StopSchedule stops={tripData?.stops || []} timeline={tripData?.timeline || []} />
      </div>
    </div>
  );
};

export default TripPlanner;

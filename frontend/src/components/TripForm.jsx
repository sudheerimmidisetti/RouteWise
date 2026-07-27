import React, { useState } from 'react';
import LocationSearch from './LocationSearch';

/**
 * TripForm component for collecting commercial trip parameters with client-side validation,
 * location resolution tracking, real-time geocoding search, loading states, and accessibility.
 *
 * Fields: Current Location, Pickup Location, Dropoff Location, Current Cycle Used.
 */
const TripForm = ({ onSubmit, onReset, isLoading = false }) => {
  const [formData, setFormData] = useState({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: '0',
  });

  // Track resolved location objects (lat, lon, city, state, country)
  const [locationDetails, setLocationDetails] = useState({
    currentLocation: null,
    pickupLocation: null,
    dropoffLocation: null,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // 1. Current Location Validation
    if (!formData.currentLocation.trim()) {
      newErrors.currentLocation = 'Current location is required.';
    } else if (
      !locationDetails.currentLocation &&
      formData.currentLocation.trim().length > 0
    ) {
      newErrors.currentLocation = 'Please select a valid location from the dropdown suggestions.';
    }

    // 2. Pickup Location Validation
    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required.';
    } else if (
      !locationDetails.pickupLocation &&
      formData.pickupLocation.trim().length > 0
    ) {
      newErrors.pickupLocation = 'Please select a valid location from the dropdown suggestions.';
    }

    // 3. Dropoff Location Validation
    if (!formData.dropoffLocation.trim()) {
      newErrors.dropoffLocation = 'Dropoff location is required.';
    } else if (
      !locationDetails.dropoffLocation &&
      formData.dropoffLocation.trim().length > 0
    ) {
      newErrors.dropoffLocation = 'Please select a valid location from the dropdown suggestions.';
    }

    // 4. Current Cycle Used Validation
    const cycleVal = parseFloat(formData.currentCycleUsed);
    if (isNaN(cycleVal)) {
      newErrors.currentCycleUsed = 'Cycle hours must be a number.';
    } else if (cycleVal < 0 || cycleVal > 70) {
      newErrors.currentCycleUsed = 'Cycle hours must be between 0 and 70.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationChange = (e) => {
    const { name, value, location } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setLocationDetails((prev) => ({
      ...prev,
      [name]: location || null,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCycleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (validate() && onSubmit) {
      onSubmit({
        ...formData,
        locationDetails,
      });
    }
  };

  const handleReset = () => {
    if (isLoading) return;
    setFormData({
      currentLocation: '',
      pickupLocation: '',
      dropoffLocation: '',
      currentCycleUsed: '0',
    });
    setLocationDetails({
      currentLocation: null,
      pickupLocation: null,
      dropoffLocation: null,
    });
    setErrors({});
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Form Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Trip Planner Parameters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure commercial route waypoints & cycle hours</p>
        </div>
        <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
          70h / 8-Day Rule
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-busy={isLoading}>
        {/* 1. Current Location Field */}
        <LocationSearch
          label="Current Location"
          name="currentLocation"
          value={formData.currentLocation}
          onChange={handleLocationChange}
          placeholder="e.g. New York, NY or Airport Name"
          error={errors.currentLocation}
          icon={
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* 2. Pickup Location Field */}
        <LocationSearch
          label="Pickup Location"
          name="pickupLocation"
          value={formData.pickupLocation}
          onChange={handleLocationChange}
          placeholder="e.g. Philadelphia, PA or City Name"
          error={errors.pickupLocation}
          icon={
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
          }
        />

        {/* 3. Dropoff Location Field */}
        <LocationSearch
          label="Dropoff Location"
          name="dropoffLocation"
          value={formData.dropoffLocation}
          onChange={handleLocationChange}
          placeholder="e.g. Chicago, IL or Destination"
          error={errors.dropoffLocation}
          icon={
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4" />
            </svg>
          }
        />

        {/* 4. Current Cycle Used Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="currentCycleUsedInput" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Current Cycle Used (Hours)
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
              {formData.currentCycleUsed || 0} / 70 hrs
            </span>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                id="currentCycleUsedInput"
                type="number"
                name="currentCycleUsed"
                min="0"
                max="70"
                step="0.5"
                value={formData.currentCycleUsed}
                onChange={handleCycleChange}
                placeholder="e.g. 0"
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition placeholder:text-slate-600 ${
                  errors.currentCycleUsed
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>
            <input
              type="range"
              name="currentCycleUsed"
              min="0"
              max="70"
              step="0.5"
              value={formData.currentCycleUsed || 0}
              onChange={handleCycleChange}
              disabled={isLoading}
              className="w-full accent-indigo-500 bg-slate-900 cursor-pointer h-1.5 rounded-lg"
            />
          </div>
          {errors.currentCycleUsed && (
            <p className="text-rose-400 text-[11px] mt-1 font-mono">{errors.currentCycleUsed}</p>
          )}
        </div>

        {/* 5 & 6. Action Buttons (Calculate Route & Reset) */}
        <div className="flex items-center space-x-3 pt-3">
          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            className={`flex-1 py-3.5 px-5 font-bold rounded-xl shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
              isLoading
                ? 'bg-slate-800 text-slate-400 opacity-75 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Calculating Route...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Calculate Route</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            aria-disabled={isLoading}
            className={`px-4 py-3.5 font-semibold rounded-xl border transition text-sm ${
              isLoading
                ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/10'
            }`}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripForm;

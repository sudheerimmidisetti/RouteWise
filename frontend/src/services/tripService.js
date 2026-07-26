import apiClient from './api';
import { fallbackPlanTrip } from './fallbackPlanner';

export const tripService = {
  /**
   * Send trip planning parameters to backend API.
   * If backend is unreachable or throws a Network Error (e.g. Vercel deployment without backend),
   * seamlessly falls back to the client-side OpenStreetMap + FMCSA HOS engine.
   *
   * @param {Object} tripData - { currentLocation, pickupLocation, dropoffLocation, currentCycleUsed, locationDetails }
   * @returns {Promise<Object>} API response data object
   */
  planTrip: async (tripData) => {
    try {
      const payload = {
        current_location: tripData.currentLocation,
        pickup_location: tripData.pickupLocation,
        dropoff_location: tripData.dropoffLocation,
        current_cycle_used: parseFloat(tripData.currentCycleUsed || 0),
      };

      const response = await apiClient.post('/trip/plan', payload);
      return response.data;
    } catch (error) {
      console.warn('Backend API connection failed, executing client-side route planner fallback:', error);

      // If it's a validation error response from backend, throw it
      if (error.response && error.response.status === 400) {
        const resData = error.response.data;
        if (resData.data && typeof resData.data === 'object') {
          const firstKey = Object.keys(resData.data)[0];
          const errList = resData.data[firstKey];
          const message = Array.isArray(errList) ? errList[0] : String(errList);
          throw new Error(`${firstKey.replace('_', ' ')}: ${message}`);
        }
        if (resData.message) {
          throw new Error(resData.message);
        }
      }

      // Execute seamless client-side fallback planner for Network Errors or 5xx server issues
      try {
        const fallbackResult = await fallbackPlanTrip(tripData);
        return fallbackResult;
      } catch (fallbackErr) {
        console.error('Fallback Planner Error:', fallbackErr);
        throw new Error(error.message || 'Server connection error. Please try again.');
      }
    }
  },
};

export default tripService;

import apiClient from './api';

export const tripService = {
  /**
   * Send trip planning parameters to backend API.
   * @param {Object} tripData - { currentLocation, pickupLocation, dropoffLocation, currentCycleUsed }
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
      if (error.response && error.response.data) {
        const resData = error.response.data;
        // Extract validation errors if present
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
      throw new Error(error.message || 'Server connection error. Please try again.');
    }
  },
};

export default tripService;

import { useState } from 'react';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../utils/constants';

export const useMap = () => {
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_MAP_ZOOM);

  return {
    center,
    setCenter,
    zoom,
    setZoom,
  };
};

export default useMap;

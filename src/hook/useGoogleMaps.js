import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../components/MapConfig';

export const useGoogleMaps = () => {
  return useJsApiLoader({
    id: 'google-map-script', // ✅ ONE ID ONLY
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
};

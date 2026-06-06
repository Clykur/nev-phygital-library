import { useState } from 'react';

interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        coords: null,
        loading: false,
        error: "Geolocation is not supported by this browser.",
        permissionDenied: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        let errorMsg = "An unknown error occurred.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission was denied.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "The request to get user location timed out.";
        }
        setState({
          coords: null,
          loading: false,
          error: errorMsg,
          permissionDenied: error.code === error.PERMISSION_DENIED,
        });
      }
    );
  };

  return { ...state, requestLocation };
}

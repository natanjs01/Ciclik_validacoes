import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  source: 'browser' | 'profile' | null;
}

export function useGeolocation() {
  const { profile } = useAuth();
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: true,
    error: null,
    permissionDenied: false,
    source: null,
  });

  // Tenta obter coordenadas do perfil do usuário
  const getProfileCoordinates = useCallback((): Coordinates | null => {
    if (profile?.latitude && profile?.longitude) {
      return {
        latitude: Number(profile.latitude),
        longitude: Number(profile.longitude),
      };
    }
    return null;
  }, [profile]);

  // Solicita geolocalização do navegador
  const requestBrowserLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      // Fallback para perfil se navegador não suporta
      const profileCoords = getProfileCoordinates();
      setState({
        coordinates: profileCoords,
        loading: false,
        error: profileCoords ? null : 'Geolocalização não suportada',
        permissionDenied: false,
        source: profileCoords ? 'profile' : null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
          permissionDenied: false,
          source: 'browser',
        });
      },
      (error) => {
        // Fallback para perfil em caso de erro
        const profileCoords = getProfileCoordinates();
        
        setState({
          coordinates: profileCoords,
          loading: false,
          error: profileCoords ? null : getGeolocationErrorMessage(error),
          permissionDenied: error.code === error.PERMISSION_DENIED,
          source: profileCoords ? 'profile' : null,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache de 5 minutos
      }
    );
  }, [getProfileCoordinates]);

  // Usa coordenadas do perfil diretamente
  const useProfileLocation = useCallback(() => {
    const profileCoords = getProfileCoordinates();
    setState({
      coordinates: profileCoords,
      loading: false,
      error: profileCoords ? null : 'Coordenadas do perfil não disponíveis',
      permissionDenied: false,
      source: profileCoords ? 'profile' : null,
    });
  }, [getProfileCoordinates]);

  // Inicialização: tenta browser primeiro, fallback para perfil
  useEffect(() => {
    // Primeiro tenta perfil se já temos coordenadas
    const profileCoords = getProfileCoordinates();
    
    if (profileCoords) {
      setState({
        coordinates: profileCoords,
        loading: false,
        error: null,
        permissionDenied: false,
        source: 'profile',
      });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [getProfileCoordinates]);

  return {
    ...state,
    requestBrowserLocation,
    useProfileLocation,
    refresh: requestBrowserLocation,
    latitude: state.coordinates?.latitude,
    longitude: state.coordinates?.longitude,
  };
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permissão de localização negada';
    case error.POSITION_UNAVAILABLE:
      return 'Localização indisponível';
    case error.TIMEOUT:
      return 'Tempo esgotado ao obter localização';
    default:
      return 'Erro ao obter localização';
  }
}

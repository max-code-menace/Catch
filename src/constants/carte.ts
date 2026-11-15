import { Platform } from 'react-native';

import type { Theme } from '@/constants/theme';

// Google Maps (Android) n'a pas de mode sombre automatique : on lui donne des teintes proches du thème.
const STYLE_SOMBRE_ANDROID = [
  { elementType: 'geometry', stylers: [{ color: '#1B1614' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A99C94' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14100E' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A312C' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#10181F' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1C2419' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

/** À étaler sur chaque <MapView> pour que le fond de carte suive le thème (Apple Plans et Google Maps). */
export function themeCarte(theme: Theme) {
  return {
    userInterfaceStyle: theme === 'sombre' ? ('dark' as const) : ('light' as const),
    customMapStyle: Platform.OS === 'android' && theme === 'sombre' ? STYLE_SOMBRE_ANDROID : undefined,
  };
}

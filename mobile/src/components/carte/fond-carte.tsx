import { useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-context';
import { durees } from '@/theme/tokens';

import { Pastille } from './pastille';
import { type FondCarteProps } from './types';

// Fond de carte : Apple Plans sur iPhone, Google Maps sur Android (choix par défaut de react-native-maps).
export function FondCarte({
  ref,
  regionInitiale,
  sessions,
  selection,
  onSelection,
  montrerPosition,
  margeHaut,
  margeBas,
}: FondCarteProps) {
  const { scheme } = useTheme();
  const carte = useRef<MapView>(null);
  const sansAnimation = useReducedMotion();

  useImperativeHandle(ref, () => ({
    allerA: (region) => carte.current?.animateToRegion(region, sansAnimation ? 0 : durees.emphasized),
  }));

  return (
    <MapView
      ref={carte}
      style={StyleSheet.absoluteFill}
      initialRegion={regionInitiale}
      userInterfaceStyle={scheme}
      customMapStyle={Platform.OS === 'android' && scheme === 'dark' ? STYLE_SOMBRE_ANDROID : undefined}
      showsUserLocation={montrerPosition}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      mapPadding={{ top: margeHaut, bottom: margeBas, left: 0, right: 0 }}
      onPress={(e) => {
        if (e.nativeEvent.action !== 'marker-press') onSelection(null);
      }}>
      {sessions.map((s) => (
        <Marker
          key={s.id}
          identifier={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={s.id === selection ? 2 : 1}
          onPress={(e) => {
            e.stopPropagation();
            onSelection(s.id);
          }}>
          <Pastille session={s} choisie={s.id === selection} />
        </Marker>
      ))}
    </MapView>
  );
}

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

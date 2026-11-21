import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { themeCarte } from '@/constants/carte';
import type { Coordonnees } from '@/donnees/sessions';
import { useTheme } from '@/lib/theme';

export type PropsApercu = { position: Coordonnees };

/** Petite carte fixe (détail d'une session, Créer), avec une épingle au centre, sur le lieu. */
export function ApercuCarte({ position }: PropsApercu) {
  const { c, theme } = useTheme();
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      {...themeCarte(theme)}
      pointerEvents="none"
      initialRegion={{
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      liteMode
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}>
      <Marker coordinate={position} pinColor={c.rouge} />
    </MapView>
  );
}

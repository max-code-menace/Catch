import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Couleurs } from '@/constants/theme';
import type { Coordonnees } from '@/donnees/sessions';

export type PropsApercu = { position: Coordonnees };

/** Petite carte fixe en haut du détail, avec une épingle sur le lieu de la session. */
export function ApercuCarte({ position }: PropsApercu) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      // Le lieu est placé un peu au-dessus du centre : le bas est caché par la fiche
      initialRegion={{
        latitude: position.latitude - 0.002,
        longitude: position.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
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
      <Marker coordinate={position} pinColor={Couleurs.rouge} />
    </MapView>
  );
}

import { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { themeCarte } from '@/constants/carte';
import { PastilleSession } from '@/components/pastille-session';
import { WAVRE, type Coordonnees, type Session } from '@/donnees/sessions';
import { estEnDirect } from '@/lib/formats';
import { useTheme } from '@/lib/theme';

export type PropsCarte = {
  sessions: Session[];
  idChoisie: string | null;
  onChoisir: (id: string | null) => void;
  /** Change pour recentrer la carte sur un point */
  cible: (Coordonnees & { cle: number; rayonKm?: number }) | null;
  montrerPosition: boolean;
};

const ZOOM = { latitudeDelta: 0.11, longitudeDelta: 0.11 };

/** Carte plein écran avec une pastille par session. */
export function CarteSessions({ sessions, idChoisie, onChoisir, cible, montrerPosition }: PropsCarte) {
  const carte = useRef<MapView>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (cible) {
      // Avec un rayon : on recule assez pour voir tout le cercle
      const delta = cible.rayonKm ? (cible.rayonKm * 3) / 111 : ZOOM.latitudeDelta;
      carte.current?.animateToRegion(
        { latitude: cible.latitude, longitude: cible.longitude, latitudeDelta: delta, longitudeDelta: delta },
        400,
      );
    }
  }, [cible]);

  return (
    <MapView
      ref={carte}
      style={StyleSheet.absoluteFill}
      {...themeCarte(theme)}
      initialRegion={{ ...WAVRE, ...ZOOM }}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsUserLocation={montrerPosition}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      onPress={() => onChoisir(null)}>
      {sessions.map((session) => {
        const choisie = session.id === idChoisie;
        return (
          <Marker
            key={`${session.id}-${theme}`}
            coordinate={session.position}
            anchor={{ x: 0.5, y: 0.5 }}
            // Android fige les marqueurs en image : on ne les redessine que s'ils bougent
            tracksViewChanges={choisie || estEnDirect(session)}
            zIndex={choisie ? 2 : 1}
            onPress={(e) => {
              e.stopPropagation();
              onChoisir(session.id);
            }}>
            <PastilleSession session={session} choisie={choisie} />
          </Marker>
        );
      })}
    </MapView>
  );
}

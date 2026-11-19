import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { themeCarte } from '@/constants/carte';
import { PastilleGroupeLieux, PastilleLieu } from '@/components/pastille-lieu';
import { PastilleQuiEclate, PastilleSession } from '@/components/pastille-session';
import { CENTRE_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import { estEnDirect } from '@/lib/formats';
import type { LieuSport } from '@/lib/lieux-sport';
import { OUVERTURE_REGROUPEMENT, regrouper } from '@/lib/regroupement';
import type { Eclat } from '@/lib/sessions';
import { useTheme } from '@/lib/theme';

export type PropsCarte = {
  sessions: Session[];
  /** Sessions qui viennent de disparaître : elles éclatent sur place */
  eclats: Eclat[];
  idChoisie: string | null;
  onChoisir: (id: string | null) => void;
  /** Change pour recentrer la carte sur un point */
  cible: (Coordonnees & { cle: number; rayonKm?: number }) | null;
  montrerPosition: boolean;
  /** Terrains et salles : toujours sous les sessions, regroupés quand on dézoome */
  lieux: LieuSport[];
  idLieuChoisi: string | null;
  onChoisirLieu: (id: string) => void;
};

const ZOOM = { latitudeDelta: 0.11, longitudeDelta: 0.11 };

/** Carte plein écran avec une pastille par session. */
export function CarteSessions({
  sessions,
  eclats,
  idChoisie,
  onChoisir,
  cible,
  montrerPosition,
  lieux,
  idLieuChoisi,
  onChoisirLieu,
}: PropsCarte) {
  const carte = useRef<MapView>(null);
  const { theme } = useTheme();
  // Ouverture de la carte (latitudeDelta) : décide si les lieux se regroupent
  const [ouverture, setOuverture] = useState(ZOOM.latitudeDelta);
  const groupes = regrouper(lieux, (l) => l.position, ouverture, (l) => l.id);

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
      initialRegion={{ ...CENTRE_ZONE, ...ZOOM }}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsUserLocation={montrerPosition}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      onRegionChangeComplete={(region) => setOuverture(region.latitudeDelta)}
      onPress={() => onChoisir(null)}>
      {/* Les lieux d'abord et plus bas (zIndex 0) : les sessions restent les plus visibles */}
      {groupes.map((groupe) => {
        if (groupe.elements.length > 1) {
          return (
            <Marker
              key={`groupe-${groupe.cle}-${theme}`}
              coordinate={groupe.position}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={0}
              onPress={(e) => {
                e.stopPropagation();
                // On zoome sur le groupe jusqu'à voir chaque lieu
                const delta = OUVERTURE_REGROUPEMENT * 0.8;
                carte.current?.animateToRegion(
                  { ...groupe.position, latitudeDelta: delta, longitudeDelta: delta },
                  400,
                );
              }}>
              <PastilleGroupeLieux nombre={groupe.elements.length} />
            </Marker>
          );
        }
        const lieu = groupe.elements[0];
        const choisi = lieu.id === idLieuChoisi;
        return (
          <Marker
            key={`lieu-${lieu.id}-${theme}-${choisi}`}
            coordinate={lieu.position}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={choisi ? 2 : 0}
            accessibilityLabel={lieu.nom}
            onPress={(e) => {
              e.stopPropagation();
              onChoisirLieu(lieu.id);
            }}>
            <PastilleLieu lieu={lieu} choisi={choisi} />
          </Marker>
        );
      })}
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
      {eclats.map(({ session, delai }) => (
        <Marker
          key={`eclat-${session.id}`}
          coordinate={session.position}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
          tappable={false}
          zIndex={3}>
          <PastilleQuiEclate session={session} delai={delai} />
        </Marker>
      ))}
    </MapView>
  );
}

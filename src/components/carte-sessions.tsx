import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { themeCarte } from '@/constants/carte';
import { PastilleEvenement } from '@/components/pastille-evenement';
import { PastilleGroupeLieux, PastilleLieu } from '@/components/pastille-lieu';
import { ApparitionSi, PastilleGroupeSessions, PastilleQuiEclate, PastilleSession } from '@/components/pastille-session';
import { CENTRE_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import type { Evenement } from '@/lib/evenements';
import { useApparitions } from '@/lib/apparitions';
import { descriptionGroupe, descriptionPastille, estEnDirect } from '@/lib/formats';
import { texteType, type LieuSport } from '@/lib/lieux-sport';
import { eclatsVisibles, groupesDeSessions, zoomDuGroupe } from '@/lib/pastilles-carte';
import { OUVERTURE_REGROUPEMENT, regrouper } from '@/lib/regroupement';
import type { Eclat } from '@/lib/sessions';
import { useTheme } from '@/lib/theme';

export type PropsCarte = {
  sessions: Session[];
  /** Sessions qui viennent de disparaître : elles éclatent sur place */
  eclats: Eclat[];
  idChoisie: string | null;
  onChoisir: (id: string | null) => void;
  /** Bulle de sessions au même endroit (le zoom ne les sépare pas) : on ouvre la liste pour choisir */
  onOuvrirGroupe: (ids: string[]) => void;
  /** Change pour recentrer la carte sur un point */
  cible: (Coordonnees & { cle: number; rayonKm?: number }) | null;
  montrerPosition: boolean;
  /** Terrains et salles : toujours sous les sessions, regroupés quand on dézoome */
  lieux: LieuSport[];
  idLieuChoisi: string | null;
  onChoisirLieu: (id: string) => void;
  /** Événements, au départ : au-dessus des lieux et des sessions qui y vont ensemble */
  evenements: Evenement[];
  idEvenementChoisi: string | null;
  onChoisirEvenement: (id: string) => void;
  /** À la fin d'un geste : où regarde la carte (sert à montrer « Près de moi » quand on s'est éloigné) */
  onDeplacer?: (centre: Coordonnees, longitudeDelta: number) => void;
};

const ZOOM = { latitudeDelta: 0.11, longitudeDelta: 0.11 };

/** Carte plein écran avec une pastille par session. */
export function CarteSessions({
  sessions,
  eclats,
  idChoisie,
  onChoisir,
  onOuvrirGroupe,
  cible,
  montrerPosition,
  lieux,
  idLieuChoisi,
  onChoisirLieu,
  evenements,
  idEvenementChoisi,
  onChoisirEvenement,
  onDeplacer,
}: PropsCarte) {
  const carte = useRef<MapView>(null);
  const { theme } = useTheme();
  // Ouverture de la carte (latitudeDelta) : décide si les lieux se regroupent
  const [ouverture, setOuverture] = useState(ZOOM.latitudeDelta);
  const groupes = regrouper(lieux, (l) => l.position, ouverture, (l) => l.id);
  // Zoom et largeur de la carte : décident quelles sessions se regroupent (relu seulement à la fin du geste)
  const { width } = useWindowDimensions();
  const [longitudeDelta, setLongitudeDelta] = useState(ZOOM.longitudeDelta);
  const vue = { longitudeDelta, largeurEcran: width };
  const groupesSessions = groupesDeSessions(sessions, vue);
  const eclatsAMontrer = eclatsVisibles(eclats, sessions, vue);
  // Sessions qui viennent d'arriver : leur pastille sort de terre, l'une après l'autre
  const apparitions = useApparitions(sessions);
  const delaiGroupe = (membres: Session[]) => {
    const delais = membres.map((s) => apparitions.get(s.id)).filter((d) => d !== undefined);
    return delais.length ? Math.min(...delais) : undefined;
  };

  function toucherGroupe(membres: Session[]) {
    const zoom = zoomDuGroupe(membres, vue);
    if (!zoom) {
      onOuvrirGroupe(membres.map((s) => s.id));
      return;
    }
    // On zoome jusqu'à séparer les sessions de la bulle (la largeur décide : la hauteur suit)
    const { longitudeDelta: delta, centre } = zoom;
    carte.current?.animateToRegion(
      { ...centre, longitudeDelta: delta, latitudeDelta: delta * Math.cos((centre.latitude * Math.PI) / 180) * 0.5 },
      400,
    );
  }

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
      onRegionChangeComplete={(region) => {
        setOuverture(region.latitudeDelta);
        setLongitudeDelta(region.longitudeDelta);
        onDeplacer?.({ latitude: region.latitude, longitude: region.longitude }, region.longitudeDelta);
      }}
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
              accessibilityRole="button"
              accessibilityLabel={`${groupe.elements.length} salles et terrains`}
              accessibilityHint="Zoome pour voir chaque lieu"
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
            accessibilityRole="button"
            accessibilityLabel={`${lieu.nom}, ${texteType(lieu).toLowerCase()}`}
            onPress={(e) => {
              e.stopPropagation();
              onChoisirLieu(lieu.id);
            }}>
            <PastilleLieu lieu={lieu} choisi={choisi} />
          </Marker>
        );
      })}
      {groupesSessions.map((groupe) => {
        if (groupe.elements.length > 1) {
          const membres = groupe.elements;
          const choisie = membres.some((s) => s.id === idChoisie);
          const delai = delaiGroupe(membres);
          const pastille = <PastilleGroupeSessions sessions={membres} choisie={choisie} />;
          return (
            <Marker
              // Clé stable tant que la bulle garde les mêmes sessions : pas de clignotement sur Android
              key={`groupe-${groupe.cle}-${theme}`}
              coordinate={groupe.position}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={choisie || delai !== undefined || membres.some((s) => estEnDirect(s))}
              zIndex={choisie ? 2 : 1}
              accessibilityRole="button"
              accessibilityLabel={descriptionGroupe(membres)}
              accessibilityHint="Montre chaque session"
              onPress={(e) => {
                e.stopPropagation();
                toucherGroupe(membres);
              }}>
              <ApparitionSi delai={delai}>{pastille}</ApparitionSi>
            </Marker>
          );
        }
        const session = groupe.elements[0];
        const choisie = session.id === idChoisie;
        const delai = apparitions.get(session.id);
        const pastille = <PastilleSession session={session} choisie={choisie} />;
        return (
          <Marker
            key={`${session.id}-${theme}`}
            coordinate={session.position}
            anchor={{ x: 0.5, y: 0.5 }}
            // Android fige les marqueurs en image : on ne les redessine que s'ils bougent
            tracksViewChanges={choisie || delai !== undefined || estEnDirect(session)}
            zIndex={choisie ? 2 : 1}
            accessibilityRole="button"
            accessibilityLabel={descriptionPastille(session)}
            onPress={(e) => {
              e.stopPropagation();
              onChoisir(session.id);
            }}>
            <ApparitionSi delai={delai}>{pastille}</ApparitionSi>
          </Marker>
        );
      })}
      {evenements.map((evenement) => {
        const choisi = evenement.id === idEvenementChoisi;
        return (
          <Marker
            key={`evenement-${evenement.id}-${theme}-${choisi}`}
            coordinate={evenement.position}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            // Au-dessus des sessions : celles qui y vont ensemble partent du même endroit, la fiche les liste
            zIndex={choisi ? 4 : 2}
            accessibilityRole="button"
            accessibilityLabel={`Événement : ${evenement.nom}`}
            onPress={(e) => {
              e.stopPropagation();
              onChoisirEvenement(evenement.id);
            }}>
            <PastilleEvenement choisi={choisi} />
          </Marker>
        );
      })}
      {eclatsAMontrer.map(({ session, delai }) => (
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

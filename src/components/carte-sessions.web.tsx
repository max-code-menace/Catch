// Version web : pas de vraie carte, seulement les pastilles placées sur un fond.
// Sert à vérifier la mise en page dans un navigateur ; l'app, elle, utilise carte-sessions.tsx.
// Les pastilles sont placées avec la même projection que les vraies cartes, et regroupées de la même façon :
// toucher une bulle zoome (sans animation) ou ouvre la liste.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PropsCarte } from '@/components/carte-sessions';
import { PastilleEvenement } from '@/components/pastille-evenement';
import { PastilleLieu } from '@/components/pastille-lieu';
import { ApparitionSi, PastilleGroupeSessions, PastilleQuiEclate, PastilleSession } from '@/components/pastille-session';
import { useApparitions } from '@/lib/apparitions';
import { CENTRE_ZONE, type Coordonnees } from '@/donnees/sessions';
import { descriptionGroupe, descriptionPastille } from '@/lib/formats';
import { texteType } from '@/lib/lieux-sport';
import { eclatsVisibles, groupesDeSessions, zoomDuGroupe } from '@/lib/pastilles-carte';
import { versEcran } from '@/lib/regroupement-sessions';
import { useStyles, type Palette } from '@/lib/theme';

/** Même ouverture que l'app au démarrage */
const DELTA_DEPART = 0.11;

export function CarteSessions({
  sessions,
  eclats,
  idChoisie,
  onChoisir,
  onOuvrirGroupe,
  cible,
  lieux,
  idLieuChoisi,
  onChoisirLieu,
  evenements,
  idEvenementChoisi,
  onChoisirEvenement,
}: PropsCarte) {
  const styles = useStyles(creerStyles);
  const [taille, setTaille] = useState({ largeur: 390, hauteur: 800 });
  const [centre, setCentre] = useState<Coordonnees>(CENTRE_ZONE);
  const [longitudeDelta, setLongitudeDelta] = useState(DELTA_DEPART);
  const vue = { longitudeDelta, largeurEcran: taille.largeur };

  // Nouvelle cible (recentrer, voir plus loin) : on y va, comme la vraie carte
  const [cibleVue, setCibleVue] = useState(cible);
  if (cible !== cibleVue) {
    setCibleVue(cible);
    if (cible) {
      setCentre({ latitude: cible.latitude, longitude: cible.longitude });
      setLongitudeDelta(cible.rayonKm ? (cible.rayonKm * 3) / 111 : DELTA_DEPART);
    }
  }

  function placer({ position }: { position: Coordonnees }) {
    const { x, y } = versEcran(position, centre, vue, taille.hauteur);
    return { left: x, top: y };
  }

  const groupes = groupesDeSessions(sessions, vue);
  const apparitions = useApparitions(sessions);
  const delaiGroupe = (membres: typeof sessions) => {
    const delais = membres.map((s) => apparitions.get(s.id)).filter((d) => d !== undefined);
    return delais.length ? Math.min(...delais) : undefined;
  };

  return (
    <Pressable
      style={[StyleSheet.absoluteFill, styles.fond]}
      onLayout={(e) => setTaille({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}
      onPress={() => onChoisir(null)}>
      {lieux.map((lieu) => (
        <View key={lieu.id} style={[styles.marqueur, placer(lieu)]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${lieu.nom}, ${texteType(lieu).toLowerCase()}`}
            onPress={() => onChoisirLieu(lieu.id)}>
            <PastilleLieu lieu={lieu} choisi={lieu.id === idLieuChoisi} />
          </Pressable>
        </View>
      ))}
      {groupes.map((groupe) => {
        if (groupe.elements.length > 1) {
          const membres = groupe.elements;
          return (
            <View key={groupe.cle} style={[styles.marqueur, placer(groupe)]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={descriptionGroupe(membres)}
                onPress={() => {
                  const zoom = zoomDuGroupe(membres, vue);
                  if (!zoom) return onOuvrirGroupe(membres.map((s) => s.id));
                  setCentre(zoom.centre);
                  setLongitudeDelta(zoom.longitudeDelta);
                }}>
                <ApparitionSi delai={delaiGroupe(membres)}>
                  <PastilleGroupeSessions sessions={membres} choisie={membres.some((s) => s.id === idChoisie)} />
                </ApparitionSi>
              </Pressable>
            </View>
          );
        }
        const session = groupe.elements[0];
        return (
          <View key={session.id} style={[styles.marqueur, placer(session)]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={descriptionPastille(session)}
              onPress={() => onChoisir(session.id)}>
              <ApparitionSi delai={apparitions.get(session.id)}>
                <PastilleSession session={session} choisie={session.id === idChoisie} />
              </ApparitionSi>
            </Pressable>
          </View>
        );
      })}
      {evenements.map((evenement) => (
        <View key={evenement.id} style={[styles.marqueur, placer(evenement)]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Événement : ${evenement.nom}`}
            onPress={() => onChoisirEvenement(evenement.id)}>
            <PastilleEvenement choisi={evenement.id === idEvenementChoisi} />
          </Pressable>
        </View>
      ))}
      {eclatsVisibles(eclats, sessions, vue).map(({ session, delai }) => (
        <View key={`eclat-${session.id}`} style={[styles.marqueur, placer(session)]}>
          <PastilleQuiEclate session={session} delai={delai} />
        </View>
      ))}
    </Pressable>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fondCarte },
    marqueur: { position: 'absolute', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
  });

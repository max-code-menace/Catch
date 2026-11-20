// Version web : pas de vraie carte, seulement les pastilles placées sur un fond.
// Sert à vérifier la mise en page dans un navigateur ; l'app, elle, utilise carte-sessions.tsx.
import { Pressable, StyleSheet, View } from 'react-native';

import type { PropsCarte } from '@/components/carte-sessions';
import { PastilleEvenement } from '@/components/pastille-evenement';
import { PastilleLieu } from '@/components/pastille-lieu';
import { PastilleQuiEclate, PastilleSession } from '@/components/pastille-session';
import { CENTRE_ZONE, type Coordonnees } from '@/donnees/sessions';
import { descriptionPastille } from '@/lib/formats';
import { texteType } from '@/lib/lieux-sport';
import { useStyles, type Palette } from '@/lib/theme';

const ETENDUE = 0.13;

function placer({ position }: { position: Coordonnees }) {
  return {
    x: 50 + ((position.longitude - CENTRE_ZONE.longitude) / (ETENDUE * 1.6)) * 50,
    y: 42 - ((position.latitude - CENTRE_ZONE.latitude) / ETENDUE) * 50,
  };
}

export function CarteSessions({
  sessions,
  eclats,
  idChoisie,
  onChoisir,
  lieux,
  idLieuChoisi,
  onChoisirLieu,
  evenements,
  idEvenementChoisi,
  onChoisirEvenement,
}: PropsCarte) {
  const styles = useStyles(creerStyles);
  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.fond]} onPress={() => onChoisir(null)}>
      {lieux.map((lieu) => {
        const { x, y } = placer(lieu);
        return (
          <View key={lieu.id} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${lieu.nom}, ${texteType(lieu).toLowerCase()}`}
              onPress={() => onChoisirLieu(lieu.id)}>
              <PastilleLieu lieu={lieu} choisi={lieu.id === idLieuChoisi} />
            </Pressable>
          </View>
        );
      })}
      {sessions.map((session) => {
        const { x, y } = placer(session);
        return (
          <View key={session.id} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={descriptionPastille(session)}
              onPress={() => onChoisir(session.id)}>
              <PastilleSession session={session} choisie={session.id === idChoisie} />
            </Pressable>
          </View>
        );
      })}
      {evenements.map((evenement) => {
        const { x, y } = placer(evenement);
        return (
          <View key={evenement.id} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Événement : ${evenement.nom}`}
              onPress={() => onChoisirEvenement(evenement.id)}>
              <PastilleEvenement choisi={evenement.id === idEvenementChoisi} />
            </Pressable>
          </View>
        );
      })}
      {eclats.map(({ session, delai }) => {
        const { x, y } = placer(session);
        return (
          <View key={`eclat-${session.id}`} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <PastilleQuiEclate session={session} delai={delai} />
          </View>
        );
      })}
    </Pressable>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fondCarte },
    marqueur: { position: 'absolute', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
  });

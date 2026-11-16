// Version web : pas de vraie carte, seulement les pastilles placées sur un fond.
// Sert à vérifier la mise en page dans un navigateur ; l'app, elle, utilise carte-sessions.tsx.
import { Pressable, StyleSheet, View } from 'react-native';

import type { PropsCarte } from '@/components/carte-sessions';
import { PastilleQuiEclate, PastilleSession } from '@/components/pastille-session';
import { CENTRE_ZONE, type Session } from '@/donnees/sessions';
import { useStyles, type Palette } from '@/lib/theme';

const ETENDUE = 0.13;

function placer(session: Session) {
  return {
    x: 50 + ((session.position.longitude - CENTRE_ZONE.longitude) / (ETENDUE * 1.6)) * 50,
    y: 42 - ((session.position.latitude - CENTRE_ZONE.latitude) / ETENDUE) * 50,
  };
}

export function CarteSessions({ sessions, eclats, idChoisie, onChoisir }: PropsCarte) {
  const styles = useStyles(creerStyles);
  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.fond]} onPress={() => onChoisir(null)}>
      {sessions.map((session) => {
        const { x, y } = placer(session);
        return (
          <View key={session.id} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <Pressable onPress={() => onChoisir(session.id)}>
              <PastilleSession session={session} choisie={session.id === idChoisie} />
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

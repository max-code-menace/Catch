// Version web : pas de vraie carte, seulement les pastilles placées sur un fond.
// Sert à vérifier la mise en page dans un navigateur ; l'app, elle, utilise carte-sessions.tsx.
import { Pressable, StyleSheet, View } from 'react-native';

import type { PropsCarte } from '@/components/carte-sessions';
import { PastilleSession } from '@/components/pastille-session';
import { WAVRE } from '@/donnees/sessions';

const ETENDUE = 0.13;

export function CarteSessions({ sessions, idChoisie, onChoisir }: PropsCarte) {
  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.fond]} onPress={() => onChoisir(null)}>
      {sessions.map((session) => {
        const x = 50 + ((session.position.longitude - WAVRE.longitude) / (ETENDUE * 1.6)) * 50;
        const y = 42 - ((session.position.latitude - WAVRE.latitude) / ETENDUE) * 50;
        return (
          <View key={session.id} style={[styles.marqueur, { left: `${x}%`, top: `${y}%` }]}>
            <Pressable onPress={() => onChoisir(session.id)}>
              <PastilleSession session={session} choisie={session.id === idChoisie} />
            </Pressable>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: '#EFE9E2' },
  marqueur: { position: 'absolute', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
});

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PictoSport } from '@/components/picto-sport';
import { Couleurs, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres, textePastille } from '@/lib/formats';

/** Point rouge qui pulse sur les sessions en direct. */
export function PointEnDirect({ couleur }: { couleur: string }) {
  const pulsation = useSharedValue(0);

  useEffect(() => {
    pulsation.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
  }, [pulsation]);

  const styleHalo = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulsation.value),
    transform: [{ scale: 1 + pulsation.value * 1.6 }],
  }));

  return (
    <View style={styles.point}>
      <Animated.View style={[styles.rond, { backgroundColor: couleur }, styleHalo]} />
      <View style={[styles.rond, { backgroundColor: couleur }]} />
    </View>
  );
}

/** Pastille d'une session sur la carte. */
export function PastilleSession({ session, choisie }: { session: Session; choisie: boolean }) {
  const enDirect = estEnDirect(session);
  const manqueUn = !enDirect && placesLibres(session) === 1;

  const fond = enDirect ? Couleurs.rouge : manqueUn ? Couleurs.orangeDoux : Couleurs.carte;
  const texte = enDirect ? Couleurs.carte : manqueUn ? Couleurs.orangeTexte : Couleurs.encre;
  const bordure = enDirect ? Couleurs.rouge : manqueUn ? Couleurs.orange : Couleurs.trait;

  return (
    <View
      style={[
        styles.pastille,
        { backgroundColor: fond, borderColor: choisie ? Couleurs.encre : bordure },
        choisie && styles.choisie,
      ]}>
      <View style={styles.picto}>
        <PictoSport sport={session.sport} taille={20} />
      </View>
      {enDirect && <PointEnDirect couleur={Couleurs.carte} />}
      <Text style={[styles.texte, { color: texte }]}>{textePastille(session)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 12,
    height: 34,
    borderRadius: Rayons.pilule,
    borderWidth: 1,
    boxShadow: '0 2px 6px rgba(28, 20, 18, 0.16)',
  },
  choisie: { borderWidth: 2 },
  picto: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Couleurs.carte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille },
  point: { width: 8, height: 8 },
  rond: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
});

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres, textePastille } from '@/lib/formats';
import { DUREE_ECLAT } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Point rouge qui pulse sur les sessions en direct. */
export function PointEnDirect({ couleur }: { couleur: string }) {
  const styles = useStyles(creerStyles);
  const pulsation = useSharedValue(0);

  useEffect(() => {
    pulsation.set(withRepeat(withTiming(1, { duration: 1400 }), -1, false));
  }, [pulsation]);

  const styleHalo = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulsation.get()),
    transform: [{ scale: 1 + pulsation.get() * 1.6 }],
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
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const enDirect = estEnDirect(session);
  const manqueUn = !enDirect && placesLibres(session) === 1;

  const fond = enDirect ? c.rouge : manqueUn ? c.orangeDoux : c.carte;
  const texte = enDirect ? c.surRouge : manqueUn ? c.orangeTexte : c.encre;
  const bordure = enDirect ? c.rouge : manqueUn ? c.orange : c.trait;

  return (
    // Zone invisible d'au moins 44 px autour de la pastille (40 px de haut) : plus facile à toucher
    <View style={styles.zoneToucher}>
      <View
        style={[
          styles.pastille,
          { backgroundColor: fond, borderColor: choisie ? c.encre : bordure },
          choisie && styles.choisie,
        ]}>
        <View style={styles.picto}>
          <PictoSport sport={session.sport} taille={24} />
        </View>
        {enDirect && <PointEnDirect couleur={c.surRouge} />}
        <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.texte, { color: texte }]}>
          {textePastille(session)}
        </Text>
      </View>
    </View>
  );
}

const NOMBRE_ECLATS = 8;
const PORTEE = 44;

/** Un des petits morceaux qui partent de la pastille quand elle éclate. */
function Morceau({ angle, avancee, couleur }: { angle: number; avancee: SharedValue<number>; couleur: string }) {
  const styles = useStyles(creerStyles);
  const style = useAnimatedStyle(() => {
    const t = avancee.get();
    return {
      opacity: t === 0 ? 0 : 1 - t,
      transform: [
        { translateX: Math.cos(angle) * PORTEE * t },
        { translateY: Math.sin(angle) * PORTEE * t },
        { scale: 1 - 0.5 * t },
      ],
    };
  });
  return <Animated.View style={[styles.morceau, { backgroundColor: couleur }, style]} />;
}

/**
 * Une session qui vient de disparaître (plus aucun inscrit) : la pastille gonfle, s'efface,
 * et des morceaux partent dans tous les sens. Avec « Réduire les animations », un simple fondu.
 */
export function PastilleQuiEclate({ session, delai }: { session: Session; delai: number }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const avancee = useSharedValue(0);

  useEffect(() => {
    avancee.set(withDelay(delai, withTiming(1, { duration: DUREE_ECLAT, easing: Easing.out(Easing.quad) })));
  }, [avancee, delai]);

  const stylePastille = useAnimatedStyle(() => {
    const t = avancee.get();
    return {
      opacity: 1 - Math.min(1, t * 1.6),
      transform: [{ scale: reduit ? 1 : 1 + 0.3 * t }],
    };
  });

  return (
    <View pointerEvents="none" style={styles.zoneEclat}>
      {!reduit &&
        Array.from({ length: NOMBRE_ECLATS }, (_, i) => (
          <Morceau
            key={i}
            angle={(i / NOMBRE_ECLATS) * 2 * Math.PI}
            avancee={avancee}
            couleur={i % 2 ? c.orange : c.rouge}
          />
        ))}
      <Animated.View style={stylePastille}>
        <PastilleSession session={session} choisie={false} />
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    zoneToucher: {
      minWidth: Espaces.cibleTactile,
      minHeight: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pastille: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingLeft: 4,
      paddingRight: 14,
      height: 40,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      boxShadow: c.ombrePetite,
    },
    choisie: { borderWidth: 2 },
    picto: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.rondPicto,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texte: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit },
    point: { width: 8, height: 8 },
    rond: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    // Assez de place autour de la pastille pour que les morceaux ne soient pas coupés
    zoneEclat: { padding: PORTEE + 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    morceau: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  });

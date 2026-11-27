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
import Svg, { Path } from 'react-native-svg';

import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { traitsAnneau } from '@/lib/anneau-places';
import { estEnDirect, etiquetteGroupe, etiquettePastille, placesLibres } from '@/lib/formats';
import { PASTILLE } from '@/lib/regroupement-sessions';
import { DUREE_ECLAT } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const TAILLE_POINT = 8;

/**
 * Point qui pulse sur les sessions en direct (pastille, badge, pilule du détail) : le seul « en direct » de l'app.
 * Avec « Réduire les animations », il reste fixe.
 */
export function PointEnDirect({ couleur }: { couleur: string }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const pulsation = useSharedValue(0);

  useEffect(() => {
    if (reduit) return;
    pulsation.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [pulsation, reduit]);

  const styleHalo = useAnimatedStyle(() => ({
    opacity: pulsation.get() === 0 ? 0 : 0.5 * (1 - pulsation.get()),
    transform: [{ scale: 1 + pulsation.get() * 1.6 }],
  }));

  return (
    <View style={styles.point}>
      <Animated.View style={[styles.rond, { backgroundColor: couleur }, styleHalo]} />
      <View style={[styles.rond, { backgroundColor: couleur }]} />
    </View>
  );
}

/**
 * Pastille d'une session sur la carte : un anneau d'un trait par joueur (rempli pour chaque inscrit)
 * avec le picto au milieu, et l'heure sur son bas. Orange s'il reste 1 ou 2 places, rouge en direct.
 */
export function PastilleSession({ session, choisie }: { session: Session; choisie: boolean }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const enDirect = estEnDirect(session);
  const urgent = !enDirect && placesLibres(session) <= 2;
  const couleur = enDirect ? c.rouge : urgent ? c.orange : c.encre;
  const { anneau, traitAnneau } = PASTILLE;
  const traits = traitsAnneau(session.inscrits.length, session.joueurs, anneau, traitAnneau);

  return (
    // Zone de toucher : l'anneau et son étiquette, jamais moins de 44 points
    <View style={styles.zoneToucher}>
      <View style={{ width: anneau, height: anneau }}>
        <Svg width={anneau} height={anneau}>
          {traits.map((t, i) => (
            <Path
              key={i}
              d={t.d}
              stroke={t.plein ? couleur : c.trait}
              strokeWidth={traitAnneau}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
        <View
          style={[
            styles.disque,
            { top: traitAnneau + 1, left: traitAnneau + 1, right: traitAnneau + 1, bottom: traitAnneau + 1 },
            choisie && { borderWidth: 3, borderColor: c.rouge },
          ]}>
          <PictoSport sport={session.sport} taille={26} />
        </View>
      </View>
      <View
        style={[
          styles.etiquette,
          enDirect && { backgroundColor: c.rouge, borderColor: c.rouge },
          urgent && { backgroundColor: c.orangeDoux, borderColor: c.orange },
        ]}>
        <Text
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={[styles.texte, { color: enDirect ? c.surRouge : urgent ? c.orangeTexte : c.encre }]}>
          {etiquettePastille(session)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Bulle de plusieurs sessions qui se toucheraient sur la carte : un disque avec leur nombre, cerclé de pointillés
 * (même famille que l'anneau), et « dès 18h » dessous. Rouge si une des sessions est en direct.
 */
export function PastilleGroupeSessions({ sessions, choisie }: { sessions: Session[]; choisie: boolean }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const enDirect = sessions.some((s) => estEnDirect(s));
  const couleur = enDirect ? c.rouge : c.encre;

  return (
    <View style={styles.zoneToucher}>
      <View style={[styles.groupe, { borderColor: choisie ? c.rouge : couleur }]}>
        <Text maxFontSizeMultiplier={1.2} style={styles.nombreGroupe}>
          {sessions.length}
        </Text>
      </View>
      <View style={[styles.etiquette, enDirect && { backgroundColor: c.rouge, borderColor: c.rouge }]}>
        <Text
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={[styles.texte, { color: enDirect ? c.surRouge : c.encre }]}>
          {etiquetteGroupe(sessions)}
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
    disque: {
      position: 'absolute',
      borderRadius: PASTILLE.anneau,
      backgroundColor: c.rondPicto,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: c.ombrePetite,
    },
    // Posée sur le bas de l'anneau
    etiquette: {
      marginTop: -PASTILLE.recouvrement,
      height: PASTILLE.etiquette,
      paddingHorizontal: PASTILLE.margeEtiquette,
      borderRadius: Rayons.pilule,
      borderWidth: PASTILLE.bordure,
      borderColor: c.trait,
      backgroundColor: c.carte,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: c.ombrePetite,
      zIndex: 2,
    },
    groupe: {
      width: PASTILLE.disque,
      height: PASTILLE.disque,
      borderRadius: PASTILLE.disque / 2,
      borderWidth: 3,
      borderStyle: 'dashed',
      backgroundColor: c.rondPicto,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: c.ombrePetite,
    },
    nombreGroupe: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.surRond },
    texte: { ...Polices.texteDemi, fontSize: Tailles.pastille },
    point: { width: TAILLE_POINT, height: TAILLE_POINT },
    rond: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    // Assez de place autour de la pastille pour que les morceaux ne soient pas coupés
    zoneEclat: { padding: PORTEE + 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    morceau: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  });

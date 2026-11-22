import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PastilleSession } from '@/components/pastille-session';
import type { Session } from '@/donnees/sessions';
import { useStyles, type Palette } from '@/lib/theme';

/** Le temps que la carte se centre sur la session avant la chute */
const ATTENTE_CARTE = 450;
const CHUTE = 380;
const HAUTEUR_CHUTE = 320;
const ONDE = 900;
/** Taille d'une onde à la fin de son expansion */
const TAILLE_ONDE = 220;

function Onde({ delai }: { delai: number }) {
  const styles = useStyles(creerStyles);
  const avancee = useSharedValue(0);
  useEffect(() => {
    avancee.set(withDelay(delai, withTiming(1, { duration: ONDE, easing: Easing.out(Easing.quad) })));
  }, [avancee, delai]);
  const style = useAnimatedStyle(() => ({
    opacity: avancee.get() === 0 ? 0 : 0.6 * (1 - avancee.get()),
    transform: [{ scale: 0.2 + 0.8 * avancee.get() }],
  }));
  return <Animated.View style={[styles.onde, style]} />;
}

/**
 * La session qu'on vient de publier tombe au centre de la carte (la carte s'est centrée dessus),
 * s'écrase un peu en touchant le sol et lance deux ondes : elle est en ligne.
 * Le vrai marqueur prend le relais à la fin (`onFini`).
 */
export function SessionQuiTombe({ session, onFini }: { session: Session; onFini: () => void }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const chute = useSharedValue(reduit ? 0 : -HAUTEUR_CHUTE);
  const opacite = useSharedValue(0);
  const ecrasement = useSharedValue(0);

  useEffect(() => {
    opacite.set(withDelay(ATTENTE_CARTE, withTiming(1, { duration: 120 })));
    if (reduit) {
      opacite.set(
        withSequence(withDelay(ATTENTE_CARTE, withTiming(1, { duration: 250 })), withDelay(600, withTiming(1, { duration: 0 }, () => runOnJS(onFini)()))),
      );
      return;
    }
    chute.set(withDelay(ATTENTE_CARTE, withTiming(0, { duration: CHUTE, easing: Easing.in(Easing.quad) })));
    // En touchant la carte : elle s'écrase, puis reprend sa forme
    ecrasement.set(
      withDelay(
        ATTENTE_CARTE + CHUTE,
        withSequence(
          withTiming(1, { duration: 80 }),
          withSpring(0, { duration: 350, dampingRatio: 0.5 }, (fini) => {
            if (fini) runOnJS(onFini)();
          }),
        ),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacite.get(),
    transform: [
      { translateY: chute.get() + 6 * ecrasement.get() },
      { scaleX: 1 + 0.14 * ecrasement.get() },
      { scaleY: 1 - 0.16 * ecrasement.get() },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.cadre}>
      {!reduit && (
        <>
          <Onde delai={ATTENTE_CARTE + CHUTE} />
          <Onde delai={ATTENTE_CARTE + CHUTE + 180} />
        </>
      )}
      <Animated.View style={style}>
        <PastilleSession session={session} choisie={false} />
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    onde: {
      position: 'absolute',
      width: TAILLE_ONDE,
      height: TAILLE_ONDE,
      borderRadius: TAILLE_ONDE / 2,
      borderWidth: 3,
      borderColor: c.orange,
    },
  });

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { Couleurs, Durees, Polices, Rayons, Ressorts } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

const TAILLE_BALLE = 22;
/** Durée du vol de la balle jusqu'au bouton */
const VOL = 300;
/** Temps laissé pour voir la balle attrapée avant de passer à la suite */
const POSE = 550;
/** D'où part la balle, par rapport au bouton : en haut à droite */
const DEPART = { x: 130, y: -230 };
/** Où elle se pose : à gauche du mot « Catchée ! » */
const ARRIVEE_X = -48;

type Props = {
  /** Plus de place libre : le bouton devient « Complet » */
  complet?: boolean;
  /** Appelé à l'appui : renvoyer `false` arrête le geste (pas connecté, par exemple) */
  onDemande?: () => boolean;
  /** Appelé une fois la balle attrapée */
  onCatch: () => void;
};

/**
 * Le geste signature : on appuie, la balle arrive en cloche, le bouton l'attrape
 * (rebond, vibration) et devient « Catchée ! ».
 */
export function BoutonCatch({ complet = false, onDemande, onCatch }: Props) {
  const reduit = useReducedMotion();
  const [etat, setEtat] = useState<'pret' | 'vol' | 'attrapee'>('pret');
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const echelle = useSharedValue(1);
  const vol = useSharedValue(0);
  const attrape = useSharedValue(0);

  useEffect(() => {
    const liste = minuteurs.current;
    return () => liste.forEach(clearTimeout);
  }, []);

  const styleBouton = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));
  const styleFondAttrape = useAnimatedStyle(() => ({ opacity: attrape.get() }));
  const styleBalle = useAnimatedStyle(() => {
    const t = vol.get();
    const reste = reduit ? 0 : 1 - t;
    return {
      opacity: Math.min(1, t * 5),
      transform: [
        { translateX: ARRIVEE_X + DEPART.x * reste },
        // La balle tombe de plus en plus vite, comme une vraie
        { translateY: reduit ? 0 : DEPART.y * (1 - t * t) },
        { scale: 1 + 0.25 * reste },
      ],
    };
  });

  if (complet) return <Bouton titre="Complet" variante="secondaire" disabled />;

  function attraper() {
    vibrer.succes();
    setEtat('attrapee');
    attrape.set(withTiming(1, { duration: Durees.fast }));
    if (!reduit) {
      // Le bouton encaisse la balle, puis rebondit
      echelle.set(
        withSequence(withTiming(0.92, { duration: 70 }), withSpring(1, Ressorts.bounce)),
      );
    }
    minuteurs.current.push(setTimeout(onCatch, POSE));
  }

  function lancer() {
    if (etat !== 'pret') return;
    if (onDemande && !onDemande()) return;
    setEtat('vol');
    vol.set(withTiming(1, { duration: reduit ? Durees.fast : VOL, easing: Easing.linear }));
    minuteurs.current.push(setTimeout(attraper, reduit ? Durees.fast : VOL));
  }

  return (
    <View>
      <PressableAnime
        accessibilityRole="button"
        accessibilityLabel={etat === 'attrapee' ? 'Catchée !' : 'Catch'}
        accessibilityState={{ busy: etat !== 'pret' }}
        onPressIn={() => {
          if (etat !== 'pret') return;
          vibrer.appuiCatch();
          echelle.set(withSpring(0.96, Ressorts.snappy));
        }}
        onPressOut={() => {
          if (etat === 'pret') echelle.set(withSpring(1, Ressorts.snappy));
        }}
        onPress={lancer}
        style={[styles.bouton, styleBouton]}>
        <Animated.View style={[styles.fondAttrape, styleFondAttrape]} />
        <Text style={[styles.texte, etat === 'attrapee' && styles.texteAttrape]}>
          {etat === 'attrapee' ? 'Catchée !' : 'Catch'}
        </Text>
      </PressableAnime>
      {/* La balle vole par-dessus l'écran : elle ne doit pas gêner le doigt */}
      <Animated.View pointerEvents="none" style={[styles.balle, styleBalle]}>
        <Balle taille={TAILLE_BALLE} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 52,
    borderRadius: Rayons.bouton,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Couleurs.rouge,
    overflow: 'hidden',
  },
  fondAttrape: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: Couleurs.encre },
  texte: { fontFamily: Polices.texteDemi, fontSize: 16, color: Couleurs.carte },
  // Décalé pour laisser la place de la balle à gauche du mot
  texteAttrape: { paddingLeft: TAILLE_BALLE + 8 },
  balle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -TAILLE_BALLE / 2,
    marginTop: -TAILLE_BALLE / 2,
  },
});

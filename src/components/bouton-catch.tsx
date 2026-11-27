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
import { Bouton, TRANCHE } from '@/components/bouton';
import { Durees, Polices, Rayons, Ressorts, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { useStyles, type Palette } from '@/lib/theme';

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
  /** Texte du bouton : « Catch » dans l'app, « Rejoindre la session » sur la page web d'invitation */
  titre?: string;
  /** Plus de place libre : le bouton devient « Complet » */
  complet?: boolean;
  /** Appelé à l'appui : renvoyer `false` arrête le geste (pas connecté, par exemple) */
  onDemande?: () => boolean;
  /** Demande la place au serveur pendant que la balle vole : `false` si le Catch n'a pas pu se faire */
  onEnvoi: () => Promise<boolean>;
  /** Appelé une fois la balle attrapée, donc seulement si le serveur a dit oui */
  onCatch: () => void;
  /** Petit bouton blanc posé sur le bandeau rouge de la fiche de la carte */
  surBandeau?: boolean;
};

/**
 * Le geste signature : on appuie, la balle arrive en cloche, le bouton l'attrape
 * (rebond, vibration) et devient « Catchée ! ».
 */
export function BoutonCatch({ titre = 'Catch', complet = false, onDemande, onEnvoi, onCatch, surBandeau = false }: Props) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const [etat, setEtat] = useState<'pret' | 'vol' | 'attrapee'>('pret');
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const echelle = useSharedValue(1);
  /** Le bouton enfoncé dans sa tranche (0 : relevé, 1 : enfoncé) */
  const enfonce = useSharedValue(0);
  const vol = useSharedValue(0);
  const attrape = useSharedValue(0);

  useEffect(() => {
    const liste = minuteurs.current;
    return () => liste.forEach(clearTimeout);
  }, []);

  const styleBouton = useAnimatedStyle(() => ({
    transform: [{ translateY: enfonce.get() * (TRANCHE - 1) }, { scale: echelle.get() }],
  }));
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

  /** Le serveur a refusé ou n'a pas répondu : la balle disparaît, le bouton redevient « Catch » */
  function rater() {
    vibrer.erreur();
    vol.set(withTiming(0, { duration: Durees.fast }));
    echelle.set(withSpring(1, Ressorts.snappy));
    setEtat('pret');
  }

  async function lancer() {
    if (etat !== 'pret') return;
    if (onDemande && !onDemande()) return;
    setEtat('vol');
    const duree = reduit ? Durees.fast : VOL;
    vol.set(withTiming(1, { duration: duree, easing: Easing.linear }));
    // La balle vole pendant que le serveur répond : on ne fête que s'il a dit oui
    const [reussi] = await Promise.all([
      onEnvoi().catch(() => false),
      new Promise((fini) => minuteurs.current.push(setTimeout(fini, duree))),
    ]);
    if (reussi) attraper();
    else rater();
  }

  return (
    <View style={[styles.tranche, surBandeau && styles.trancheBandeau, etat === 'attrapee' && styles.sansTranche]}>
      <PressableAnime
        accessibilityRole="button"
        accessibilityLabel={etat === 'attrapee' ? 'Catchée !' : titre}
        accessibilityState={{ busy: etat !== 'pret' }}
        onPressIn={() => {
          if (etat !== 'pret') return;
          vibrer.appuiCatch();
          enfonce.set(withSpring(1, Ressorts.snappy));
        }}
        onPressOut={() => {
          enfonce.set(withSpring(0, Ressorts.snappy));
        }}
        onPress={lancer}
        style={[styles.bouton, surBandeau && styles.boutonBandeau, styleBouton]}>
        <Animated.View style={[styles.fondAttrape, styleFondAttrape]} />
        <Text
          maxFontSizeMultiplier={1.3}
          style={[styles.texte, surBandeau && styles.texteBandeau, etat === 'attrapee' && styles.texteAttrape]}>
          {etat === 'attrapee' ? 'Catchée !' : titre}
        </Text>
      </PressableAnime>
      {/* La balle vole par-dessus l'écran : elle ne doit pas gêner le doigt */}
      <Animated.View pointerEvents="none" style={[styles.balle, styleBalle]}>
        <Balle taille={TAILLE_BALLE} />
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    // Comme le bouton rouge : une tranche foncée dessous, où il s'enfonce sous le doigt
    tranche: { paddingBottom: TRANCHE, borderRadius: Rayons.bouton, backgroundColor: c.rougeTranche },
    sansTranche: { backgroundColor: 'transparent' },
    bouton: {
      minHeight: 52 - TRANCHE,
      borderRadius: Rayons.bouton,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
      overflow: 'hidden',
    },
    // Sur le bandeau rouge : plus petit, blanc, texte rouge
    trancheBandeau: { alignSelf: 'flex-start', minWidth: 112 },
    boutonBandeau: { minHeight: 44 - TRANCHE, paddingHorizontal: 18, backgroundColor: c.surRouge },
    texteBandeau: { fontSize: Tailles.courant, color: c.rouge },
    fondAttrape: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.encre },
    texte: { ...Polices.texteDemi, fontSize: Tailles.texte, color: c.surRouge },
    // Décalé pour laisser la place de la balle à gauche du mot
    texteAttrape: { paddingLeft: TAILLE_BALLE + 8, color: c.surRouge },
    balle: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginLeft: -TAILLE_BALLE / 2,
      marginTop: -TAILLE_BALLE / 2,
    },
  });

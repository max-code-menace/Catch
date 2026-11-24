import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Durees } from '@/constants/theme';
import { useCouleurs } from '@/lib/theme';

/** Inclinaison des titres « penchés » : assez pour donner de l'élan, pas assez pour gêner la lecture */
export const INCLINAISON = '-8deg';
/** Écart entre deux mots surlignés qui se suivent : le trait passe d'un mot à l'autre sans trou */
const DEBORD = 2;

type PropsMot = {
  texte: string;
  style: StyleProp<TextStyle>;
  /** Faux : le mot est écrit sans trait (pour mélanger mots surlignés et mots simples dans une phrase) */
  marque?: boolean;
  /** Couleur du trait (par défaut `marqueur` ; `marqueurSurRouge` sur l'en-tête rouge) */
  couleur?: string;
  /** Le trait se dessine de gauche à droite à l'arrivée, puis à chaque changement de texte */
  anime?: boolean;
  /** Attente avant de dessiner le trait, en millisecondes */
  delai?: number;
  maxFontSizeMultiplier?: number;
};

/**
 * Le trait de surligneur seul, posé en absolu derrière un texte (moitié basse).
 * Le texte se met par-dessus, dans le même parent : `backgroundColor` d'un Text couvrirait toute la ligne.
 */
export function TraitMarqueur({
  couleur,
  anime,
  delai = 0,
  cle,
}: {
  couleur?: string;
  anime?: boolean;
  delai?: number;
  /** Quand elle change, le trait se redessine (nouveau mot, nouveau nombre) */
  cle?: string | number;
}) {
  const c = useCouleurs();
  const reduit = useReducedMotion();
  const trace = useSharedValue(anime && !reduit ? 0 : 1);

  useEffect(() => {
    if (!anime || reduit) return;
    trace.set(0);
    trace.set(withDelay(delai, withTiming(1, { duration: Durees.emphasized })));
  }, [anime, reduit, cle, delai, trace]);

  const styleTrait = useAnimatedStyle(() => ({ transform: [{ scaleX: trace.get() }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.trait, { backgroundColor: couleur ?? c.marqueur }, styleTrait]}
    />
  );
}

/** Un mot, avec ou sans trait de surligneur (idée de Mathias). */
export function Mot({ texte, style, marque = true, couleur, anime, delai = 0, maxFontSizeMultiplier = 1.3 }: PropsMot) {
  return (
    <View>
      {marque && <TraitMarqueur couleur={couleur} anime={anime} delai={delai} cle={texte} />}
      <Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={style}>
        {texte}
      </Text>
    </View>
  );
}

/** Découpe en mots en gardant l'espace qui suit chaque mot (sauf le dernier) : la phrase peut passer à la ligne entre deux mots. */
export function motsDe(texte: string) {
  const mots = texte.split(' ').filter(Boolean);
  return mots.map((mot, i) => (i < mots.length - 1 ? `${mot} ` : mot));
}

type Props = Omit<PropsMot, 'texte' | 'marque'> & {
  texte: string;
  /** Penché vers l'avant, pour quelques titres forts seulement */
  penche?: boolean;
  /** Alignement des lignes quand le texte passe à la ligne */
  centre?: boolean;
  /** Titre de l'écran pour VoiceOver */
  titre?: boolean;
  styleCadre?: StyleProp<ViewStyle>;
};

/**
 * Texte surligné au marqueur, qui peut passer à la ligne. À réserver à 2-3 moments forts
 * (« Tu l'as catchée ! », les places dans l'en-tête du détail, la phrase de Créer) : partout ailleurs il perdrait son effet.
 */
export function Marqueur({ texte, penche, centre, titre, styleCadre, delai = 0, ...reste }: Props) {
  return (
    <View
      accessible
      accessibilityRole={titre ? 'header' : 'text'}
      accessibilityLabel={texte}
      style={[
        styles.cadre,
        centre && styles.centre,
        penche && { transform: [{ skewX: INCLINAISON }, { rotate: '-2deg' }] },
        styleCadre,
      ]}>
      {motsDe(texte).map((mot, i) => (
        // Chaque mot arrive un peu après le précédent : le trait a l'air d'être tiré d'un seul geste
        <Mot key={`${i}-${mot}`} texte={mot} delai={delai + i * 70} {...reste} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  centre: { justifyContent: 'center' },
  trait: {
    position: 'absolute',
    left: -DEBORD,
    right: -DEBORD,
    top: '52%',
    bottom: '10%',
    borderRadius: 3,
    transformOrigin: 'left',
  },
});

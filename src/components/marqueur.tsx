import { useEffect, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

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

type PropsSurligne = {
  children: string;
  style: StyleProp<TextStyle>;
  couleur?: string;
  /** Faux : texte sans trait */
  marque?: boolean;
  maxFontSizeMultiplier?: number;
  /** Le trait se tire de gauche à droite à l'arrivée du texte et à chaque changement de texte */
  anime?: boolean;
  delai?: number;
  cle?: string | number;
};

/**
 * Un texte avec un trait de surligneur sous sa moitié basse.
 * Le trait n'est PAS en position absolue (invisible sur l'iPhone de Maxime, 25 novembre) : c'est une vraie vue
 * dans le flux, posée avant le texte, qui prend sa hauteur sur la hauteur mesurée du texte, puis le texte
 * remonte dessus avec une marge négative (il est dessiné après, donc par-dessus).
 */
export function TexteSurligne({ children, style, couleur, marque = true, anime, delai = 0, maxFontSizeMultiplier = 1.3 }: PropsSurligne) {
  const c = useCouleurs();
  const reduit = useReducedMotion();
  const [hauteur, setHauteur] = useState(0);
  const [largeur, setLargeur] = useState(0);
  // Le trait grandit en pixels (largeur mesurée du texte), dans le flux : rien en position absolue
  const avance = useSharedValue(anime && !reduit ? 0 : 1);
  useEffect(() => {
    if (!anime || reduit || largeur <= 0) return;
    avance.set(0);
    avance.set(withDelay(delai, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })));
  }, [anime, reduit, largeur, delai, children, avance]);
  const styleLargeur = useAnimatedStyle(() => ({ width: (largeur + 2 * DEBORD) * avance.get() }));
  const haut = Math.round(hauteur * 0.5);
  const epais = Math.round(hauteur * 0.4);
  const trait = marque && hauteur > 0;
  return (
    <View style={styles.mot}>
      {trait && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              height: epais,
              marginTop: haut,
              marginLeft: -DEBORD,
              borderRadius: 3,
              backgroundColor: couleur ?? c.marqueur,
              alignSelf: 'flex-start',
            },
            anime && largeur > 0 ? styleLargeur : { width: largeur + 2 * DEBORD },
          ]}
        />
      )}
      <Text
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        onLayout={(e) => {
          const { height: h, width: l } = e.nativeEvent.layout;
          if (Math.abs(h - hauteur) > 0.5) setHauteur(h);
          if (Math.abs(l - largeur) > 0.5) setLargeur(l);
        }}
        style={[style, trait && { marginTop: -(haut + epais) }]}>
        {children}
      </Text>
    </View>
  );
}

/** Un mot, avec ou sans trait de surligneur (idée de Mathias). */
export function Mot({ texte, style, marque = true, couleur, anime, delai = 0, maxFontSizeMultiplier = 1.3 }: PropsMot) {
  return (
    <TexteSurligne
      style={style}
      marque={marque}
      couleur={couleur}
      anime={anime}
      delai={delai}
      cle={texte}
      maxFontSizeMultiplier={maxFontSizeMultiplier}>
      {texte}
    </TexteSurligne>
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
  mot: { overflow: 'visible' },
});

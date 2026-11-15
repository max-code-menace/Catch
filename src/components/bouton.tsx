import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Espaces, Polices, Rayons, Ressorts } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

type Props = Omit<PressableProps, 'children' | 'style'> & {
  titre: string;
  /** « lien » : texte rouge sans fond, pour les actions discrètes comme « Annuler ma participation » */
  variante?: 'principal' | 'secondaire' | 'lien';
  Icone?: Icone;
  style?: StyleProp<ViewStyle>;
};

/** Bouton de Catch : se réduit à 0,96 sous le doigt. */
export function Bouton({ titre, variante = 'principal', Icone, style, onPressIn, onPressOut, ...props }: Props) {
  const styles = useStyles(creerStyles);
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));
  const c = useCouleurs();
  const couleur = { principal: c.surRouge, secondaire: c.encre, lien: c.rougeTexte }[variante];

  return (
    <PressableAnime
      accessibilityRole="button"
      onPressIn={(e) => {
        echelle.set(withSpring(0.96, Ressorts.snappy));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        echelle.set(withSpring(1, Ressorts.snappy));
        onPressOut?.(e);
      }}
      style={[styles.base, styles[variante], style, styleAnime]}
      {...props}>
      {Icone && <Icone couleur={couleur} taille={18} />}
      <Text style={[styles.texte, { color: couleur }]}>{titre}</Text>
    </PressableAnime>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      minWidth: Espaces.cibleTactile,
      paddingHorizontal: 24,
      borderRadius: Rayons.bouton,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    principal: { backgroundColor: c.rouge },
    secondaire: { backgroundColor: c.carte, borderWidth: 1, borderColor: c.trait },
    lien: { minHeight: Espaces.cibleTactile },
    texte: { fontFamily: Polices.texteDemi, fontSize: 16 },
  });

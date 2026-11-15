import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Couleurs, Espaces, Polices, Rayons, Ressorts } from '@/constants/theme';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

type Props = Omit<PressableProps, 'children' | 'style'> & {
  titre: string;
  /** « lien » : texte rouge sans fond, pour les actions discrètes comme « Annuler ma participation » */
  variante?: 'principal' | 'secondaire' | 'lien';
  Icone?: Icone;
};

const COULEUR_TEXTE = {
  principal: Couleurs.carte,
  secondaire: Couleurs.encre,
  lien: Couleurs.rougeTexte,
} as const;

/** Bouton de Catch : se réduit à 0,96 sous le doigt. */
export function Bouton({ titre, variante = 'principal', Icone, onPressIn, onPressOut, ...props }: Props) {
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const couleur = COULEUR_TEXTE[variante];

  return (
    <PressableAnime
      accessibilityRole="button"
      onPressIn={(e) => {
        echelle.value = withSpring(0.96, Ressorts.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        echelle.value = withSpring(1, Ressorts.snappy);
        onPressOut?.(e);
      }}
      style={[styles.base, styles[variante], styleAnime]}
      {...props}>
      {Icone && <Icone couleur={couleur} taille={18} />}
      <Text style={[styles.texte, { color: couleur }]}>{titre}</Text>
    </PressableAnime>
  );
}

const styles = StyleSheet.create({
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
  principal: { backgroundColor: Couleurs.rouge },
  secondaire: { backgroundColor: Couleurs.carte, borderWidth: 1, borderColor: Couleurs.trait },
  lien: { minHeight: Espaces.cibleTactile },
  texte: { fontFamily: Polices.texteDemi, fontSize: 16 },
});

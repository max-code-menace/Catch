import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { Durees, Espaces, Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

type Props = {
  /** Ce qu'on voit en haut du panneau : la balle, une icône */
  entete: React.ReactNode;
  titre: string;
  texte: string;
  /** Les boutons : il y a toujours une suite à proposer */
  children: React.ReactNode;
};

/** Panneau posé sur la carte quand il n'y a rien à montrer : « Rien à 5 km », pas de réseau. */
export function PanneauCarte({ entete, titre, texte, children }: Props) {
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  return (
    <>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.voile]} />
      <Animated.View
        entering={FadeIn.duration(Durees.standard)}
        exiting={FadeOut.duration(Durees.fast)}
        style={[styles.panneau, { top: top + HAUTEUR_BARRE_HAUT + 72 }]}>
        {entete}
        <Text accessibilityRole="header" style={styles.titre}>
          {titre}
        </Text>
        <Text style={styles.texte}>{texte}</Text>
        <View style={styles.actions}>{children}</View>
      </Animated.View>
    </>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    voile: { backgroundColor: c.fond, opacity: 0.55 },
    panneau: {
      position: 'absolute',
      left: Espaces.marge,
      right: Espaces.marge,
      paddingTop: 28,
      paddingHorizontal: 22,
      paddingBottom: 22,
      gap: 10,
      alignItems: 'center',
      backgroundColor: c.carte,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    titre: {
      fontFamily: Polices.titre,
      fontSize: Tailles.titreSession,
      lineHeight: 30,
      textAlign: 'center',
      color: c.encre,
    },
    texte: {
      ...Polices.texte,
      fontSize: Tailles.courant,
      lineHeight: 22,
      textAlign: 'center',
      color: c.texteSecondaire,
    },
    actions: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
  });

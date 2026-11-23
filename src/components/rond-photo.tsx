// La tête de la personne connectée : sa photo si elle en a mis une, sinon rien (l'appelant affiche l'initiale).
import { Image, StyleSheet, View } from 'react-native';

import { IconeProfil } from '@/components/icones';
import { Rayons } from '@/constants/theme';
import { usePhoto } from '@/lib/photo';
import { useStyles, type Palette } from '@/lib/theme';

/** Icône de l'onglet Profil : ta photo en petit rond, ou la silhouette habituelle */
export function IconeProfilPhoto({ couleur, taille = 24 }: { couleur: string; taille?: number }) {
  const styles = useStyles(creerStyles);
  const { photo } = usePhoto();
  if (!photo) return <IconeProfil couleur={couleur} taille={taille} />;
  return (
    <View style={[styles.cadre, { width: taille + 4, height: taille + 4, borderColor: couleur }]}>
      <Image source={{ uri: photo }} style={styles.image} accessibilityIgnoresInvertColors />
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { borderRadius: Rayons.pilule, borderWidth: 1.5, overflow: 'hidden', backgroundColor: c.beige },
    image: { width: '100%', height: '100%' },
  });

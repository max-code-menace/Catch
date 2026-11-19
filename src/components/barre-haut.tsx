import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeCarte, IconeListe, IconeRecentrer } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

export type Vue = 'carte' | 'liste';

type Props = {
  zone: string;
  vue: Vue;
  onBasculer: () => void;
  onRecentrer: () => void;
};

/** Hauteur occupée par la barre du haut, marge comprise : sert à décaler la liste. */
export const HAUTEUR_BARRE_HAUT = 68;

/** Barre flottante du haut : logo, zone, bascule Liste / Carte, bouton recentrer. */
export function BarreHaut({ zone, vue, onBasculer, onRecentrer }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const versListe = vue === 'carte';
  const Icone = versListe ? IconeListe : IconeCarte;

  return (
    <View style={[styles.barre, { top: top + 8 }]}>
      <Text style={styles.logo}>catch</Text>
      <View style={styles.separateur} />
      <Text style={styles.zone} numberOfLines={1}>
        {zone}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={versListe ? 'Voir la liste' : 'Voir la carte'}
        onPress={onBasculer}
        style={({ pressed }) => [styles.bascule, pressed && styles.presse]}>
        <Icone couleur={c.encre} taille={18} />
        <Text style={styles.basculeTexte}>{versListe ? 'Liste' : 'Carte'}</Text>
      </Pressable>
      {/* Le bouton garde sa place en vue liste pour que la barre ne bouge pas */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recentrer sur ma position"
        onPress={onRecentrer}
        hitSlop={4}
        style={({ pressed }) => [styles.bouton, pressed && styles.presse]}>
        <IconeRecentrer couleur={c.encre} taille={20} />
      </Pressable>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    barre: {
      position: 'absolute',
      left: 12,
      right: 12,
      height: 52,
      paddingLeft: 16,
      paddingRight: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombre,
    },
    logo: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.rouge },
    separateur: { width: 1, height: 20, backgroundColor: c.trait },
    zone: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    bascule: {
      height: 40,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: Rayons.pilule,
      backgroundColor: c.fond,
      borderWidth: 1,
      borderColor: c.trait,
    },
    basculeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    bouton: {
      width: Espaces.cibleTactile,
      height: 40,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presse: { backgroundColor: c.beige },
  });

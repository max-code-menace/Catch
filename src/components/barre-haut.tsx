import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeCarte, IconeListe, IconeRecentrer } from '@/components/icones';
import { Couleurs, Espaces, Polices, Rayons } from '@/constants/theme';

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
        <Icone couleur={Couleurs.encre} taille={18} />
        <Text style={styles.basculeTexte}>{versListe ? 'Liste' : 'Carte'}</Text>
      </Pressable>
      {/* Le bouton garde sa place en vue liste pour que la barre ne bouge pas */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recentrer sur ma position"
        onPress={onRecentrer}
        hitSlop={4}
        style={({ pressed }) => [styles.bouton, pressed && styles.presse]}>
        <IconeRecentrer couleur={Couleurs.encre} taille={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barre: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 52,
    paddingLeft: 16,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.pilule,
    borderWidth: 1,
    borderColor: Couleurs.trait,
    boxShadow: '0 4px 16px rgba(28, 20, 18, 0.10)',
  },
  logo: { fontFamily: Polices.titre, fontSize: 20, color: Couleurs.rouge },
  separateur: { width: 1, height: 20, backgroundColor: Couleurs.trait },
  zone: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: 14, color: Couleurs.encre },
  bascule: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Rayons.pilule,
    backgroundColor: Couleurs.fond,
    borderWidth: 1,
    borderColor: Couleurs.trait,
  },
  basculeTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: Couleurs.encre },
  bouton: {
    width: Espaces.cibleTactile,
    height: 40,
    borderRadius: Rayons.pilule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presse: { backgroundColor: Couleurs.beige },
});

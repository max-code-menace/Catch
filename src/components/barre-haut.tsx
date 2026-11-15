import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeRecentrer } from '@/components/icones';
import { Couleurs, Espaces, Polices, Rayons } from '@/constants/theme';

type Props = { zone: string; onRecentrer: () => void };

/** Barre flottante du haut de la carte : logo, zone, bouton recentrer. */
export function BarreHaut({ zone, onRecentrer }: Props) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.barre, { top: top + 8 }]}>
      <Text style={styles.logo}>catch</Text>
      <View style={styles.separateur} />
      <Text style={styles.zone} numberOfLines={1}>
        {zone}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recentrer sur ma position"
        onPress={onRecentrer}
        hitSlop={4}
        style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}>
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
    gap: 12,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.pilule,
    borderWidth: 1,
    borderColor: Couleurs.trait,
    boxShadow: '0 4px 16px rgba(28, 20, 18, 0.10)',
  },
  logo: { fontFamily: Polices.titre, fontSize: 20, color: Couleurs.rouge },
  separateur: { width: 1, height: 20, backgroundColor: Couleurs.trait },
  zone: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: 14, color: Couleurs.encre },
  bouton: {
    width: Espaces.cibleTactile,
    height: 40,
    borderRadius: Rayons.pilule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonPresse: { backgroundColor: Couleurs.beige },
});

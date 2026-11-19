import { StyleSheet, View } from 'react-native';

import { IconeDrapeau } from '@/components/icones';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/**
 * Pastille d'un événement sur la carte, au départ : un drapeau sur fond encre.
 * Se distingue des sessions (rondes, picto du sport) et des lieux (petites, discrètes).
 */
export function PastilleEvenement({ choisi }: { choisi: boolean }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.zone}>
      <View style={[styles.drapeau, choisi && styles.choisi]}>
        <IconeDrapeau couleur={c.surEncre} taille={choisi ? 22 : 18} />
      </View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    zone: { padding: 4 },
    drapeau: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
      borderWidth: 2,
      borderColor: c.carte,
      boxShadow: c.ombre,
    },
    choisi: { width: 42, height: 42, borderRadius: 12, borderColor: c.rouge },
  });

import { StyleSheet, View } from 'react-native';

import { IconeDrapeau } from '@/components/icones';
import { Espaces } from '@/constants/theme';
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
        <IconeDrapeau couleur={c.surEncre} taille={choisi ? 26 : 22} />
      </View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    // Zone invisible d'au moins 44 px autour du drapeau : plus facile à toucher
    zone: {
      minWidth: Espaces.cibleTactile,
      minHeight: Espaces.cibleTactile,
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drapeau: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
      borderWidth: 2,
      borderColor: c.carte,
      boxShadow: c.ombre,
    },
    choisi: { width: 48, height: 48, borderRadius: 14, borderColor: c.rouge },
  });

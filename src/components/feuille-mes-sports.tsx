import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconeCoche } from '@/components/icones';
import { PictoQuiSaute } from '@/components/picto-sport';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { SPORTS_A_CHOISIR, useMesSports } from '@/lib/mes-sports';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Les tuiles des sports à cocher, dans Profil > Mes sports (sur la carte, c'est le menu de la pastille du haut) */
export function GrilleMesSports() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { sports, basculer } = useMesSports();
  return (
    <View style={styles.grille}>
      {SPORTS_A_CHOISIR.map((fiche) => {
        const choisi = sports.includes(fiche.cle);
        return (
          <Pressable
            key={fiche.cle}
            accessibilityRole="button"
            accessibilityLabel={fiche.nom}
            accessibilityState={{ selected: choisi }}
            onPress={() => {
              vibrer.selection();
              basculer(fiche.cle);
            }}
            style={({ pressed }) => [
              styles.tuile,
              choisi && styles.tuileChoisie,
              pressed && { opacity: 0.8 },
            ]}
          >
            {choisi && (
              <View style={styles.coche}>
                <IconeCoche couleur={c.surRouge} taille={12} />
              </View>
            )}
            <PictoQuiSaute sport={fiche.cle} taille={34} actif={choisi} />
            <Text maxFontSizeMultiplier={1.2} style={styles.tuileTexte} numberOfLines={1}>
              {fiche.nomTuile ?? fiche.nom}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 8 },
    tuile: {
      // 4 par rangée ; la dernière reste alignée à gauche
      width: '23.5%',
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.fond,
    },
    tuileChoisie: {
      borderWidth: 2,
      borderColor: c.rouge,
      backgroundColor: c.rougeDoux,
    },
    tuileTexte: {
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.pastille,
      color: c.encre,
    },
    coche: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 18,
      height: 18,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
    },
  });

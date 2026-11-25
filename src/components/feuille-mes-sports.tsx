import { StyleSheet, View } from 'react-native';

import { TuileSport } from '@/components/tuile-sport';
import { vibrer } from '@/lib/haptics';
import { SPORTS_A_CHOISIR, useMesSports } from '@/lib/mes-sports';
import { useStyles } from '@/lib/theme';

/** Les tuiles des sports à cocher, dans Profil > Mes sports (sur la carte, c'est le menu de la pastille du haut) */
export function GrilleMesSports() {
  const styles = useStyles(creerStyles);
  const { sports, basculer } = useMesSports();
  return (
    <View style={styles.grille}>
      {SPORTS_A_CHOISIR.map((fiche) => {
        const choisi = sports.includes(fiche.cle);
        return (
          <TuileSport
            key={fiche.cle}
            sport={fiche.cle}
            nom={fiche.nomTuile ?? fiche.nom}
            choisie={choisi}
            largeur="32%"
            onPress={() => {
              vibrer.selection();
              basculer(fiche.cle);
            }}
          />
        );
      })}
    </View>
  );
}

const creerStyles = () =>
  StyleSheet.create({
    // 3 par rangée ; la dernière reste alignée à gauche
    grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 12 },
  });

import { StyleSheet, Text } from 'react-native';

import { EcranSecondaire } from '@/components/ecran-secondaire';
import { GrilleMesSports } from '@/components/feuille-mes-sports';
import { Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

/** Profil > Mes sports : les mêmes tuiles que l'étoile de la carte. */
export default function MesSports() {
  const styles = useStyles(creerStyles);
  return (
    <EcranSecondaire titre="Mes sports">
      <Text style={styles.aide}>
        La carte et la liste ne montrent que ces sports. Tu peux tout revoir à tout moment avec l’étoile, en haut de
        la carte.
      </Text>
      <GrilleMesSports />
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

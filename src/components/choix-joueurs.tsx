// Nombre de joueurs avec le sélecteur du système : la roue d'iOS sur iPhone, une liste déroulante sur Android.
import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** De 2 à 30 joueurs, toi compris */
export const NOMBRES_JOUEURS = Array.from({ length: 29 }, (_, i) => i + 2);

type Props = {
  valeur: number;
  onChange: (nombre: number) => void;
  /** Pas moins que ce nombre (en modification : le nombre d'inscrits) */
  min?: number;
};

export function ChoixJoueurs({ valeur, onChange, min = 2 }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <Picker
      accessibilityLabel="Nombre de joueurs, toi compris"
      selectedValue={valeur}
      onValueChange={(nombre) => {
        // La roue d'iOS donne déjà sa petite vibration à chaque cran
        if (Platform.OS !== 'ios') vibrer.selection();
        onChange(Number(nombre));
      }}
      mode="dropdown"
      dropdownIconColor={c.encre}
      itemStyle={styles.element}
      style={styles.roue}>
      {NOMBRES_JOUEURS.filter((n) => n >= min).map((n) => (
        <Picker.Item key={n} value={n} label={`${n} joueurs`} color={Platform.OS === 'ios' ? c.encre : undefined} />
      ))}
    </Picker>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    // Une roue courte : 3 nombres visibles suffisent
    roue: Platform.select({
      ios: { height: 132 },
      default: { color: c.encre, backgroundColor: c.carte },
    }),
    element: { height: 132, fontFamily: Polices.texteMoyen, fontSize: Tailles.texte, color: c.encre },
  });

// Sur le web (page d'invitation), on ne crée pas de session : on affiche simplement la date choisie.
import { StyleSheet, Text } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import { heure } from '@/lib/formats';
import { useStyles, type Palette } from '@/lib/theme';

type Props = { valeur: Date; onChange: (date: Date) => void; min: Date; max: Date; pasMinutes?: 1 | 15 };

export function ChoixDateHeure({ valeur }: Props) {
  const styles = useStyles(creerStyles);
  return (
    <Text style={styles.texte}>
      {valeur.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })} · {heure(valeur)}
    </Text>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    texte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.courant, color: c.encre },
  });

import { StyleSheet, Text, View } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';


/** Rangée d'avatars qui se chevauchent, avec « +3 » s'il y en a plus. */
export function Avatars({ initiales, max = 3 }: { initiales: string[]; max?: number }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  const visibles = initiales.slice(0, max);
  const reste = initiales.length - visibles.length;

  return (
    <View style={styles.rangee} accessibilityLabel={`${initiales.length} inscrits`}>
      {visibles.map((nom, i) => (
        <View key={`${nom}-${i}`} style={[styles.avatar, { backgroundColor: teintes[i % teintes.length] }]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.texte}>{nom}</Text>
        </View>
      ))}
      {reste > 0 && (
        <View style={[styles.avatar, { backgroundColor: c.beige }]}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.texte, { color: c.encre }]}>+{reste}</Text>
        </View>
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    rangee: { flexDirection: 'row', paddingLeft: 8 },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginLeft: -8,
      borderWidth: 2,
      borderColor: c.carte,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texte: { fontFamily: Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surAvatar },
  });

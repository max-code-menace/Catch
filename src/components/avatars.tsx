import { StyleSheet, Text, View } from 'react-native';

import { Couleurs, Polices } from '@/constants/theme';

const TEINTES = ['#F5C3B5', '#FAD9B8', '#EFC9A4', '#E9D5C6'];

/** Rangée d'avatars qui se chevauchent, avec « +3 » s'il y en a plus. */
export function Avatars({ initiales, max = 3 }: { initiales: string[]; max?: number }) {
  const visibles = initiales.slice(0, max);
  const reste = initiales.length - visibles.length;

  return (
    <View style={styles.rangee} accessibilityLabel={`${initiales.length} inscrits`}>
      {visibles.map((nom, i) => (
        <View key={`${nom}-${i}`} style={[styles.avatar, { backgroundColor: TEINTES[i % TEINTES.length] }]}>
          <Text style={styles.texte}>{nom}</Text>
        </View>
      ))}
      {reste > 0 && (
        <View style={[styles.avatar, { backgroundColor: Couleurs.beige }]}>
          <Text style={styles.texte}>+{reste}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', paddingLeft: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Couleurs.carte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: { fontFamily: Polices.texteDemi, fontSize: 10, color: Couleurs.encre },
});

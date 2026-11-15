import { StyleSheet, View } from 'react-native';

import { Couleurs } from '@/constants/theme';

/** La balle orange de Catch. C'est le seul élément de l'app qui rebondit. */
export function Balle({ taille = 22 }: { taille?: number }) {
  return (
    <View
      style={[
        styles.balle,
        { width: taille, height: taille, borderRadius: taille / 2 },
      ]}>
      <View
        style={[
          styles.reflet,
          {
            width: taille * 0.3,
            height: taille * 0.3,
            borderRadius: taille * 0.15,
            top: taille * 0.16,
            left: taille * 0.2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  balle: { backgroundColor: Couleurs.orange },
  reflet: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.4)' },
});

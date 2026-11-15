import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { Couleurs, Polices } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';

export default function Carte() {
  const [catchee, setCatchee] = useState(false);

  return (
    <Ecran titre="Carte">
      <Aide>Les sessions autour de toi s'afficheront ici.</Aide>

      <View style={styles.essai}>
        <Text style={styles.message}>
          {catchee ? 'Tu l’as catchée !' : 'Essaie le bouton pour sentir la vibration.'}
        </Text>
        <Bouton
          titre={catchee ? 'Recommencer' : 'Catch'}
          variante={catchee ? 'secondaire' : 'principal'}
          onPressIn={() => !catchee && vibrer.appuiCatch()}
          onPress={() => {
            if (!catchee) vibrer.succes();
            setCatchee(!catchee);
          }}
        />
      </View>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  essai: { flex: 1, justifyContent: 'center', gap: 16 },
  message: {
    fontFamily: Polices.titreDemi,
    fontSize: 24,
    color: Couleurs.encre,
    textAlign: 'center',
  },
});

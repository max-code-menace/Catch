// Version web : pas de carte, juste de quoi vérifier la mise en page dans un navigateur.
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import type { PropsChoixLieu } from '@/components/choix-lieu';
import { Couleurs, Espaces, Polices } from '@/constants/theme';

export function ChoixLieu({ ouvert, depart, onFermer, onChoisir }: PropsChoixLieu) {
  return (
    <Modal visible={ouvert} animationType="slide" onRequestClose={onFermer}>
      <View style={styles.ecran}>
        <Text style={styles.texte}>La carte pour choisir le lieu n’existe que sur téléphone.</Text>
        <Bouton titre="Choisir ce lieu" onPress={() => onChoisir({ ...depart, choisi: true })} />
        <Bouton titre="Fermer" variante="secondaire" onPress={onFermer} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: Espaces.marge,
    backgroundColor: Couleurs.fond,
  },
  texte: { fontFamily: Polices.texte, fontSize: 16, color: Couleurs.encre, textAlign: 'center' },
});

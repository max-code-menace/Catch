// Version web : pas de carte, juste de quoi vérifier la mise en page dans un navigateur.
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import type { PropsChoixLieu } from '@/components/choix-lieu';
import { Espaces, Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

export function ChoixLieu({ ouvert, depart, onFermer, onChoisir }: PropsChoixLieu) {
  const styles = useStyles(creerStyles);
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

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: {
      flex: 1,
      justifyContent: 'center',
      gap: 12,
      padding: Espaces.marge,
      backgroundColor: c.fond,
    },
    texte: { ...Polices.texte, fontSize: Tailles.texte, color: c.encre, textAlign: 'center' },
  });

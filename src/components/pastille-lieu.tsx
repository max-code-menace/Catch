import { StyleSheet, Text, View } from 'react-native';

import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { LieuSport } from '@/lib/lieux-sport';
import { useStyles, type Palette } from '@/lib/theme';

/**
 * Pastille d'un lieu sur la carte : un petit rond discret, toujours sous les sessions.
 * Pas de « € » sur la carte (la fiche dit gratuit ou payant). Rien ne laisse croire que quelqu'un y joue.
 */
export function PastilleLieu({ lieu, choisi }: { lieu: LieuSport; choisi: boolean }) {
  const styles = useStyles(creerStyles);
  return (
    // Zone invisible de 44 px autour du rond (26 px) : plus facile à toucher
    <View style={styles.zoneToucher}>
      <View style={styles.zone}>
        <View style={[styles.rond, choisi && styles.choisi]}>
          <PictoSport sport={lieu.sports[0]} taille={choisi ? 26 : 15} />
        </View>
      </View>
    </View>
  );
}

/** Plusieurs lieux regroupés quand on dézoome : « 12 lieux » */
export function PastilleGroupeLieux({ nombre }: { nombre: number }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.zoneToucher}>
      <View style={styles.groupe}>
        <Text maxFontSizeMultiplier={1.3} style={styles.groupeTexte}>
          {nombre} lieux
        </Text>
      </View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    zoneToucher: {
      minWidth: Espaces.cibleTactile,
      minHeight: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zone: { padding: 4 },
    rond: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
      borderWidth: 1,
      borderColor: c.trait,
      opacity: 0.8,
    },
    choisi: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: c.encre, opacity: 1 },
    groupe: {
      paddingHorizontal: 12,
      height: 32,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      opacity: 0.92,
      boxShadow: c.ombrePetite,
    },
    groupeTexte: { ...Polices.texteMoyen, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

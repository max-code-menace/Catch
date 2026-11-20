import { StyleSheet, Text, View } from 'react-native';

import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { LieuSport } from '@/lib/lieux-sport';
import { useStyles, type Palette } from '@/lib/theme';

/**
 * Pastille d'un lieu sur la carte : petite et discrète, toujours sous les sessions.
 * Un « € » marque les lieux payants. Rien ne laisse croire que quelqu'un y joue.
 */
export function PastilleLieu({ lieu, choisi }: { lieu: LieuSport; choisi: boolean }) {
  const styles = useStyles(creerStyles);
  return (
    // Zone invisible de 44 px autour du petit rond (28 px) : plus facile à toucher
    <View style={styles.zoneToucher}>
      <View style={styles.zone}>
        <View style={[styles.rond, choisi && styles.choisi]}>
          <PictoSport sport={lieu.sports[0]} taille={choisi ? 22 : 17} />
        </View>
        {lieu.type === 'payant' && (
          <View style={styles.euro}>
            <Text maxFontSizeMultiplier={1} style={styles.euroTexte}>
              €
            </Text>
          </View>
        )}
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
    // Un peu de marge pour que le « € » ne soit pas coupé
    zone: { padding: 4 },
    rond: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
      borderWidth: 1,
      borderColor: c.trait,
      opacity: 0.92,
      boxShadow: c.ombrePetite,
    },
    choisi: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: c.encre, opacity: 1 },
    euro: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      minWidth: 15,
      height: 15,
      borderRadius: 8,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
    },
    euroTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surEncre },
    groupe: {
      paddingHorizontal: 10,
      height: 26,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      opacity: 0.92,
      boxShadow: c.ombrePetite,
    },
    groupeTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
  });

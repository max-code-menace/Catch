import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { IconeEtoile } from '@/components/icones';
import { Durees, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Temps d'affichage : assez pour lire et toucher « Modifier », sans gêner */
const DELAI = 4000;

type Props = {
  /** Change à chaque toucher de l'étoile : relance le message et son minuteur */
  cle: number;
  /** Vrai : la carte montre tous les sports ; faux : seulement les siens */
  tous: boolean;
  /** « Foot, padel, tennis » */
  sports: string;
  onModifier: () => void;
  onFini: () => void;
};

/**
 * Petit message sous la barre du haut quand on touche l'étoile : dit ce que la carte montre maintenant,
 * avec « Modifier » pour changer ses sports. Il s'efface tout seul et ne bloque pas la carte.
 */
export function ToastMesSports({ cle, tous, sports, onModifier, onFini }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    const minuteur = setTimeout(onFini, DELAI);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  return (
    <View pointerEvents="box-none" style={[styles.cadre, { top: top + HAUTEUR_BARRE_HAUT + 4 }]}>
      <Animated.View
        key={cle}
        entering={FadeInUp.duration(Durees.standard)}
        exiting={FadeOutUp.duration(Durees.fast)}
        accessibilityLiveRegion="polite"
        style={styles.toast}>
        <IconeEtoile couleur={tous ? c.surEncre : c.rouge} taille={18} pleine={!tous} />
        <Text maxFontSizeMultiplier={1.3} style={styles.texte} numberOfLines={1}>
          {tous ? 'Tous les sports' : `Tes sports · ${sports}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Modifier mes sports"
          onPress={onModifier}
          hitSlop={8}
          style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.boutonTexte}>
            Modifier
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
    toast: {
      maxWidth: '100%',
      height: 48,
      paddingLeft: 16,
      paddingRight: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.encre,
      borderRadius: Rayons.pilule,
      boxShadow: c.ombreForte,
    },
    texte: { flexShrink: 1, fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.surEncre },
    bouton: {
      height: 38,
      minWidth: Espaces.cibleTactile,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.surEncreDoux,
    },
    boutonTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.surEncre },
  });

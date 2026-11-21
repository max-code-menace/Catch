import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeChevron, IconeFermer } from '@/components/icones';
import { BarreNavigation, Durees, Espaces, Polices, Rayons, RESERVE_BAS, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  /** Le picto du sport (ou la balle quand il n'y a rien du tout) */
  picto: React.ReactNode;
  /** Petite ligne du haut : « Rien à 5 km · la plus proche » */
  surtitre: string;
  /** Absent quand il n'y a rien à proposer, même plus loin */
  titre?: string;
  detail?: string;
  /** Toucher la carte : ouvre la session (ou l'événement, le lieu) */
  onOuvrir?: () => void;
  /** Pastille à droite : « +7 autres », « Sur la carte » */
  bouton?: { titre: string; onPress: () => void };
  onFermer: () => void;
};

/**
 * Carte vide : à la place d'un grand panneau, une petite carte avec ce qu'il y a de plus proche,
 * une pastille pour voir le reste et une croix sur le coin.
 */
export function CartePlusProche({ picto, surtitre, titre, detail, onOuvrir, bouton, onFermer }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.cadre, { bottom: bas }]}>
      <Pressable
        accessibilityRole={onOuvrir ? 'button' : undefined}
        accessibilityLabel={[surtitre, titre, detail].filter(Boolean).join(', ')}
        disabled={!onOuvrir}
        onPress={onOuvrir}
        style={({ pressed }) => [styles.carte, pressed && { backgroundColor: c.beige }]}>
        <View style={styles.picto}>{picto}</View>
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={1.3} style={styles.surtitre} numberOfLines={1}>
            {surtitre}
          </Text>
          {titre && (
            <Text maxFontSizeMultiplier={1.3} style={styles.titre} numberOfLines={1}>
              {titre}
            </Text>
          )}
          {detail && (
            <Text maxFontSizeMultiplier={1.3} style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          )}
        </View>
        {bouton && (
          <Pressable
            accessibilityRole="button"
            onPress={bouton.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.boutonTexte}>
              {bouton.titre}
            </Text>
            <IconeChevron couleur={c.orangeTexte} taille={14} />
          </Pressable>
        )}
      </Pressable>
      {/* La croix posée sur le coin, comme une petite bulle : elle ne prend pas de place dans la rangée */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        onPress={onFermer}
        hitSlop={12}
        style={({ pressed }) => [styles.fermer, pressed && { backgroundColor: c.beige }]}>
        <IconeFermer couleur={c.texteSecondaire} taille={14} />
      </Pressable>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { position: 'absolute', left: Espaces.marge - 8, right: Espaces.marge - 8 },
    carte: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingLeft: 12,
      paddingRight: 10,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    picto: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.orangeDoux,
    },
    textes: { flex: 1, gap: 1 },
    surtitre: { fontFamily: Polices.texte, fontSize: Tailles.micro, color: c.texteSecondaire },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    detail: { fontFamily: Polices.texte, fontSize: Tailles.micro, color: c.texteSecondaire },
    bouton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 36,
      paddingLeft: 12,
      paddingRight: 8,
      borderRadius: Rayons.pilule,
      backgroundColor: c.orangeDoux,
    },
    boutonTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.orangeTexte },
    fermer: {
      position: 'absolute',
      top: -10,
      right: -6,
      width: 26,
      height: 26,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombrePetite,
    },
  });

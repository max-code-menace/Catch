import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeChevron } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { BarreNavigation, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { descriptionPastille, estEnDirect, quand, texteDistance, textePlaces } from '@/lib/formats';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  /** Sessions au même endroit, que le zoom ne sépare pas */
  sessions: Session[];
  /** Distance en mètres depuis l'utilisateur (ou le centre de la zone) */
  distance: number;
  onChoisir: (session: Session) => void;
};

/** Liste ouverte en touchant une bulle de sessions au même endroit : on choisit la sienne. */
export function FicheGroupe({ sessions, distance, onChoisir }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const bas = Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + 12;
  const triees = [...sessions].sort((a, b) => a.debut.getTime() - b.debut.getTime());
  const lieu = triees[0]?.lieu;

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <View style={styles.ligne}>
        <Text maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.titre} numberOfLines={1}>
          {sessions.length} sessions ici
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
          {texteDistance(distance)}
        </Text>
      </View>
      {lieu && (
        <Text maxFontSizeMultiplier={1.3} style={styles.aide} numberOfLines={1}>
          {lieu}
        </Text>
      )}
      <ScrollView style={styles.liste} contentContainerStyle={styles.listeContenu}>
        {triees.map((session) => (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityLabel={descriptionPastille(session)}
            onPress={() => onChoisir(session)}
            style={({ pressed }) => [styles.rangee, pressed && { opacity: 0.7 }]}>
            <View style={styles.picto}>
              <PictoSport sport={session.sport} taille={24} />
            </View>
            <View style={styles.textes}>
              <Text maxFontSizeMultiplier={1.3} style={styles.rangeeTitre} numberOfLines={1}>
                {session.titre}
              </Text>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[styles.aide, estEnDirect(session) && { color: c.rougeTexte }]}
                numberOfLines={1}>
                {estEnDirect(session) ? 'En direct' : quand(session.debut)} · {textePlaces(session)}
              </Text>
            </View>
            <IconeChevron couleur={c.texteSecondaire} taille={16} />
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fiche: {
      position: 'absolute',
      left: 12,
      right: 12,
      padding: 16,
      gap: 6,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    titre: { flex: 1, fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    liste: { maxHeight: 280, marginTop: 4 },
    listeContenu: { gap: 2 },
    rangee: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
    picto: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.rondPicto,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textes: { flex: 1, gap: 2 },
    rangeeTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
  });

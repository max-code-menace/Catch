import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeCoche, IconeFermer } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Durees, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { SPORTS_A_CHOISIR, useMesSports } from '@/lib/mes-sports';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Ce que la carte montre en plus des sports : sessions, événements, salles et terrains */
export type TypeCarte = 'sessions' | 'evenements' | 'lieux';
export type TypesCarte = Record<TypeCarte, boolean>;
export const TOUS_LES_TYPES: TypesCarte = {
  sessions: true,
  evenements: true,
  lieux: true,
};

const TYPES: { cle: TypeCarte; titre: string }[] = [
  { cle: 'sessions', titre: 'Sessions' },
  { cle: 'evenements', titre: 'Événements' },
  { cle: 'lieux', titre: 'Salles et terrains' },
];

type Props = {
  visible: boolean;
  onFermer: () => void;
  types: TypesCarte;
  onTypes: (types: TypesCarte) => void;
  /** Sessions que la carte montrera avec ce choix, dans le rayon : écrit sur le bouton */
  nombreSessions: number;
};

/** Feuille « Modifier » (ou premier toucher de l'étoile) : ses sports à cocher, et ce qu'on affiche. */
export function FeuilleMesSports({ visible, onFermer, types, onTypes, nombreSessions }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const { sports } = useMesSports();
  // L'explication ne se montre qu'à l'ouverture, quand on n'a encore rien choisi : pas pendant qu'on coche
  const [aide, setAide] = useState(false);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) setAide(sports.length === 0);
  }

  function basculerType(cle: TypeCarte) {
    const nouveau = { ...types, [cle]: !types[cle] };
    // Au moins une chose à montrer : on ne peut pas tout décocher
    if (!nouveau.sessions && !nouveau.evenements && !nouveau.lieux) return;
    vibrer.selection();
    onTypes(nouveau);
  }

  const bouton = !types.sessions
    ? 'Voir la carte'
    : nombreSessions === 0
      ? 'Voir la carte'
      : `Voir ${nombreSessions} ${nombreSessions > 1 ? 'sessions' : 'session'}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer} statusBarTranslucent>
      <Pressable accessibilityLabel="Fermer" style={styles.voile} onPress={onFermer} />
      <Animated.View
        entering={SlideInDown.duration(Durees.emphasized)}
        style={[styles.feuille, { paddingBottom: Math.max(bottom, 16) + 8 }]}
      >
        <View style={styles.poignee} />
        <View style={styles.entete}>
          <Text maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.titre}>
            Mes sports
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onFermer}
            style={({ pressed }) => [styles.fermer, pressed && { opacity: 0.7 }]}
          >
            <IconeFermer couleur={c.encre} taille={18} />
          </Pressable>
        </View>

        <ScrollView style={styles.defile} contentContainerStyle={styles.defileContenu}>
          {aide && (
            <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
              Choisis les sports qui t’intéressent : la carte ne montrera qu’eux.
            </Text>
          )}
          <GrilleMesSports />

          <Text maxFontSizeMultiplier={1.3} style={styles.section}>
            Afficher
          </Text>
          <View style={styles.puces}>
            {TYPES.map(({ cle, titre }) => {
              const actif = types[cle];
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => basculerType(cle)}
                  style={({ pressed }) => [
                    styles.puce,
                    actif && styles.puceActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={[styles.puceTexte, actif && { color: c.surEncre }]}
                  >
                    {titre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          onPress={onFermer}
          style={({ pressed }) => [styles.valider, pressed && { opacity: 0.85 }]}
        >
          <Text maxFontSizeMultiplier={1.3} style={styles.validerTexte}>
            {bouton}
          </Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

/** Les tuiles des sports à cocher : dans la feuille de la carte et dans Profil > Mes sports */
export function GrilleMesSports() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { sports, basculer } = useMesSports();
  return (
    <View style={styles.grille}>
      {SPORTS_A_CHOISIR.map((fiche) => {
        const choisi = sports.includes(fiche.cle);
        return (
          <Pressable
            key={fiche.cle}
            accessibilityRole="button"
            accessibilityLabel={fiche.nom}
            accessibilityState={{ selected: choisi }}
            onPress={() => {
              vibrer.selection();
              basculer(fiche.cle);
            }}
            style={({ pressed }) => [
              styles.tuile,
              choisi && styles.tuileChoisie,
              pressed && { opacity: 0.8 },
            ]}
          >
            {choisi && (
              <View style={styles.coche}>
                <IconeCoche couleur={c.surRouge} taille={12} />
              </View>
            )}
            <PictoSport sport={fiche.cle} taille={34} />
            <Text maxFontSizeMultiplier={1.2} style={styles.tuileTexte} numberOfLines={1}>
              {fiche.nomTuile ?? fiche.nom}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    voile: { ...StyleSheet.absoluteFill, backgroundColor: c.voile },
    feuille: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '88%',
      paddingTop: 10,
      paddingHorizontal: Espaces.marge,
      gap: 14,
      backgroundColor: c.carte,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      boxShadow: c.ombreVersHaut,
    },
    poignee: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.trait,
    },
    entete: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titre: {
      fontFamily: Polices.titre,
      fontSize: Tailles.titreSession,
      color: c.encre,
    },
    fermer: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    defile: { flexShrink: 1 },
    defileContenu: { gap: 10, paddingBottom: 4 },
    aide: {
      fontFamily: Polices.texte,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
    },
    grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 8 },
    tuile: {
      // 4 par rangée ; la dernière reste alignée à gauche
      width: '23.5%',
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.fond,
    },
    tuileChoisie: {
      borderWidth: 2,
      borderColor: c.rouge,
      backgroundColor: c.rougeDoux,
    },
    tuileTexte: {
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.pastille,
      color: c.encre,
    },
    coche: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 18,
      height: 18,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
    },
    section: {
      marginTop: 6,
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
    },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    puce: {
      minHeight: 40,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    puceActive: { backgroundColor: c.encre, borderColor: c.encre },
    puceTexte: {
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.aide,
      color: c.encre,
    },
    valider: {
      minHeight: 54,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
    },
    validerTexte: {
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.texte,
      color: c.surRouge,
    },
  });

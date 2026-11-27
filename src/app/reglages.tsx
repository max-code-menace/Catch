import SegmentedControlNatif, {
  type SegmentedControlProps,
} from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { IconeChevron } from '@/components/icones';
import { EMAIL_CONTACT } from '@/constants/liens';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { reglerVibrations, vibrationsActives, vibrer } from '@/lib/haptics';
import { demander } from '@/lib/moderation';
import { useCouleurs, useStyles, useTheme, type Apparence, type Palette } from '@/lib/theme';

// Ses déclarations de types datent d'avant React 19 : on le présente comme un composant ordinaire
const SegmentedControl = SegmentedControlNatif as unknown as React.ComponentType<SegmentedControlProps>;

const APPARENCES: { valeur: Apparence; titre: string }[] = [
  { valeur: 'auto', titre: 'Auto' },
  { valeur: 'clair', titre: 'Clair' },
  { valeur: 'sombre', titre: 'Sombre' },
];

/** Une ligne qui ouvre un écran ou un lien. */
function LigneLien({ titre, onPress }: { titre: string; onPress: () => void }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.carte, styles.ligne, pressed && { backgroundColor: c.beige }]}>
      <Text style={styles.libelle}>{titre}</Text>
      <IconeChevron couleur={c.texteSecondaire} taille={20} />
    </Pressable>
  );
}

/** Menu du profil (les trois traits) : réglages, aide et sécurité, compte. Ouvert avec ou sans compte. */
export default function Reglages() {
  const styles = useStyles(creerStyles);
  const { c, theme, apparence, setApparence } = useTheme();
  const { compte, deconnecter } = useCompte();
  const [vibrations, setVibrations] = useState(vibrationsActives());
  const [erreur, setErreur] = useState<string | null>(null);
  const connecte = !!compte;

  function quitter() {
    demander({
      titre: 'Te déconnecter ?',
      texte: 'Tes sessions restent enregistrées. Tu les retrouveras en te reconnectant.',
      confirmer: 'Me déconnecter',
      onConfirmer: async () => {
        const probleme = await deconnecter();
        setErreur(probleme);
        if (!probleme) router.back();
      },
    });
  }

  return (
    <EcranSecondaire titre="Réglages">
      <View style={styles.groupe}>
        <View style={styles.carte}>
          <Text style={styles.libelle}>Apparence</Text>
          {/* Le sélecteur segmenté du système (UISegmentedControl sur iPhone) */}
          <SegmentedControl
            values={APPARENCES.map((a) => a.titre)}
            selectedIndex={APPARENCES.findIndex((a) => a.valeur === apparence)}
            onChange={(e) => {
              const choisie = APPARENCES[e.nativeEvent.selectedSegmentIndex];
              if (!choisie || choisie.valeur === apparence) return;
              vibrer.selection();
              setApparence(choisie.valeur);
            }}
            appearance={theme === 'sombre' ? 'dark' : 'light'}
            fontStyle={{ fontFamily: Polices.texteMoyen, color: c.texteSecondaire }}
            activeFontStyle={{ fontFamily: Polices.texteDemi, color: c.encre }}
            style={styles.segments}
          />
        </View>
        <LigneLien titre="Mes sports" onPress={() => router.push('/mes-sports')} />
        <LigneLien titre="Notifications" onPress={() => router.push('/notifications')} />
        <View style={[styles.carte, styles.ligne]}>
          <Text style={styles.libelle}>Vibrations</Text>
          <Switch
            accessibilityLabel="Vibrations"
            value={vibrations}
            onValueChange={(valeur) => {
              reglerVibrations(valeur);
              setVibrations(valeur);
              vibrer.selection();
            }}
            trackColor={{ true: c.rouge, false: c.trait }}
            thumbColor={c.rondPicto}
          />
        </View>
      </View>

      <View style={styles.groupe}>
        <Text style={styles.section}>Aide et sécurité</Text>
        <LigneLien titre="Jouer en sécurité" onPress={() => router.push('/securite')} />
        {EMAIL_CONTACT ? (
          <LigneLien titre="Nous contacter" onPress={() => Linking.openURL(`mailto:${EMAIL_CONTACT}`)} />
        ) : null}
        {connecte && <LigneLien titre="Personnes bloquées" onPress={() => router.push('/bloques')} />}
        <LigneLien titre="Confidentialité" onPress={() => router.push('/confidentialite')} />
        <LigneLien titre="Conditions d’utilisation" onPress={() => router.push('/conditions')} />
        {connecte && <LigneLien titre="Supprimer mon compte" onPress={() => router.push('/supprimer-compte')} />}
      </View>

      {connecte && (
        <View style={styles.groupe}>
          {erreur && (
            <Text accessibilityLiveRegion="polite" style={styles.aide}>
              {erreur}
            </Text>
          )}
          <Bouton titre="Me déconnecter" variante="secondaire" onPress={quitter} />
        </View>
      )}
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    groupe: { gap: 12, marginTop: 12 },
    section: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },
    carte: {
      padding: 16,
      gap: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    segments: { height: 36 },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

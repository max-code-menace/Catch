import SegmentedControlNatif, {
  type SegmentedControlProps,
} from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron, IconeEtoile } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { EMAIL_CONTACT } from '@/constants/liens';
import { ficheSport } from '@/donnees/sports';
import { useCompte } from '@/lib/compte';
import { listeSports } from '@/lib/filtre-sports';
import { reglerVibrations, vibrationsActives, vibrer } from '@/lib/haptics';
import { useMesSports } from '@/lib/mes-sports';
import { demander } from '@/lib/moderation';
import { useCouleurs, useStyles, useTheme, type Apparence, type Palette } from '@/lib/theme';

// Ses déclarations de types datent d'avant React 19 : on le présente comme un composant ordinaire
const SegmentedControl = SegmentedControlNatif as unknown as React.ComponentType<SegmentedControlProps>;

const APPARENCES: { valeur: Apparence; titre: string }[] = [
  { valeur: 'auto', titre: 'Auto' },
  { valeur: 'clair', titre: 'Clair' },
  { valeur: 'sombre', titre: 'Sombre' },
];

/** Réglages disponibles avec ou sans compte : apparence et vibrations. */
function Reglages() {
  const styles = useStyles(creerStyles);
  const { c, theme, apparence, setApparence } = useTheme();
  const [vibrations, setVibrations] = useState(vibrationsActives());

  return (
    <View style={styles.reglages}>
      <Text style={styles.section}>Réglages</Text>
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
        <Text style={styles.aide}>Auto suit le réglage de ton téléphone.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/notifications')}
        style={({ pressed }) => [styles.carte, styles.ligne, pressed && { backgroundColor: c.beige }]}>
        <Text style={styles.libelle}>Notifications</Text>
        <IconeChevron couleur={c.texteSecondaire} taille={20} />
      </Pressable>
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
  );
}

/** Mes sports : ce que la carte montre. Ouvre les mêmes tuiles que l'étoile de la carte. */
function MesSports() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { sports } = useMesSports();
  const noms = sports.length ? listeSports(sports, (s) => ficheSport(s).nom) : 'Tous les sports';
  return (
    <View style={styles.reglages}>
      <Text style={styles.section}>Mes sports</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mes sports : ${noms}`}
        accessibilityHint="Choisir les sports que montre la carte"
        onPress={() => router.push('/mes-sports')}
        style={({ pressed }) => [styles.carte, styles.ligne, pressed && { backgroundColor: c.beige }]}>
        <View style={styles.pictos}>
          {sports.length ? (
            sports.slice(0, 4).map((sport, i) => (
              <View key={sport} style={[styles.rondPicto, i > 0 && styles.rondSuivant]}>
                <PictoSport sport={sport} taille={34} />
              </View>
            ))
          ) : (
            <IconeEtoile couleur={c.encre} taille={24} />
          )}
        </View>
        <View style={styles.textesSports}>
          <Text style={styles.libelle} numberOfLines={1}>
            {noms}
          </Text>
          <Text style={styles.aide}>{sports.length ? 'Modifier' : 'Choisir mes sports'}</Text>
        </View>
        <IconeChevron couleur={c.texteSecondaire} taille={20} />
      </Pressable>
      <Text style={styles.aide}>La carte et la liste ne montrent que ces sports.</Text>
    </View>
  );
}

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

/** Aide, sécurité et compte : le contact est visible même sans compte. */
function Securite({ connecte }: { connecte: boolean }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.reglages}>
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
  );
}

export default function Profil() {
  const { compte, pret, deconnecter } = useCompte();
  const [erreur, setErreur] = useState<string | null>(null);
  const styles = useStyles(creerStyles);

  function quitter() {
    demander({
      titre: 'Te déconnecter ?',
      texte: 'Tes sessions restent enregistrées. Tu les retrouveras en te reconnectant.',
      confirmer: 'Me déconnecter',
      onConfirmer: async () => setErreur(await deconnecter()),
    });
  }

  if (!pret) return <Ecran titre="Profil" />;

  if (!compte) {
    return (
      <Ecran titre="Profil" defile>
        <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
        <MesSports />
        <Reglages />
        <Securite connecte={false} />
      </Ecran>
    );
  }

  return (
    <Ecran titre={compte.prenom ?? 'Profil'} defile>
      <MesSports />
      <Reglages />
      <Securite connecte />
      <View style={styles.fin}>
        {erreur && (
          <Text accessibilityLiveRegion="polite" style={styles.aide}>
            {erreur}
          </Text>
        )}
        <Bouton titre="Me déconnecter" variante="secondaire" onPress={quitter} />
      </View>
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    reglages: { gap: 12, marginTop: 12 },
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
    pictos: { flexDirection: 'row', alignItems: 'center' },
    rondPicto: { borderRadius: Rayons.pilule, borderWidth: 2, borderColor: c.carte },
    rondSuivant: { marginLeft: -12 },
    textesSports: { flex: 1, gap: 2 },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    fin: { gap: 8, marginTop: 12 },
  });

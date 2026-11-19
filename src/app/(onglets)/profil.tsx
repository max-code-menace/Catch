import SegmentedControlNatif, {
  type SegmentedControlProps,
} from '@react-native-segmented-control/segmented-control';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { EMAIL_CONTACT } from '@/constants/liens';
import { useCompte } from '@/lib/compte';
import { quand, quandPhrase } from '@/lib/formats';
import { reglerVibrations, vibrationsActives, vibrer } from '@/lib/haptics';
import { demander } from '@/lib/moderation';
import { useSessions } from '@/lib/sessions';
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

/** Les sessions à venir où je suis inscrit : la prochaine en premier. */
function MesSessions({ moi }: { moi: string }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { sessions, etat } = useSessions();
  const miennes = sessions
    .filter((s) => s.idsInscrits.includes(moi))
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  return (
    <View style={styles.reglages}>
      <Text style={styles.section}>Tes sessions à venir</Text>
      {miennes.length === 0 && (
        <View style={styles.carte}>
          <Text style={styles.aide}>
            {etat === 'chargement'
              ? 'Recherche de tes sessions…'
              : etat === 'erreur'
                ? 'Impossible de charger tes sessions. Vérifie ta connexion.'
                : 'Aucune session prévue. Catches-en une, ou crée la tienne.'}
          </Text>
          {etat === 'pretes' && (
            <Bouton titre="Voir les sessions" variante="secondaire" onPress={() => router.navigate('/')} />
          )}
        </View>
      )}
      {miennes.map((session) => (
        <Pressable
          key={session.id}
          accessibilityRole="button"
          accessibilityLabel={`${session.titre}, ${quandPhrase(session)}, ${session.lieu}`}
          onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
          style={({ pressed }) => [styles.carte, styles.session, pressed && { backgroundColor: c.beige }]}>
          <View style={styles.picto}>
            <PictoSport sport={session.sport} taille={30} />
          </View>
          <View style={styles.textes}>
            <Text style={styles.libelle} numberOfLines={1}>
              {session.titre} · {quand(session.debut)}
            </Text>
            <Text style={styles.aide} numberOfLines={1}>
              {session.lieu}
              {session.commune ? `, ${session.commune}` : ''}
              {session.organisateurId === moi ? ' · tu organises' : ''}
            </Text>
          </View>
          <IconeChevron couleur={c.texteSecondaire} taille={20} />
        </Pressable>
      ))}
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
        <Reglages />
        <Securite connecte={false} />
      </Ecran>
    );
  }

  return (
    <Ecran titre={compte.prenom ?? 'Profil'} defile>
      <MesSessions moi={compte.id} />
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
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    session: { flexDirection: 'row', alignItems: 'center' },
    picto: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    textes: { flex: 1, gap: 2 },
    fin: { gap: 8, marginTop: 12 },
  });

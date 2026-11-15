import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatars } from '@/components/avatars';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { IconeItineraire } from '@/components/icones';
import { Durees, Espaces, Polices, Rayons, Ressorts, Tailles } from '@/constants/theme';
import { annulationLibre, quandPhrase, texteAttente } from '@/lib/formats';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useSessions } from '@/lib/sessions';
import { useStyles, type Palette } from '@/lib/theme';

const TAILLE_BALLE = 64;
const CHUTE = -260;

/** La balle tombe du haut de l'écran et rebondit au-dessus du titre. */
function BalleQuiRebondit() {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const chute = useSharedValue(reduit ? 0 : CHUTE);
  const apparition = useSharedValue(0);

  useEffect(() => {
    apparition.set(withTiming(1, { duration: Durees.fast }));
    chute.set(withSpring(0, Ressorts.bounce));
  }, [apparition, chute]);

  const styleBalle = useAnimatedStyle(() => ({
    opacity: apparition.get(),
    transform: [{ translateY: chute.get() }],
  }));
  // L'ombre grossit quand la balle approche du sol
  const styleOmbre = useAnimatedStyle(() => {
    const hauteur = Math.min(1, Math.abs(chute.get() / CHUTE));
    return { opacity: 0.16 * (1 - hauteur), transform: [{ scaleX: 1 - 0.5 * hauteur }] };
  });

  return (
    <View style={styles.balle}>
      <Animated.View style={styleBalle}>
        <Balle taille={TAILLE_BALLE} />
      </Animated.View>
      <Animated.View style={[styles.ombre, styleOmbre]} />
    </View>
  );
}

export default function Catchee() {
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, estCatchee, annuler } = useSessions();
  const session = sessions.find((s) => s.id === id);
  // Vérifié une seule fois à l'ouverture : après « Annuler ma participation », c'est le retour qui ferme l'écran
  const [catcheeAuDepart] = useState(() => estCatchee(id));

  // Le titre arrive juste après la balle
  const titre = useSharedValue(0);
  useEffect(() => {
    titre.set(withDelay(120, withSpring(1, Ressorts.standard)));
  }, [titre]);
  const styleTitre = useAnimatedStyle(() => ({
    opacity: titre.get(),
    transform: [{ scale: 0.9 + 0.1 * titre.get() }],
  }));

  if (!session) return <Redirect href="/" />;
  if (!catcheeAuDepart) {
    return <Redirect href={{ pathname: '/session/[id]', params: { id: session.id } }} />;
  }

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.haut}>
        <BalleQuiRebondit />
        <Animated.Text accessibilityRole="header" style={[styles.titre, styleTitre]}>
          Tu l’as catchée !
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(250).duration(Durees.standard)} style={styles.resume}>
          <Text style={styles.texte}>
            {session.titre} · {quandPhrase(session)}
          </Text>
          <Text style={styles.texte}>
            {session.lieu}, {session.commune}
          </Text>

          <View style={styles.attente}>
            <Avatars initiales={session.inscrits.filter((nom) => nom !== 'Toi')} max={4} />
            <Text style={styles.attenteTexte}>{texteAttente(session)}</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(350).duration(Durees.standard)} style={styles.actions}>
        <Bouton titre="Retour à la carte" onPress={() => router.dismissAll()} />
        <Bouton
          titre="Itinéraire"
          variante="secondaire"
          Icone={IconeItineraire}
          onPress={() => ouvrirItineraire(session.position)}
        />
        <View style={styles.annulation}>
          <Bouton
            titre="Annuler ma participation"
            variante="lien"
            onPress={() => annuler(session, () => router.back())}
          />
          {annulationLibre(session) && <Text style={styles.aide}>Possible jusqu’à 3h avant</Text>}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond, paddingHorizontal: Espaces.marge },
    haut: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    balle: { alignItems: 'center', gap: 6 },
    ombre: { width: 44, height: 8, borderRadius: 4, backgroundColor: c.encre },
    titre: {
      fontFamily: Polices.titre,
      fontSize: 36,
      lineHeight: 42,
      color: c.encre,
      textAlign: 'center',
    },
    resume: { alignItems: 'center', gap: 4 },
    texte: {
      fontFamily: Polices.texte,
      fontSize: Tailles.texte,
      lineHeight: 24,
      color: c.texteSecondaire,
      textAlign: 'center',
    },
    attente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
    },
    attenteTexte: { fontFamily: Polices.texteMoyen, fontSize: 14, color: c.encre },
    actions: { gap: 10, paddingBottom: 16 },
    annulation: { alignItems: 'center', paddingTop: 4 },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

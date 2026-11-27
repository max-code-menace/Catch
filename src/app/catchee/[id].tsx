import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
import { RondToiQuiArrive } from '@/components/rond-toi';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { IconeInfo, IconeInviter } from '@/components/icones';
import { Durees, Espaces, Polices, Ressorts, Tailles } from '@/constants/theme';
import { quandPhrase, texteAttente } from '@/lib/formats';
import { usePremiersConseils } from '@/lib/conseils';
import { inviter } from '@/lib/invitation';
import { activerNotifications, permissionNotifications, type Permission } from '@/lib/notifications';
import { useSessions } from '@/lib/sessions';
import { useStyles, type Palette } from '@/lib/theme';

const surLeWeb = Platform.OS === 'web';

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
  const { sessions, estCatchee } = useSessions();
  const session = sessions.find((s) => s.id === id);
  // Vérifié une seule fois à l'ouverture
  const [catcheeAuDepart] = useState(() => estCatchee(id));
  const premiersConseils = usePremiersConseils();
  const [permission, setPermission] = useState<Permission | null>(null);
  useEffect(() => {
    permissionNotifications().then(setPermission);
  }, []);

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
        <Animated.View style={styleTitre}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.titre}>
            {surLeWeb ? 'Tu as rejoint la session' : 'Tu l’as catchée\u00a0!'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(250).duration(Durees.standard)} style={styles.resume}>
          {/* Finition M1 (24 novembre) : la balle, puis le titre, puis ton rond qui rejoint l'équipe */}
          <View style={styles.attente}>
            <View style={styles.equipe}>
              <Avatars initiales={session.inscrits.filter((nom) => nom !== 'Toi')} max={4} />
              <RondToiQuiArrive delai={650} />
            </View>
            <Text style={styles.attenteTexte}>{texteAttente(session)}</Text>
          </View>
          <Text style={styles.texte}>
            {session.titre} · {quandPhrase(session)}
          </Text>
          <Text style={styles.texte}>
            {session.lieu}, {session.commune}
          </Text>

          {premiersConseils && (
            <Bouton
              titre="Conseils pour ta première session"
              variante="lien"
              Icone={IconeInfo}
              onPress={() => router.push('/securite')}
            />
          )}

          {/* Les notifications ne sont demandées qu'ici, après un Catch, et seulement si on ne l'a jamais fait */}
          {permission === 'a-demander' && (
            <Bouton
              titre="Me rappeler 3h avant"
              variante="lien"
              onPress={async () => setPermission(await activerNotifications(true))}
            />
          )}
        </Animated.View>
      </View>

      {/* Un bouton principal et un secondaire (audit du 27 novembre) : écrire, itinéraire, calendrier et annuler sont dans le détail */}
      <Animated.View entering={FadeIn.delay(350).duration(Durees.standard)} style={styles.actions}>
        {surLeWeb ? (
          // Page web d'invitation : pas de feuille de partage ni de carte où revenir
          <Bouton
            titre="Voir la session"
            onPress={() => router.replace({ pathname: '/session/[id]', params: { id: session.id } })}
          />
        ) : (
          <>
            <Bouton titre="Inviter un pote" Icone={IconeInviter} onPress={() => inviter(session)} />
            <Bouton
              titre="C’est bon"
              variante="secondaire"
              onPress={() => (router.canGoBack() ? router.back() : router.dismissAll())}
            />
          </>
        )}
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
      fontSize: Tailles.celebration,
      lineHeight: 42,
      color: c.encre,
      textAlign: 'center',
    },
    resume: { alignItems: 'center', gap: 4 },
    texte: {
      ...Polices.texte,
      fontSize: Tailles.texte,
      lineHeight: 24,
      color: c.texteSecondaire,
      textAlign: 'center',
    },
    // L'équipe en grand sous le titre, puis qui t'attend
    attente: { alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 10 },
    equipe: { flexDirection: 'row', alignItems: 'center' },
    attenteTexte: { ...Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    actions: { gap: 10, paddingBottom: 16 },
  });

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
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { IconeCalendrier, IconeInfo, IconeInviter, IconeItineraire } from '@/components/icones';
import { Durees, Espaces, Polices, Rayons, Ressorts, Tailles } from '@/constants/theme';
import { annulationLibre, quandPhrase, texteAttente } from '@/lib/formats';
import { ajouterAuCalendrier, calendrierDisponible } from '@/lib/calendrier';
import { usePremiersConseils } from '@/lib/conseils';
import { inviter } from '@/lib/invitation';
import { ouvrirItineraire } from '@/lib/itineraire';
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
  const { sessions, estCatchee, annuler } = useSessions();
  const session = sessions.find((s) => s.id === id);
  // Vérifié une seule fois à l'ouverture : après « Annuler ma participation », c'est le retour qui ferme l'écran
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
        <Animated.Text accessibilityRole="header" style={[styles.titre, styleTitre]}>
          {surLeWeb ? 'Tu as rejoint la session' : 'Tu l’as catchée !'}
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

          {premiersConseils && (
            <Bouton
              titre="Conseils pour ta première session"
              variante="lien"
              Icone={IconeInfo}
              onPress={() => router.push('/securite')}
            />
          )}

          {calendrierDisponible && (
            <Bouton
              titre="Ajouter à mon calendrier"
              variante="lien"
              Icone={IconeCalendrier}
              onPress={() => ajouterAuCalendrier(session)}
            />
          )}

          {/* Les notifications ne sont demandées qu'ici, après un Catch, et seulement si on ne l'a jamais fait */}
          {permission === 'a-demander' && (
            <View style={styles.rappel}>
              <Text style={styles.rappelTitre}>Un rappel 3h avant ?</Text>
              <Text style={styles.aide}>Tu réponds « Je viens » ou « Je ne peux plus » en un appui.</Text>
              <Bouton
                titre="Activer le rappel"
                variante="secondaire"
                onPress={async () => setPermission(await activerNotifications(true))}
              />
            </View>
          )}
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(350).duration(Durees.standard)} style={styles.actions}>
        {/* Sur la page web d'invitation, il n'y a pas de carte où revenir ni de feuille de partage */}
        {!surLeWeb && <Bouton titre="Inviter un pote" Icone={IconeInviter} onPress={() => inviter(session)} />}
        <View style={styles.duo}>
          <Bouton
            titre="Écrire au groupe"
            variante="secondaire"
            style={styles.demi}
            onPress={() => router.push({ pathname: '/messages/[id]', params: { id: session.id } })}
          />
          <Bouton
            titre="Itinéraire"
            variante="secondaire"
            Icone={IconeItineraire}
            style={styles.demi}
            onPress={() => ouvrirItineraire(session.position)}
          />
        </View>
        <Bouton
          titre={surLeWeb ? 'Voir la session' : 'Retour à la carte'}
          variante="secondaire"
          onPress={() =>
            surLeWeb
              ? router.replace({ pathname: '/session/[id]', params: { id: session.id } })
              : router.dismissAll()
          }
        />
        <View style={styles.annulation}>
          <Bouton
            titre="Annuler ma participation"
            variante="lien"
            onPress={() =>
              // Dernier inscrit : la session disparaît, on revient directement à la carte
              annuler(session, () => (session.inscrits.length <= 1 ? router.dismissAll() : router.back()))
            }
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
      fontSize: Tailles.celebration,
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
    attenteTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    actions: { gap: 10, paddingBottom: 16 },
    rappel: {
      alignSelf: 'stretch',
      marginTop: 8,
      padding: 16,
      gap: 8,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    rappelTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre, textAlign: 'center' },
    duo: { flexDirection: 'row', gap: 8 },
    demi: { flex: 1, paddingHorizontal: 10 },
    annulation: { alignItems: 'center', paddingTop: 4 },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

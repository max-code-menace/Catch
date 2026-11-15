import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { Avatars } from '@/components/avatars';
import { BadgeSession } from '@/components/badge-session';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import {
  IconeCalendrier,
  IconeInfo,
  IconeInviter,
  IconeLieu,
  IconeRetour,
} from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import {
  annulationLibre,
  distance,
  estEnDirect,
  placesLibres,
  quandDetail,
  texteDistance,
  texteDuree,
  textePlaces,
} from '@/lib/formats';
import { useCatch } from '@/lib/catch';
import { inviter } from '@/lib/invitation';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const HAUTEUR_CARTE = 250;

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

/** Une ligne d'information : icône, titre, précision, et parfois une action à droite. */
function Ligne({
  Icone,
  titre,
  detail,
  children,
}: {
  Icone: Icone;
  titre: string;
  detail: string;
  children?: React.ReactNode;
}) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.ligne}>
      <View style={styles.ligneIcone}>
        <Icone couleur={c.rouge} taille={20} />
      </View>
      <View style={styles.ligneTextes}>
        <Text style={styles.ligneTitre}>{titre}</Text>
        <Text style={styles.aide}>{detail}</Text>
      </View>
      {children}
    </View>
  );
}

export default function DetailSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { sessions, etat, chercher, estCatchee, annuler, origine } = useSessions();
  const { autoriser, envoyer, confirmer } = useCatch();
  const session = sessions.find((s) => s.id === id);
  // Sur le web, cette page est celle d'un lien d'invitation : on parle à quelqu'un qui ne connaît pas l'app
  const invitation = Platform.OS === 'web';

  // Arrivée par un lien : la session n'est peut-être pas dans celles déjà lues, on va la chercher
  const [introuvable, setIntrouvable] = useState(false);
  const absente = !session && etat !== 'chargement';
  useEffect(() => {
    if (!absente) return;
    let actif = true;
    chercher(id).then((trouvee) => {
      if (actif && !trouvee) setIntrouvable(true);
    });
    return () => {
      actif = false;
    };
  }, [absente, chercher, id]);

  if (!session) {
    return (
      <View style={[styles.ecran, styles.attente]}>
        {introuvable ? (
          <>
            <Text accessibilityRole="header" style={[styles.titre, styles.titreSeul]}>
              Cette session n’est plus disponible
            </Text>
            <Text style={styles.aide}>Elle est terminée ou a été annulée.</Text>
            <Bouton titre="Voir les sessions" onPress={() => router.replace('/')} />
          </>
        ) : (
          <Text style={styles.aide}>Recherche de la session…</Text>
        )}
      </View>
    );
  }

  const catchee = estCatchee(session.id);
  const enDirect = estEnDirect(session);
  const libres = placesLibres(session);
  const nombre = session.inscrits.length;

  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.defilement} showsVerticalScrollIndicator={false}>
        <View style={styles.carte}>
          <ApercuCarte position={session.position} />
        </View>

        <View style={styles.fiche}>
          <BadgeSession session={session} />

          <View style={styles.entete}>
            <View style={styles.picto}>
              <PictoSport sport={session.sport} taille={36} />
            </View>
            <Text accessibilityRole="header" style={styles.titre}>
              {session.titre}
            </Text>
          </View>

          <Text style={styles.organisateur}>
            {invitation ? `${session.organisateur} t’invite à jouer` : `Organisée par ${session.organisateur}`}
          </Text>

          {session.debutantsBienvenus && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>Débutants bienvenus</Text>
            </View>
          )}

          <View style={styles.lignes}>
            <Ligne Icone={IconeCalendrier} titre={quandDetail(session)} detail={texteDuree(session)} />
            <Ligne
              Icone={IconeLieu}
              titre={session.lieu}
              // Sur la page web, on ne connaît pas la position de la personne : pas de distance
              detail={invitation ? session.commune : `${session.commune} · ${texteDistance(distance(origine, session.position))}`}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Itinéraire vers ${session.lieu}`}
                onPress={() => ouvrirItineraire(session.position)}
                hitSlop={4}
                style={({ pressed }) => [styles.itineraire, pressed && styles.presse]}>
                <Text style={styles.itineraireTexte}>Itinéraire</Text>
              </Pressable>
            </Ligne>
            {session.aSavoir && (
              <Ligne Icone={IconeInfo} titre={session.aSavoir.titre} detail={session.aSavoir.detail} />
            )}
          </View>

          <View style={styles.places}>
            <View style={styles.ligneTextes}>
              <Text style={[styles.placesTitre, libres === 0 && { color: c.encre }]}>
                {textePlaces(session)}
              </Text>
              <Text style={styles.aide}>
                {nombre} {enDirect ? 'jouent' : nombre === 1 ? 'inscrit' : 'inscrits'} sur {session.joueurs}
              </Text>
            </View>
            <Avatars initiales={session.inscrits} />
          </View>
        </View>
      </ScrollView>

      {/* Arrivé par un lien d'invitation : il n'y a pas d'écran précédent où revenir */}
      {(!invitation || router.canGoBack()) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={retour}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, { top: top + 8 }, pressed && styles.presse]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
      )}

      {invitation ? (
        <Text accessibilityLabel="Catch" style={[styles.logo, { top: top + 16 }]}>
          catch
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Inviter"
          onPress={() => inviter(session)}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, styles.inviter, { top: top + 8 }, pressed && styles.presse]}>
          <IconeInviter couleur={c.encre} taille={20} />
        </Pressable>
      )}

      <View style={[styles.bas, { paddingBottom: Math.max(bottom, 16) }]}>
        {catchee ? (
          <>
            <View style={styles.catchee}>
              <Balle taille={20} />
              <Text style={styles.catcheeTexte}>{invitation ? 'Tu as rejoint la session' : 'Tu l’as catchée !'}</Text>
            </View>
            <Bouton titre="Annuler ma participation" variante="lien" onPress={() => annuler(session, nombre <= 1 ? retour : undefined)} />
          </>
        ) : (
          <>
            <BoutonCatch
              titre={invitation ? 'Rejoindre la session' : 'Catch'}
              complet={libres === 0}
              onDemande={() => autoriser(session.id)}
              onEnvoi={() => envoyer(session.id)}
              onCatch={() => confirmer(session.id)}
            />
            <Text style={styles.mention}>
              {libres === 0
                ? 'Toutes les places sont prises'
                : annulationLibre(session)
                  ? 'Gratuit · Tu peux annuler jusqu’à 3h avant'
                  : 'Gratuit'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    defilement: { flexGrow: 1 },
    carte: { height: HAUTEUR_CARTE, backgroundColor: c.beige },
    fiche: {
      flexGrow: 1,
      marginTop: -24,
      paddingHorizontal: Espaces.marge,
      paddingTop: 24,
      paddingBottom: 24,
      gap: 12,
      backgroundColor: c.fond,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    entete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    picto: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titre: { flex: 1, fontFamily: Polices.titre, fontSize: 32, lineHeight: 38, color: c.encre },
    organisateur: { fontFamily: Polices.texte, fontSize: 15, color: c.texteSecondaire },
    pastille: {
      alignSelf: 'flex-start',
      height: 26,
      paddingHorizontal: 10,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
    },
    pastilleTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
    lignes: { gap: 16, paddingVertical: 8 },
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    ligneIcone: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.rougeDoux,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ligneTextes: { flex: 1, gap: 2 },
    ligneTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    itineraire: {
      height: 40,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    itineraireTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: c.encre },
    presse: { backgroundColor: c.beige },
    places: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    placesTitre: { fontFamily: Polices.titre, fontSize: 20, color: c.rouge },
    attente: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: Espaces.marge },
    inviter: { left: undefined, right: 16 },
    titreSeul: { flex: 0, fontSize: 24, lineHeight: 30, textAlign: 'center' },
    logo: {
      position: 'absolute',
      right: Espaces.marge,
      fontFamily: Polices.titre,
      fontSize: 22,
      color: c.rouge,
    },
    retour: {
      position: 'absolute',
      left: 16,
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: '0 4px 16px rgba(28, 20, 18, 0.10)',
    },
    bas: {
      paddingHorizontal: Espaces.marge,
      paddingTop: 12,
      gap: 6,
      backgroundColor: c.fond,
      borderTopWidth: 1,
      borderTopColor: c.trait,
    },
    mention: {
      paddingVertical: 4,
      textAlign: 'center',
      fontFamily: Polices.texte,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
    },
    catchee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 },
    catcheeTexte: { fontFamily: Polices.titre, fontSize: 22, color: c.encre },
  });

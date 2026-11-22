import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeSession } from '@/components/badge-session';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import { EquipeSession } from '@/components/equipe-session';
import {
  IconeCalendrier,
  IconeDrapeau,
  IconeInviter,
  IconeLieu,
  IconeMessages,
  IconeReglages,
  IconeRetour,
} from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { TerrainSport } from '@/components/terrain-sport';
import { Chargement } from '@/components/chargement';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import {
  annulationLibre,
  compteARebours,
  distance,
  heure,
  jourDetail,
  placesLibres,
  texteDistance,
  texteDuree,
} from '@/lib/formats';
import { choisir } from '@/lib/alerte';
import { useCatch } from '@/lib/catch';
import { useCompte } from '@/lib/compte';
import { ecrireA } from '@/lib/ecrire-prive';
import { useEvenements } from '@/lib/evenements';
import { inviter } from '@/lib/invitation';
import { ajouterAuCalendrier, calendrierDisponible } from '@/lib/calendrier';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Hauteur de l'en-tête rouge, sous la barre d'état */
const HAUTEUR_ENTETE = 230;

export default function DetailSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { sessions, etat, chercher, estCatchee, annuler, origine } = useSessions();
  const { autoriser, envoyer, confirmer } = useCatch();
  const { compte } = useCompte();
  const session = sessions.find((s) => s.id === id);
  const evenements = useEvenements();
  const evenement = session?.evenementId ? evenements.find((e) => e.id === session.evenementId) : undefined;
  // Sur le web, cette page est celle d'un lien d'invitation : on parle à quelqu'un qui ne connaît pas l'app
  const invitation = Platform.OS === 'web';

  // En défilant, une barre unie apparaît en haut avec le titre : le texte ne passe plus sous l'heure ni sous les boutons
  const defile = useSharedValue(0);
  const surDefilement = useAnimatedScrollHandler((e) => {
    defile.set(e.contentOffset.y);
  });
  const styleBarre = useAnimatedStyle(() => ({
    opacity: interpolate(defile.get(), [HAUTEUR_ENTETE - 60, HAUTEUR_ENTETE], [0, 1], 'clamp'),
  }));

  // Arrivée par un lien : la session n'est peut-être pas dans celles déjà lues, on va la chercher
  // `absente` : elle n'existe plus. `erreur` : pas de réseau, on propose de réessayer.
  const [recherche, setRecherche] = useState<'en-cours' | 'absente' | 'erreur'>('en-cours');
  const [essai, setEssai] = useState(0);
  const absente = !session && etat !== 'chargement';
  useEffect(() => {
    if (!absente) return;
    let actif = true;
    chercher(id).then((resultat) => {
      if (!actif) return;
      setRecherche(resultat === 'trouvee' ? 'en-cours' : resultat);
    });
    return () => {
      actif = false;
    };
  }, [absente, chercher, id, essai]);

  if (!session) {
    return (
      <View style={[styles.ecran, styles.attente]}>
        {recherche === 'erreur' ? (
          <>
            <Text accessibilityRole="header" style={[styles.titre, styles.titreSeul]}>
              Pas de réseau
            </Text>
            <Text style={styles.aide}>Impossible de charger la session. Vérifie ta connexion.</Text>
            <Bouton
              titre="Réessayer"
              onPress={() => {
                setRecherche('en-cours');
                setEssai((n) => n + 1);
              }}
            />
          </>
        ) : recherche === 'absente' ? (
          <>
            <Text accessibilityRole="header" style={[styles.titre, styles.titreSeul]}>
              Cette session n’est plus disponible
            </Text>
            <Text style={styles.aide}>Elle est terminée ou a été annulée.</Text>
            <Bouton titre="Voir les sessions" onPress={() => router.replace('/')} />
          </>
        ) : (
          <Chargement phrases={['On cherche la session…', 'On gonfle les ballons…']} />
        )}
      </View>
    );
  }

  const catchee = estCatchee(session.id);
  const organisee = session.organisateurId === compte?.id;
  const libres = placesLibres(session);
  const nombre = session.inscrits.length;

  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  // L'engrenage : modifier ou annuler, rangés à l'écart (on ne les touche pas par hasard)
  function ouvrirReglages() {
    if (!session) return;
    const s = session;
    choisir({
      titre: organisee ? 'Ta session' : s.titre,
      couleur: c.rouge,
      options: [
        ...(organisee
          ? [
              {
                texte: 'Modifier',
                onPress: () =>
                  router.push({
                    pathname: '/modifier/[id]',
                    params: { id: s.id },
                  }),
              },
            ]
          : []),
        {
          texte: organisee ? 'Annuler la session' : 'Annuler ma participation',
          destructif: true,
          // La session disparaît (organisateur, ou dernier inscrit) : on revient à l'écran précédent
          onPress: () => annuler(s, organisee || nombre <= 1 ? retour : undefined),
        },
      ],
    });
  }

  return (
    <View style={styles.ecran}>
      <Animated.ScrollView
        contentContainerStyle={styles.defilement}
        showsVerticalScrollIndicator={false}
        onScroll={surDefilement}
        scrollEventThrottle={16}>
        <View style={[styles.enteteSport, { height: top + HAUTEUR_ENTETE, paddingTop: top }]}>
          <TerrainSport sport={session.sport} couleur={c.surRouge} />
          {/* Page d'invitation (web) : le logo défile avec l'en-tête rouge */}
          {invitation && (
            <Text accessibilityLabel="Catch" style={[styles.logo, { top: top + 16 }]}>
              catch
            </Text>
          )}
          <View style={styles.rondPicto}>
            <PictoSport sport={session.sport} taille={56} />
          </View>
          <Text style={styles.rebours} maxFontSizeMultiplier={1.3}>
            {compteARebours(session)}
          </Text>
        </View>

        <View style={[styles.fiche, catchee && { paddingBottom: Math.max(bottom, 16) + 16 }]}>
          {/* Inscrit : son statut en haut, avec le groupe et l'engrenage (plus de barre collée en bas) */}
          {catchee && (
            <View style={styles.statut}>
              <Balle taille={20} />
              <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.statutTexte}>
                {organisee ? 'C’est ta session' : invitation ? 'Tu as rejoint la session' : 'Tu l’as catchée !'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Écrire au groupe"
                onPress={() =>
                  router.push({
                    pathname: '/messages/[id]',
                    params: { id: session.id },
                  })
                }
                style={({ pressed }) => [styles.rondAction, pressed && styles.presse]}>
                <IconeMessages couleur={c.encre} taille={20} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={organisee ? 'Modifier ou annuler la session' : 'Annuler ma participation'}
                onPress={ouvrirReglages}
                style={({ pressed }) => [styles.rondAction, pressed && styles.presse]}>
                <IconeReglages couleur={c.encre} taille={20} />
              </Pressable>
            </View>
          )}

          <BadgeSession session={session} />

          <Text accessibilityRole="header" style={styles.titre}>
            {session.titre}
          </Text>

          <View style={styles.ligneOrganisateur}>
            <Text style={styles.organisateur}>
              {invitation ? `${session.organisateur} t’invite à jouer` : `Organisée par ${session.organisateur}`}
            </Text>
            {/* Une question avant de catcher ? Un message privé, que le groupe ne voit pas */}
            {!invitation && !organisee && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Écrire à ${session.organisateur} en privé`}
                onPress={() =>
                  ecrireA({
                    autreId: session.organisateurId,
                    prenom: session.organisateur,
                    sessionId: session.id,
                    connecte: !!compte,
                  })
                }
                hitSlop={10}
                style={({ pressed }) => pressed && styles.estompe}>
                <Text style={styles.tuileActionTexte}>Lui écrire ›</Text>
              </Pressable>
            )}
          </View>

          {session.debutantsBienvenus && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>Débutants bienvenus</Text>
            </View>
          )}

          {/* Quand et où : deux tuiles côte à côte, l'essentiel en gros */}
          <View style={styles.tuiles}>
            <View style={styles.tuile}>
              <View style={styles.tuileHaut}>
                <IconeCalendrier couleur={c.rouge} taille={16} />
                <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.tuileEtiquette}>
                  {jourDetail(session)}
                </Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.tuileGrand}>
                {heure(session.debut)}
              </Text>
              <Text style={styles.aide}>
                Jusqu’à {heure(session.fin)} · {texteDuree(session).replace('Environ ', '')}
              </Text>
              {catchee && calendrierDisponible && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter la session à mon calendrier"
                  onPress={() => ajouterAuCalendrier(session)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.tuileAction, pressed && styles.estompe]}>
                  <Text style={styles.tuileActionTexte}>+ Calendrier</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${session.lieu}, ${session.commune}. Itinéraire`}
              onPress={() => ouvrirItineraire(session.position)}
              style={({ pressed }) => [styles.tuile, pressed && styles.presse]}>
              <View style={styles.tuileHaut}>
                <IconeLieu couleur={c.rouge} taille={16} />
                <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.tuileEtiquette}>
                  {/* Sur la page web, on ne connaît pas la position de la personne : pas de distance */}
                  {invitation ? session.commune : `À ${texteDistance(distance(origine, session.position))}`}
                </Text>
              </View>
              <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.tuileLieu}>
                {session.lieu}
              </Text>
              {!invitation && <Text style={styles.aide}>{session.commune}</Text>}
              <View style={styles.tuileAction}>
                <Text style={styles.tuileActionTexte}>Itinéraire ›</Text>
              </View>
            </Pressable>
          </View>

          {evenement && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pour ${evenement.nom}. S’inscrire sur le site officiel`}
              onPress={() => Linking.openURL(evenement.lien).catch(() => {})}
              style={({ pressed }) => [styles.evenement, pressed && styles.presse]}>
              <IconeDrapeau couleur={c.rouge} taille={20} />
              <View style={styles.evenementTextes}>
                <Text style={styles.evenementTitre}>Pour {evenement.nom}</Text>
                <Text style={styles.aide}>Chacun s’inscrit sur le site de l’événement</Text>
              </View>
              <Text style={styles.tuileActionTexte}>S’inscrire ›</Text>
            </Pressable>
          )}

          {/* « À savoir » : un petit mot de l'organisateur, comme un message */}
          {session.aSavoir && (
            <View style={styles.mot}>
              <View style={styles.motAvatar}>
                <Text maxFontSizeMultiplier={1.3} style={styles.motInitiale}>
                  {session.organisateur.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.motBulle}>
                <Text style={styles.motAuteur}>Le mot de {session.organisateur}</Text>
                <Text style={styles.motTitre}>{session.aSavoir.titre}</Text>
                {!!session.aSavoir.detail && <Text style={styles.motDetail}>{session.aSavoir.detail}</Text>}
              </View>
            </View>
          )}

          <EquipeSession
            session={session}
            onInviter={invitation ? undefined : () => inviter(session)}
            // Inscrit : toucher un joueur lui écrit en privé
            onEcrire={
              catchee && compte && !invitation
                ? (autreId, prenom) => ecrireA({ autreId, prenom, sessionId: session.id, connecte: true })
                : undefined
            }
          />

          {/* On ne se signale pas soi-même */}
          {session.organisateurId !== compte?.id && (
            <Bouton
              titre="Signaler cette session"
              variante="lien"
              onPress={() =>
                router.push({
                  pathname: '/signaler',
                  params: {
                    cible: 'session',
                    id: session.id,
                    nom: session.titre,
                    auteur: session.organisateurId,
                    prenom: session.organisateur,
                  },
                })
              }
            />
          )}
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.barreDefilee, { height: top + 8 + Espaces.cibleTactile + 8, paddingTop: top + 8 }, styleBarre]}>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.barreTitre}>
          {session.titre}
        </Text>
      </Animated.View>

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

      {!invitation && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Inviter"
          onPress={() => inviter(session)}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, styles.inviter, { top: top + 8 }, pressed && styles.presse]}>
          <IconeInviter couleur={c.encre} taille={20} />
        </Pressable>
      )}

      {!catchee && (
        <View style={[styles.bas, { paddingBottom: Math.max(bottom, 16) }]}>
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
        </View>
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    defilement: { flexGrow: 1 },
    enteteSport: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      overflow: 'hidden',
      backgroundColor: c.rouge,
    },
    rondPicto: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
      boxShadow: c.ombre,
    },
    rebours: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.surRouge, marginBottom: 12 },
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
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreDetail, lineHeight: 38, color: c.encre },
    ligneOrganisateur: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 4 },
    organisateur: { fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire },
    pastille: {
      alignSelf: 'flex-start',
      height: 26,
      paddingHorizontal: 10,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
    },
    pastilleTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
    tuiles: { flexDirection: 'row', gap: 10, paddingTop: 4 },
    tuile: {
      flex: 1,
      gap: 4,
      padding: 14,
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    tuileHaut: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tuileEtiquette: { flexShrink: 1, fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    tuileGrand: { fontFamily: Polices.titre, fontSize: Tailles.grandNombre, color: c.encre },
    tuileLieu: { fontFamily: Polices.titre, fontSize: Tailles.titreCarte, lineHeight: 24, color: c.encre },
    // Poussée en bas de la tuile : les deux tuiles alignent leurs actions
    tuileAction: { marginTop: 'auto', paddingTop: 8, alignSelf: 'flex-start' },
    tuileActionTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    estompe: { opacity: 0.6 },
    evenement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    evenementTextes: { flex: 1, gap: 2 },
    evenementTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    mot: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    motAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.avatar1,
    },
    motInitiale: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.surAvatar },
    motBulle: {
      flex: 1,
      gap: 2,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      backgroundColor: c.beige,
    },
    motAuteur: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
    motTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    motDetail: { fontFamily: Polices.texte, fontSize: Tailles.courant, lineHeight: 21, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    presse: { backgroundColor: c.beige },
    barreDefilee: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      paddingHorizontal: 16 + Espaces.cibleTactile + 12,
      justifyContent: 'center',
      backgroundColor: c.fond,
      borderBottomWidth: 1,
      borderBottomColor: c.trait,
    },
    barreTitre: { textAlign: 'center', fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.encre },
    attente: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: Espaces.marge },
    inviter: { left: undefined, right: 16 },
    titreSeul: { flex: 0, fontSize: Tailles.titreSession, lineHeight: 30, textAlign: 'center' },
    logo: {
      position: 'absolute',
      right: Espaces.marge,
      fontFamily: Polices.titre,
      fontSize: Tailles.titreMoyen,
      // Posé sur l'en-tête rouge
      color: c.surRouge,
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
      boxShadow: c.ombre,
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
    statut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingLeft: 14,
      paddingRight: 8,
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    statutTexte: {
      flex: 1,
      fontFamily: Polices.titre,
      fontSize: Tailles.titreCarte,
      color: c.encre,
    },
    rondAction: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
  });

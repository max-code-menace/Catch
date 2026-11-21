import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { BadgeSession } from '@/components/badge-session';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import { EquipeSession } from '@/components/equipe-session';
import {
  IconeCalendrier,
  IconeDrapeau,
  IconeInfo,
  IconeInviter,
  IconeLieu,
  IconeMessages,
  IconeRetour,
} from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { TerrainSport } from '@/components/terrain-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import {
  annulationLibre,
  compteARebours,
  distance,
  placesLibres,
  quandDetail,
  texteDistance,
  texteDuree,
} from '@/lib/formats';
import { useCatch } from '@/lib/catch';
import { useCompte } from '@/lib/compte';
import { useEvenements } from '@/lib/evenements';
import { inviter } from '@/lib/invitation';
import { ajouterAuCalendrier, calendrierDisponible } from '@/lib/calendrier';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Hauteur de l'en-tête rouge, sous la barre d'état */
const HAUTEUR_ENTETE = 230;
const HAUTEUR_CARTE = 130;

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
  const { compte } = useCompte();
  const session = sessions.find((s) => s.id === id);
  const evenements = useEvenements();
  const evenement = session?.evenementId ? evenements.find((e) => e.id === session.evenementId) : undefined;
  // Sur le web, cette page est celle d'un lien d'invitation : on parle à quelqu'un qui ne connaît pas l'app
  const invitation = Platform.OS === 'web';

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
          <Text style={styles.aide}>Recherche de la session…</Text>
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

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.defilement} showsVerticalScrollIndicator={false}>
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

        <View style={styles.fiche}>
          <BadgeSession session={session} />

          <Text accessibilityRole="header" style={styles.titre}>
            {session.titre}
          </Text>

          <Text style={styles.organisateur}>
            {invitation ? `${session.organisateur} t’invite à jouer` : `Organisée par ${session.organisateur}`}
          </Text>

          {session.debutantsBienvenus && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>Débutants bienvenus</Text>
            </View>
          )}

          <View style={styles.lignes}>
            <Ligne Icone={IconeCalendrier} titre={quandDetail(session)} detail={texteDuree(session)}>
              {catchee && calendrierDisponible && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter la session à mon calendrier"
                  onPress={() => ajouterAuCalendrier(session)}
                  hitSlop={4}
                  style={({ pressed }) => [styles.itineraire, pressed && styles.presse]}>
                  <Text style={styles.itineraireTexte}>Ajouter</Text>
                </Pressable>
              )}
            </Ligne>
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
            {evenement && (
              <Ligne
                Icone={IconeDrapeau}
                titre={`Pour ${evenement.nom}`}
                detail="Chacun s’inscrit sur le site de l’événement">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`S’inscrire à ${evenement.nom} sur le site officiel`}
                  onPress={() => Linking.openURL(evenement.lien).catch(() => {})}
                  hitSlop={4}
                  style={({ pressed }) => [styles.itineraire, pressed && styles.presse]}>
                  <Text style={styles.itineraireTexte}>S’inscrire</Text>
                </Pressable>
              </Ligne>
            )}
            {session.aSavoir && (
              <Ligne Icone={IconeInfo} titre={session.aSavoir.titre} detail={session.aSavoir.detail} />
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Itinéraire vers ${session.lieu}`}
            onPress={() => ouvrirItineraire(session.position)}
            style={({ pressed }) => [styles.carte, pressed && styles.cartePressee]}>
            <ApercuCarte position={session.position} />
          </Pressable>

          <EquipeSession session={session} onInviter={invitation ? undefined : () => inviter(session)} />

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

      <View style={[styles.bas, { paddingBottom: Math.max(bottom, 16) }]}>
        {catchee ? (
          <>
            <View style={styles.catchee}>
              <Balle taille={20} />
              <Text style={styles.catcheeTexte}>
                {organisee ? 'C’est ta session' : invitation ? 'Tu as rejoint la session' : 'Tu l’as catchée !'}
              </Text>
            </View>
            <View style={styles.duo}>
              <Bouton
                titre="Écrire au groupe"
                variante="secondaire"
                Icone={IconeMessages}
                style={styles.demi}
                onPress={() => router.push({ pathname: '/messages/[id]', params: { id: session.id } })}
              />
              {organisee && (
                <Bouton
                  titre="Modifier"
                  variante="secondaire"
                  style={styles.demi}
                  onPress={() => router.push({ pathname: '/modifier/[id]', params: { id: session.id } })}
                />
              )}
            </View>
            <Bouton
              titre={organisee ? 'Annuler la session' : 'Annuler ma participation'}
              variante="lien"
              // La session disparaît (organisateur, ou dernier inscrit) : on revient à l'écran précédent
              onPress={() => annuler(session, organisee || nombre <= 1 ? retour : undefined)}
            />
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
    carte: {
      height: HAUTEUR_CARTE,
      overflow: 'hidden',
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.fondCarte,
    },
    cartePressee: { opacity: 0.8 },
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
    itineraireTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    presse: { backgroundColor: c.beige },
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
    catchee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 },
    duo: { flexDirection: 'row', gap: 8 },
    demi: { flex: 1 },
    catcheeTexte: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
  });

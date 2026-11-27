import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { FilConversation } from '@/components/fil-conversation';
import { IconeRetour } from '@/components/icones';
import { BarrePlaces } from '@/components/barre-places';
import { PointEnDirect } from '@/components/pastille-session';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { ImagesSports } from '@/donnees/images-sports';
import { distance, heure, tempsConversation, texteDistance } from '@/lib/formats';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useMessages } from '@/lib/messages';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** La conversation d'une session. */
export default function ConversationSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const { compte, pret } = useCompte();
  const { conversations, recharger, marquerLue } = useMessages();
  const conversation = conversations.find((x) => x.id === id);
  // La session elle-même (places, organisateur), si elle est chargée ; sinon on va la chercher une fois
  const { sessions, chercher, position } = useSessions();
  const session = sessions.find((s) => s.id === id);
  const aSession = !!session;
  useEffect(() => {
    if (!aSession && id) chercher(id);
  }, [aSession, id, chercher]);

  // Ouverte par une notification, ou après avoir quitté la session : la liste gardée en mémoire n'est
  // peut-être plus à jour. On la relit à chaque ouverture avant de dire quoi que ce soit.
  const [verifiee, setVerifiee] = useState(false);
  const [sansReseau, setSansReseau] = useState(false);
  const verifier = useCallback(async () => {
    const reussi = await recharger();
    setSansReseau(!reussi);
    setVerifiee(true);
  }, [recharger]);
  const moi = compte?.id;
  useEffect(() => {
    // Sans compte (ou tant que la connexion gardée sur le téléphone n'est pas relue), rien à vérifier
    if (!moi) return;
    let actif = true;
    recharger().then((reussi) => {
      if (!actif) return;
      setSansReseau(!reussi);
      setVerifiee(true);
    });
    return () => {
      actif = false;
    };
  }, [id, moi, recharger]);
  // Relue sur le serveur et absente : on n'est plus inscrit (ou la session n'existe plus)
  const plusInscrit = verifiee && !conversation;

  const retour = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  if (!compte && pret) {
    return (
      <View style={[styles.ecran, styles.seul]}>
        <Text accessibilityRole="header" style={styles.titreSeul}>
          Connecte-toi pour lire les messages
        </Text>
        <Text style={styles.aide}>La conversation est réservée aux inscrits de la session.</Text>
        <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        <Bouton variante="lien" titre="Retour" onPress={retour} />
      </View>
    );
  }

  if (!conversation || plusInscrit) {
    if (!verifiee || !compte) {
      return (
        <View style={[styles.ecran, styles.seul]}>
          <Text style={styles.aide}>Ouverture de la conversation…</Text>
        </View>
      );
    }
    if (sansReseau) {
      return (
        <View style={[styles.ecran, styles.seul]}>
          <Text accessibilityRole="header" style={styles.titreSeul}>
            Pas de réseau
          </Text>
          <Bouton
            titre="Réessayer"
            onPress={() => {
              setVerifiee(false);
              verifier();
            }}
          />
          <Bouton variante="lien" titre="Retour" onPress={retour} />
        </View>
      );
    }
    return (
      <View style={[styles.ecran, styles.seul]}>
        <Text accessibilityRole="header" style={styles.titreSeul}>
          Tu n’es plus dans cette session
        </Text>
        <Text style={styles.aideCentree}>
          Tu l’as quittée, ou elle a été annulée. Les messages sont réservés aux inscrits.
        </Text>
        <Bouton
          titre="Voir la session"
          onPress={() => router.replace({ pathname: '/session/[id]', params: { id } })}
        />
        <Bouton variante="lien" titre="Retour" onPress={retour} />
      </View>
    );
  }

  const temps = tempsConversation(conversation.debut, conversation.fin);
  const ouvrirSession = () => router.push({ pathname: '/session/[id]', params: { id } });
  const loin = position ? texteDistance(distance(position, conversation.position)) : null;
  const detailLieu = [loin, `jusqu’à ${heure(conversation.fin)}`].filter(Boolean).join(' · ');
  const lieu = conversation.commune ? `${conversation.lieu} · ${conversation.commune}` : conversation.lieu;

  return (
    <KeyboardAvoidingView
      style={styles.ecran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* En-tête court : la session, et dans une pastille le temps qui reste (finition 1 de Maxime, 26 novembre) */}
      <View style={[styles.entete, { paddingTop: top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={retour}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, pressed && styles.presse]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${conversation.titre}, ${temps.long}. Voir la session`}
          onPress={ouvrirSession}
          style={({ pressed }) => [styles.enteteTextes, pressed && { opacity: 0.6 }]}>
          <Image source={ImagesSports[conversation.sport]} style={styles.rondEntete} resizeMode="cover" />
          <View style={styles.enteteColonne}>
            <Text accessibilityRole="header" style={styles.titre} numberOfLines={1}>
              {conversation.titre}
            </Text>
            <Text style={styles.lien} numberOfLines={1}>
              Voir la session
            </Text>
          </View>
        </Pressable>
        {temps.ton !== 'fini' ? (
          <View style={[styles.pastille, temps.ton === 'direct' ? styles.pastilleDirect : temps.ton === 'bientot' ? styles.pastilleBientot : styles.pastilleNeutre]}>
            {temps.ton === 'direct' && <PointEnDirect couleur={c.surRouge} />}
            <Text
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={[styles.pastilleTexte, temps.ton === 'direct' ? styles.surRouge : temps.ton === 'bientot' ? styles.rougeTexte : styles.secondaire]}>
              {temps.long}
            </Text>
          </View>
        ) : (
          <Text style={styles.aide}>Terminée</Text>
        )}
      </View>

      {/* Épinglée : où, jusqu'à quand, Itinéraire, et les places. Reste visible pendant qu'on lit le fil. */}
      <View style={styles.epingle}>
        <View style={styles.epingleLigne}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${lieu}, ${detailLieu}. Voir la session`}
            onPress={ouvrirSession}
            style={({ pressed }) => [styles.epingleLieu, pressed && { opacity: 0.6 }]}>
            <Image source={ImagesSports[conversation.sport]} style={styles.vignette} resizeMode="cover" />
            <View style={styles.enteteColonne}>
              <Text style={styles.epingleTitre} numberOfLines={1}>
                {lieu}
              </Text>
              <Text style={styles.aide} numberOfLines={1}>
                {detailLieu}
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Itinéraire vers ${conversation.lieu}`}
            onPress={() => ouvrirItineraire(conversation.position)}
            style={({ pressed }) => [styles.itineraire, pressed && styles.presse]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.itineraireTexte}>
              Itinéraire
            </Text>
          </Pressable>
        </View>
        {session && <BarrePlaces session={session} />}
      </View>

      <FilConversation
        fil={{ type: 'session', id }}
        vide="Personne n’a encore écrit. Dis bonjour au groupe."
        onLu={() => marquerLue(id)}
        relireConversations={recharger}
        groupe={session ? { organisateurId: session.organisateurId, joueurs: session.joueurs, debut: session.debut } : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    seul: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: Espaces.marge },
    titreSeul: { fontFamily: Polices.titre, fontSize: Tailles.titreSession, lineHeight: 30, textAlign: 'center', color: c.encre },
    entete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.trait,
    },
    retour: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presse: { backgroundColor: c.beige },
    enteteTextes: {
      flex: 1,
      minHeight: Espaces.cibleTactile,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rondEntete: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.fondPhoto },
    enteteColonne: { flex: 1 },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    lien: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.rougeTexte },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    aideCentree: { fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, textAlign: 'center' },
    pastille: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: Rayons.pilule,
    },
    pastilleDirect: { backgroundColor: c.rouge },
    pastilleBientot: { backgroundColor: c.rougeDoux },
    pastilleNeutre: { backgroundColor: c.beige },
    pastilleTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille },
    surRouge: { color: c.surRouge },
    rougeTexte: { color: c.rougeTexte },
    secondaire: { color: c.texteSecondaire },
    epingle: {
      marginHorizontal: 12,
      marginTop: 8,
      padding: 10,
      gap: 8,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.carte,
      boxShadow: c.ombrePetite,
    },
    epingleLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    epingleLieu: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: Espaces.cibleTactile },
    vignette: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.fondPhoto },
    epingleTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    itineraire: {
      minHeight: Espaces.cibleTactile - 8,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.fond,
    },
    itineraireTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
  });

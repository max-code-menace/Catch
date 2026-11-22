import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { FilConversation } from '@/components/fil-conversation';
import { IconeRetour } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { heure, quand } from '@/lib/formats';
import { useMessages } from '@/lib/messages';
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
          <Text style={styles.aide}>Impossible d’ouvrir la conversation. Vérifie ta connexion.</Text>
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

  const enDirect = conversation.debut <= new Date() && new Date() < conversation.fin;
  const titre = conversation.commune ? `${conversation.titre} · ${conversation.commune}` : conversation.titre;
  const inscrits = `${conversation.inscrits} ${conversation.inscrits > 1 ? 'inscrits' : 'inscrit'}`;

  return (
    <KeyboardAvoidingView
      style={styles.ecran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          accessibilityLabel={`${titre}, voir la session`}
          onPress={() => router.push({ pathname: '/session/[id]', params: { id } })}
          style={({ pressed }) => [styles.enteteTextes, pressed && { opacity: 0.6 }]}>
          <View style={styles.rondEntete}>
            <PictoSport sport={conversation.sport} taille={24} />
          </View>
          <View style={styles.enteteColonne}>
            <Text accessibilityRole="header" style={styles.titre} numberOfLines={1}>
              {conversation.titre}
            </Text>
            <Text style={[styles.aide, enDirect && styles.enDirect]} numberOfLines={1}>
              {enDirect ? `En direct · jusqu’à ${heure(conversation.fin)}` : quand(conversation.debut)}
            </Text>
          </View>
        </Pressable>
      </View>

      <FilConversation
        fil={{ type: 'session', id }}
        vide="Personne n’a encore écrit. Dis bonjour au groupe."
        onLu={() => marquerLue(id)}
        relireConversations={recharger}
        // En haut du fil, comme au début d'une conversation Messenger : de quoi il s'agit, une seule fois
        intro={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${titre}, ${conversation.lieu}, ${inscrits}. Voir la session`}
            onPress={() => router.push({ pathname: '/session/[id]', params: { id } })}
            style={styles.intro}>
            <View style={styles.rondIntro}>
              <PictoSport sport={conversation.sport} taille={44} />
            </View>
            <Text style={styles.introTitre}>{titre}</Text>
            <Text style={styles.aideCentree} numberOfLines={2}>
              {conversation.lieu} · {inscrits}
            </Text>
            <Text style={styles.introLien}>Voir la session</Text>
          </Pressable>
        }
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
      gap: 4,
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
    rondEntete: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    enteteColonne: { flex: 1 },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    enDirect: { color: c.rougeTexte },
    aideCentree: { fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, textAlign: 'center' },
    intro: { alignItems: 'center', gap: 4, paddingTop: 28, paddingBottom: 20, paddingHorizontal: Espaces.marge },
    rondIntro: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
      marginBottom: 6,
    },
    introTitre: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre, textAlign: 'center' },
    introLien: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.rougeTexte, paddingTop: 6 },
  });

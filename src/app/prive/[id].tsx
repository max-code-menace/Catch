import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { FilConversation } from '@/components/fil-conversation';
import { IconeRetour } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { initiale, teinte } from '@/lib/fil-messages';
import { useMessages } from '@/lib/messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Une conversation privée, à deux. */
export default function ConversationPrivee() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const { compte, pret } = useCompte();
  const { prives, recharger, marquerPriveLue } = useMessages();
  const conversation = prives.find((x) => x.id === id);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];

  // Ouverte par une notification, ou juste créée depuis une session : la liste gardée en mémoire
  // ne la contient peut-être pas encore. On relit avant de conclure.
  const [verifiee, setVerifiee] = useState(false);
  const [sansReseau, setSansReseau] = useState(false);
  const [essai, setEssai] = useState(0);
  const moi = compte?.id;
  useEffect(() => {
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
  }, [id, moi, recharger, essai]);

  const retour = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  if (!compte && pret) {
    return (
      <View style={[styles.ecran, styles.seul]}>
        <Text accessibilityRole="header" style={styles.titreSeul}>
          Connecte-toi pour lire tes messages
        </Text>
        <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        <Bouton variante="lien" titre="Retour" onPress={retour} />
      </View>
    );
  }

  if (!conversation) {
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
          <Text style={styles.aideCentree}>Impossible d’ouvrir la conversation. Vérifie ta connexion.</Text>
          <Bouton
            titre="Réessayer"
            onPress={() => {
              setVerifiee(false);
              setEssai((n) => n + 1);
            }}
          />
          <Bouton variante="lien" titre="Retour" onPress={retour} />
        </View>
      );
    }
    return (
      <View style={[styles.ecran, styles.seul]}>
        <Text accessibilityRole="header" style={styles.titreSeul}>
          Conversation indisponible
        </Text>
        <Text style={styles.aideCentree}>Elle n’existe plus, ou l’un de vous a bloqué l’autre.</Text>
        <Bouton variante="lien" titre="Retour" onPress={retour} />
      </View>
    );
  }

  const prenom = conversation.prenom || 'Quelqu’un';
  const couleur = teintes[teinte(conversation.autreId)];
  const sessionId = conversation.sessionId;
  const voirSession = sessionId
    ? () => router.push({ pathname: '/session/[id]', params: { id: sessionId } })
    : undefined;

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.entete, { paddingTop: top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={retour}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, pressed && styles.presse]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
        <View style={styles.enteteTextes}>
          <View importantForAccessibility="no" style={[styles.rondEntete, { backgroundColor: couleur }]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.initialeEntete}>
              {initiale(conversation.prenom)}
            </Text>
          </View>
          <View style={styles.enteteColonne}>
            <Text accessibilityRole="header" style={styles.titre} numberOfLines={1}>
              {prenom}
            </Text>
            {!!conversation.sujet && (
              <Text style={styles.aide} numberOfLines={1}>
                Message privé · {conversation.sujet}
              </Text>
            )}
          </View>
        </View>
      </View>

      <FilConversation
        fil={{ type: 'prive', id }}
        vide="Écris-lui ton premier message."
        avecPrenoms={false}
        onLu={() => marquerPriveLue(id)}
        relireConversations={recharger}
        intro={
          <View style={styles.intro}>
            <View importantForAccessibility="no" style={[styles.rondIntro, { backgroundColor: couleur }]}>
              <Text maxFontSizeMultiplier={1.3} style={styles.initialeIntro}>
                {initiale(conversation.prenom)}
              </Text>
            </View>
            <Text style={styles.introTitre}>{prenom}</Text>
            <Text style={styles.aideCentree}>Rien que vous deux. Le groupe de la session ne voit pas ces messages.</Text>
            {voirSession && conversation.sujet && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir la session ${conversation.sujet}`}
                onPress={voirSession}
                hitSlop={8}>
                <Text style={styles.introLien}>Voir la session · {conversation.sujet}</Text>
              </Pressable>
            )}
          </View>
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
    enteteTextes: { flex: 1, minHeight: Espaces.cibleTactile, flexDirection: 'row', alignItems: 'center', gap: 10 },
    rondEntete: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    initialeEntete: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.surAvatar },
    enteteColonne: { flex: 1 },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    aideCentree: { fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, textAlign: 'center' },
    intro: { alignItems: 'center', gap: 4, paddingTop: 28, paddingBottom: 20, paddingHorizontal: Espaces.marge },
    rondIntro: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    initialeIntro: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.surAvatar },
    introTitre: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre, textAlign: 'center' },
    introLien: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.rougeTexte, paddingTop: 6 },
  });

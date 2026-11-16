import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { PictoSport } from '@/components/picto-sport';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { quandMessage, useMessages, type Conversation } from '@/lib/messages';
import { useStyles, type Palette } from '@/lib/theme';

/** « Lucas : on est devant la buvette », « Toi : j'arrive », ou une invitation à écrire le premier. */
function apercu(conversation: Conversation) {
  const { dernier } = conversation;
  if (!dernier) return 'Aucun message pour l’instant';
  return `${dernier.deMoi ? 'Toi' : dernier.prenom || 'Quelqu’un'} : ${dernier.texte}`;
}

function LigneConversation({ conversation }: { conversation: Conversation }) {
  const styles = useStyles(creerStyles);
  const nonLue = conversation.nonLus > 0;
  const titre = conversation.commune ? `${conversation.titre} · ${conversation.commune}` : conversation.titre;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${nonLue ? `${conversation.nonLus} non lus, ` : ''}${apercu(conversation)}`}
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}>
      <View style={styles.picto}>
        <PictoSport sport={conversation.sport} taille={36} />
      </View>
      <View style={styles.textes}>
        <Text style={styles.titre} numberOfLines={1}>
          {titre}
        </Text>
        <Text style={[styles.apercu, nonLue && styles.apercuNonLu]} numberOfLines={1}>
          {apercu(conversation)}
        </Text>
      </View>
      <View style={styles.droite}>
        <Text style={styles.quand}>{quandMessage(conversation.dernier?.date ?? conversation.inscritLe)}</Text>
        {nonLue && (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{conversation.nonLus > 9 ? '9+' : conversation.nonLus}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function Messages() {
  const styles = useStyles(creerStyles);
  const { compte } = useCompte();
  const { conversations, etat, recharger } = useMessages();

  // Relu à chaque retour sur l'onglet
  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  if (!compte) {
    return (
      <Ecran titre="Messages">
        <Aide>Connecte-toi pour discuter avec les joueurs de tes sessions.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
      </Ecran>
    );
  }

  if (etat === 'erreur') {
    return (
      <Ecran titre="Messages">
        <Aide>Impossible de charger tes conversations. Vérifie ta connexion.</Aide>
        <View>
          <Bouton titre="Réessayer" onPress={recharger} />
        </View>
      </Ecran>
    );
  }

  // Première lecture en cours : pas de liste vide trompeuse
  if (etat === 'chargement' && conversations.length === 0) {
    return (
      <Ecran titre="Messages">
        <Aide>Chargement de tes conversations…</Aide>
      </Ecran>
    );
  }

  if (etat === 'pretes' && conversations.length === 0) {
    return (
      <Ecran titre="Messages">
        <Aide>Pas encore de conversation. Catche une session : tu pourras écrire au groupe.</Aide>
        <View>
          <Bouton titre="Voir les sessions" onPress={() => router.navigate('/')} />
        </View>
      </Ecran>
    );
  }

  return (
    <Ecran titre="Messages">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.liste}>
        <Text style={styles.section}>Tes sessions</Text>
        {conversations.map((conversation) => (
          <LigneConversation key={conversation.id} conversation={conversation} />
        ))}
      </ScrollView>
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    liste: { paddingBottom: 24 },
    section: {
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
      paddingBottom: 4,
    },
    ligne: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.trait,
    },
    presse: { opacity: 0.6 },
    picto: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    textes: { flex: 1, gap: 2 },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    apercu: { fontFamily: Polices.texte, fontSize: 14, color: c.texteSecondaire },
    apercuNonLu: { fontFamily: Polices.texteMoyen, color: c.encre },
    droite: { alignItems: 'flex-end', gap: 6 },
    quand: { fontFamily: Polices.texte, fontSize: Tailles.pastille, color: c.texteSecondaire },
    pastille: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
    },
    pastilleTexte: { fontFamily: Polices.texteDemi, fontSize: 11, color: c.surRouge },
  });

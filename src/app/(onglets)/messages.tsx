import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { PictoSport } from '@/components/picto-sport';
import { CartesFantomes } from '@/components/chargement';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { quandMessage, useMessages, type Conversation } from '@/lib/messages';
import { useStyles, type Palette } from '@/lib/theme';

/** « Lucas : on est devant la buvette », « Toi : j'arrive », ou une invitation à écrire le premier. */
function apercu(conversation: Conversation) {
  const { dernier } = conversation;
  if (!dernier) return 'Dis bonjour au groupe';
  return `${dernier.deMoi ? 'Toi' : dernier.prenom || 'Quelqu’un'} : ${dernier.texte}`;
}

/**
 * Une ligne comme dans Messenger : un rond, le nom, l'aperçu suivi de l'heure sur la même ligne.
 * Non lu = texte en gras et un point rouge à droite, rien de plus.
 */
function LigneConversation({ conversation }: { conversation: Conversation }) {
  const styles = useStyles(creerStyles);
  const nonLue = conversation.nonLus > 0;
  const quandTexte = quandMessage(conversation.dernier?.date ?? conversation.inscritLe);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${conversation.titre}, ${nonLue ? 'non lu, ' : ''}${apercu(conversation)}, ${quandTexte}`}
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}>
      <View style={styles.rond}>
        <PictoSport sport={conversation.sport} taille={34} />
      </View>
      <View style={styles.textes}>
        <Text style={[styles.titre, nonLue && styles.gras]} numberOfLines={1}>
          {conversation.titre}
        </Text>
        <View style={styles.ligneApercu}>
          <Text style={[styles.apercu, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {apercu(conversation)}
          </Text>
          <Text style={[styles.quand, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {` · ${quandTexte}`}
          </Text>
        </View>
      </View>
      {nonLue && <View style={styles.point} />}
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
        <CartesFantomes accessibilityLabel="Chargement de tes conversations" />
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
    // Tout l'écran défile (comme Mes sessions) : la liste passe sous la barre et « + Créer »,
    // au lieu de s'arrêter au-dessus en laissant une bande vide.
    <Ecran titre="Messages" defile>
      <View style={styles.liste}>
        {conversations.map((conversation) => (
          <LigneConversation key={conversation.id} conversation={conversation} />
        ))}
      </View>
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    // Le fond pressé déborde un peu des marges, comme dans Messenger
    liste: { marginHorizontal: -10 },
    ligne: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: Rayons.bouton,
    },
    presse: { backgroundColor: c.beige },
    rond: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    textes: { flex: 1, gap: 2 },
    titre: { fontFamily: Polices.texteMoyen, fontSize: Tailles.texte, color: c.encre },
    gras: { fontFamily: Polices.texteDemi },
    ligneApercu: { flexDirection: 'row' },
    apercu: { flexShrink: 1, fontFamily: Polices.texte, fontSize: Tailles.petit, color: c.texteSecondaire },
    // L'heure ne se coupe jamais : c'est l'aperçu qui raccourcit
    quand: { flexShrink: 0, fontFamily: Polices.texte, fontSize: Tailles.petit, color: c.texteSecondaire },
    apercuNonLu: { fontFamily: Polices.texteDemi, color: c.encre },
    point: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.rouge },
  });

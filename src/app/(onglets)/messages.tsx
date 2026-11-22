import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { initiale, teinte } from '@/lib/fil-messages';
import { quandMessage, useMessages, type Conversation, type ConversationPrivee } from '@/lib/messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

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

/** Une conversation privée : le rond à l'initiale de la personne, son prénom, l'aperçu. */
function LignePrivee({ conversation }: { conversation: ConversationPrivee }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  const nonLue = conversation.nonLus > 0;
  const { dernier } = conversation;
  const prenom = conversation.prenom || 'Quelqu’un';
  const texte = dernier ? `${dernier.deMoi ? 'Toi : ' : ''}${dernier.texte}` : '';
  const quandTexte = dernier ? quandMessage(dernier.date) : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${prenom}, ${nonLue ? 'non lu, ' : ''}${texte}, ${quandTexte}`}
      onPress={() => router.push({ pathname: '/prive/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.ligne, pressed && styles.presse]}>
      <View style={[styles.rond, { backgroundColor: teintes[teinte(conversation.autreId)] }]}>
        <Text maxFontSizeMultiplier={1.3} style={styles.initiale}>
          {initiale(conversation.prenom)}
        </Text>
      </View>
      <View style={styles.textes}>
        <Text style={[styles.titre, nonLue && styles.gras]} numberOfLines={1}>
          {prenom}
          {!!conversation.sujet && <Text style={styles.sujet}>{` · ${conversation.sujet}`}</Text>}
        </Text>
        <View style={styles.ligneApercu}>
          <Text style={[styles.apercu, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {texte}
          </Text>
          <Text style={[styles.quand, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {` · ${quandTexte}`}
          </Text>
        </View>
      </View>
      {nonLue && <View style={styles.point} />}
    </Pressable>
  );
}

type Espace = 'groupes' | 'prives';

/** « Groupes » et « Privés » : deux pilules, avec un point rouge là où ça bouge. */
function ChoixEspace({
  espace,
  onChoix,
  pointGroupes,
  pointPrives,
}: {
  espace: Espace;
  onChoix: (espace: Espace) => void;
  pointGroupes: boolean;
  pointPrives: boolean;
}) {
  const styles = useStyles(creerStyles);
  const pilule = (valeur: Espace, titre: string, point: boolean) => {
    const actif = espace === valeur;
    return (
      <Pressable
        key={valeur}
        accessibilityRole="tab"
        accessibilityState={{ selected: actif }}
        accessibilityLabel={point ? `${titre}, non lu` : titre}
        onPress={() => onChoix(valeur)}
        style={({ pressed }) => [styles.pilule, actif && styles.piluleActive, pressed && !actif && styles.presse]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.piluleTexte, actif && styles.piluleTexteActif]}>
          {titre}
        </Text>
        {point && <View style={[styles.pointPetit, actif && styles.pointSurActif]} />}
      </Pressable>
    );
  };
  return (
    <View accessibilityRole="tablist" style={styles.espaces}>
      {pilule('groupes', 'Groupes', pointGroupes)}
      {pilule('prives', 'Privés', pointPrives)}
    </View>
  );
}

export default function Messages() {
  const styles = useStyles(creerStyles);
  const { compte } = useCompte();
  const { conversations, prives, etat, recharger, nonLusGroupes, nonLusPrives } = useMessages();
  const [espace, setEspace] = useState<Espace>('groupes');
  // Une conversation privée ouverte sans rien écrire n'encombre pas la liste
  const privesAffichees = prives.filter((p) => p.dernier);

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

  return (
    // Tout l'écran défile (comme Mes sessions) : la liste passe sous la barre et « + Créer »,
    // au lieu de s'arrêter au-dessus en laissant une bande vide.
    <Ecran titre="Messages" defile>
      <ChoixEspace
        espace={espace}
        onChoix={setEspace}
        pointGroupes={nonLusGroupes > 0}
        pointPrives={nonLusPrives > 0}
      />
      {espace === 'groupes' ? (
        conversations.length === 0 ? (
          <>
            <Aide>Pas encore de groupe. Catche une session : tu pourras écrire à tous ses joueurs.</Aide>
            <View>
              <Bouton titre="Voir les sessions" onPress={() => router.navigate('/')} />
            </View>
          </>
        ) : (
          <View style={styles.liste}>
            {conversations.map((conversation) => (
              <LigneConversation key={conversation.id} conversation={conversation} />
            ))}
          </View>
        )
      ) : privesAffichees.length === 0 ? (
        <Aide>
          Pas encore de message privé. Pour écrire à une seule personne, ouvre une session : « Écrire à
          l’organisateur », ou touche un joueur dans « L’équipe ».
        </Aide>
      ) : (
        <View style={styles.liste}>
          {privesAffichees.map((conversation) => (
            <LignePrivee key={conversation.id} conversation={conversation} />
          ))}
        </View>
      )}
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
    initiale: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.surAvatar },
    sujet: { fontFamily: Polices.texte, color: c.texteSecondaire },
    espaces: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    pilule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: Espaces.cibleTactile - 6,
      paddingHorizontal: 16,
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
    },
    piluleActive: { backgroundColor: c.encre },
    piluleTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    piluleTexteActif: { color: c.surEncre },
    pointPetit: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.rouge },
    pointSurActif: { backgroundColor: c.rouge },
  });

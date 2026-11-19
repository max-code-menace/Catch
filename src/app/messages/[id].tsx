import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { IconeEnvoyer, IconeLieu, IconeRetour } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { heure, quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { ouvrirItineraire } from '@/lib/itineraire';
import { bloquer, demander } from '@/lib/moderation';
import {
  ecouterMessages,
  envoyerMessage,
  lireMessages,
  quandMessage,
  useMessages,
  type Message,
} from '@/lib/messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Une bulle : à droite en rouge pour moi, à gauche avec le prénom pour les autres. */
function Bulle({
  message,
  deMoi,
  avecPrenom,
  onOptions,
}: {
  message: Message;
  deMoi: boolean;
  avecPrenom: boolean;
  /** Appui long sur le message d'un autre : signaler ou bloquer */
  onOptions: (message: Message) => void;
}) {
  const styles = useStyles(creerStyles);
  return (
    <View style={[styles.rangee, deMoi && styles.rangeeMoi]}>
      {avecPrenom && <Text style={styles.prenom}>{message.prenom || 'Quelqu’un'}</Text>}
      <Pressable
        accessibilityHint={deMoi ? undefined : 'Appui long pour signaler ou bloquer'}
        accessibilityActions={deMoi ? undefined : [{ name: 'longpress', label: 'Signaler ou bloquer' }]}
        onAccessibilityAction={() => onOptions(message)}
        onLongPress={deMoi ? undefined : () => onOptions(message)}
        delayLongPress={350}
        style={[styles.bulle, deMoi ? styles.bulleMoi : styles.bulleAutre, message.enAttente && styles.enAttente]}>
        <Text style={[styles.bulleTexte, deMoi && styles.bulleTexteMoi]}>{message.texte}</Text>
      </Pressable>
    </View>
  );
}

/** La conversation d'une session. */
export default function ConversationSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { compte } = useCompte();
  const { conversations, etat, recharger, marquerLue } = useMessages();
  const conversation = conversations.find((x) => x.id === id);

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [echecLecture, setEchecLecture] = useState(false);
  const [texte, setTexte] = useState('');
  const [echecEnvoi, setEchecEnvoi] = useState(false);
  const liste = useRef<FlatList<Message>>(null);

  const relire = useCallback(async () => {
    const lus = await lireMessages(id);
    if (!lus) {
      setEchecLecture(true);
      return;
    }
    setEchecLecture(false);
    // Les messages en cours d'envoi restent affichés tant que le serveur ne les a pas rendus
    setMessages((avant) => [...lus, ...(avant ?? []).filter((m) => m.enAttente)]);
  }, [id]);

  // Lecture à l'ouverture, puis en direct à chaque nouveau message
  useEffect(() => {
    Promise.resolve().then(relire);
    return ecouterMessages(id, relire);
  }, [id, relire]);

  // Ouverte par une notification : la liste des conversations n'est peut-être pas encore à jour
  const absente = !conversation && etat !== 'chargement';
  useEffect(() => {
    if (absente) recharger();
  }, [absente, recharger]);

  // Tant que l'écran est ouvert, tout ce qui arrive est lu
  const nombre = messages?.length ?? 0;
  useEffect(() => {
    if (conversation) marquerLue(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nombre, !!conversation]);

  function options(message: Message) {
    vibrer.selection();
    const prenom = message.prenom || 'cette personne';
    const signaler = () =>
      router.push({
        pathname: '/signaler',
        params: {
          cible: 'message',
          id: message.id,
          nom: `« ${message.texte.slice(0, 80)} »`,
          auteur: message.auteurId,
          prenom: message.prenom,
        },
      });
    const bloquerLui = () =>
      demander({
        titre: `Bloquer ${prenom} ?`,
        texte: 'Tu ne verras plus ses sessions ni ses messages. Tu peux débloquer depuis Profil.',
        confirmer: 'Bloquer',
        destructif: true,
        onConfirmer: async () => {
          const echec = await bloquer(message.auteurId);
          if (echec) {
            vibrer.erreur();
            prevenir('Blocage impossible', echec);
            return;
          }
          recharger();
          relire();
        },
      });
    if (Platform.OS === 'web') {
      // Pas de menu natif sur le web : on passe directement au signalement
      signaler();
      return;
    }
    Alert.alert(prenom, message.texte.slice(0, 120), [
      { text: 'Signaler ce message', onPress: signaler },
      { text: `Bloquer ${prenom}`, style: 'destructive', onPress: bloquerLui },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function envoyer() {
    const propre = texte.trim();
    if (!propre || !compte) return;
    // Interface optimiste : le message s'affiche tout de suite, et repart dans le champ si l'envoi échoue
    const provisoire: Message = {
      id: `envoi-${Date.now()}`,
      auteurId: compte.id,
      prenom: compte.prenom ?? '',
      texte: propre,
      date: new Date(),
      enAttente: true,
    };
    setMessages((avant) => [...(avant ?? []), provisoire]);
    setTexte('');
    setEchecEnvoi(false);
    const envoye = await envoyerMessage(id, propre);
    if (envoye) {
      setMessages((avant) => [
        ...(avant ?? []).filter((m) => m.id !== provisoire.id && m.id !== envoye.id),
        envoye,
      ]);
      recharger();
    } else {
      setMessages((avant) => (avant ?? []).filter((m) => m.id !== provisoire.id));
      setTexte((actuel) => actuel || propre);
      setEchecEnvoi(true);
      vibrer.erreur();
    }
  }

  if (!conversation) {
    return (
      <View style={[styles.ecran, styles.seul]}>
        {etat === 'chargement' ? (
          <Text style={styles.aide}>Ouverture de la conversation…</Text>
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.titreSeul}>
              Cette conversation n’est plus disponible
            </Text>
            <Text style={styles.aide}>Elle est réservée aux inscrits de la session.</Text>
            <Bouton titre="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          </>
        )}
      </View>
    );
  }

  const enDirect = conversation.debut <= new Date() && new Date() < conversation.fin;
  const titre = conversation.commune ? `${conversation.titre} · ${conversation.commune}` : conversation.titre;
  const peutEnvoyer = texte.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.ecran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.entete, { paddingTop: top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, pressed && styles.presse]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${titre}, voir la session`}
          onPress={() => router.push({ pathname: '/session/[id]', params: { id } })}
          style={styles.enteteTextes}>
          <Text accessibilityRole="header" style={styles.titre} numberOfLines={1}>
            {titre}
          </Text>
          <Text style={styles.aide} numberOfLines={1}>
            {enDirect ? `En direct · jusqu’à ${heure(conversation.fin)}` : quand(conversation.debut)} ·{' '}
            {conversation.inscrits} {conversation.inscrits > 1 ? 'inscrits' : 'inscrit'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.lieu}>
        <IconeLieu couleur={c.rougeTexte} taille={18} />
        <Text style={styles.lieuTexte} numberOfLines={1}>
          {conversation.lieu}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Itinéraire vers ${conversation.lieu}`}
          onPress={() => ouvrirItineraire(conversation.position)}
          hitSlop={8}>
          <Text style={styles.lieuLien}>Itinéraire</Text>
        </Pressable>
      </View>

      <FlatList
        ref={liste}
        data={messages ?? []}
        keyExtractor={(m) => m.id}
        style={styles.fil}
        contentContainerStyle={styles.filContenu}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => liste.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <Text style={styles.systeme}>
            Tu as rejoint la session · {quandMessage(conversation.inscritLe)}
            {'\n'}Appui long sur un message pour le signaler ou bloquer son auteur
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.vide}>
            {echecLecture
              ? 'Impossible de charger les messages. Vérifie ta connexion.'
              : messages
                ? 'Personne n’a encore écrit. Dis bonjour au groupe.'
                : ''}
          </Text>
        }
        renderItem={({ item, index }) => {
          const deMoi = item.auteurId === compte?.id;
          const precedent = messages?.[index - 1];
          return (
            <Bulle
              message={item}
              deMoi={deMoi}
              avecPrenom={!deMoi && precedent?.auteurId !== item.auteurId}
              onOptions={options}
            />
          );
        }}
      />

      {echecEnvoi && (
        <Text accessibilityLiveRegion="polite" style={styles.echec}>
          Message pas envoyé. Vérifie ta connexion et réessaie.
        </Text>
      )}
      <View style={[styles.saisie, { paddingBottom: Math.max(bottom, 12) }]}>
        <TextInput
          value={texte}
          onChangeText={setTexte}
          placeholder="Écrire au groupe"
          placeholderTextColor={c.texteSecondaire}
          multiline
          maxLength={1000}
          style={styles.champ}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          accessibilityState={{ disabled: !peutEnvoyer }}
          disabled={!peutEnvoyer}
          onPress={envoyer}
          style={({ pressed }) => [styles.envoyer, !peutEnvoyer && styles.envoyerInactif, pressed && { opacity: 0.8 }]}>
          <IconeEnvoyer couleur={c.surRouge} taille={20} />
        </Pressable>
      </View>
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
    enteteTextes: { flex: 1, minHeight: Espaces.cibleTactile, justifyContent: 'center' },
    titre: { fontFamily: Polices.texteDemi, fontSize: Tailles.accent, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    lieu: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginTop: 10,
      paddingHorizontal: 14,
      minHeight: Espaces.cibleTactile,
      borderRadius: Rayons.bouton,
      backgroundColor: c.rougeDoux,
    },
    lieuTexte: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.rougeTexte },
    lieuLien: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.rougeTexte },
    fil: { flex: 1 },
    filContenu: { padding: Espaces.marge, gap: 6, flexGrow: 1 },
    systeme: {
      textAlign: 'center',
      fontFamily: Polices.texte,
      fontSize: Tailles.pastille,
      color: c.texteSecondaire,
      paddingBottom: 8,
    },
    vide: { textAlign: 'center', fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, paddingTop: 24 },
    rangee: { alignItems: 'flex-start', gap: 2 },
    rangeeMoi: { alignItems: 'flex-end' },
    prenom: {
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.pastille,
      color: c.texteSecondaire,
      paddingLeft: 12,
      paddingTop: 6,
    },
    bulle: { maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18 },
    bulleAutre: { backgroundColor: c.carte, borderWidth: 1, borderColor: c.trait },
    bulleMoi: { backgroundColor: c.rouge },
    enAttente: { opacity: 0.6 },
    bulleTexte: { fontFamily: Polices.texte, fontSize: Tailles.courant, lineHeight: 21, color: c.encre },
    bulleTexteMoi: { color: c.surRouge },
    echec: {
      fontFamily: Polices.texte,
      fontSize: Tailles.aide,
      color: c.encre,
      textAlign: 'center',
      paddingHorizontal: Espaces.marge,
      paddingBottom: 6,
    },
    saisie: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingTop: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: c.trait,
      backgroundColor: c.fond,
    },
    champ: {
      flex: 1,
      minHeight: Espaces.cibleTactile,
      maxHeight: 120,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      fontFamily: Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
    envoyer: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
    },
    envoyerInactif: { opacity: 0.4 },
  });

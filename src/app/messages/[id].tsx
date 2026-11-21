import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
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
import { IconeEnvoyer, IconeRetour } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { heure, quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { bloquer, demander } from '@/lib/moderation';
import {
  ecouterMessages,
  envoyerMessage,
  lireMessages,
  useMessages,
  type Message,
} from '@/lib/messages';
import {
  fusionnerMessages,
  initiale,
  placesDansLeFil,
  teinte,
  texteSeparateur,
  type PlaceDansLeFil,
} from '@/lib/fil-messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/**
 * Une bulle, comme dans Messenger : à droite en rouge pour moi, à gauche en gris pour les autres.
 * Les messages qui se suivent sont collés (coins resserrés du côté de l'auteur), le prénom n'apparaît
 * qu'au-dessus du premier et le petit rond de l'auteur qu'à côté du dernier.
 */
function Bulle({
  message,
  deMoi,
  place,
  onOptions,
}: {
  message: Message;
  deMoi: boolean;
  place: PlaceDansLeFil;
  /** Appui long sur le message d'un autre : signaler ou bloquer */
  onOptions: (message: Message) => void;
}) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  const { debutGroupe, finGroupe } = place;
  // Coins resserrés du côté de l'auteur, là où la bulle touche sa voisine
  const coins = deMoi
    ? { borderTopRightRadius: debutGroupe ? 18 : 4, borderBottomRightRadius: finGroupe ? 18 : 4 }
    : { borderTopLeftRadius: debutGroupe ? 18 : 4, borderBottomLeftRadius: finGroupe ? 18 : 4 };
  return (
    <View style={finGroupe && styles.finGroupe}>
      {place.separateur && <Text style={styles.separateur}>{texteSeparateur(place.separateur)}</Text>}
      {!deMoi && place.avecPrenom && <Text style={styles.prenom}>{message.prenom || 'Quelqu’un'}</Text>}
      <View style={[styles.rangee, deMoi && styles.rangeeMoi]}>
        {!deMoi &&
          (finGroupe ? (
            <View
              importantForAccessibility="no"
              style={[styles.avatar, { backgroundColor: teintes[teinte(message.auteurId)] }]}>
              <Text maxFontSizeMultiplier={1.3} style={styles.avatarTexte}>
                {initiale(message.prenom)}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarVide} />
          ))}
        <Pressable
          accessibilityLabel={deMoi ? `Toi : ${message.texte}` : `${message.prenom || 'Quelqu’un'} : ${message.texte}`}
          accessibilityHint={deMoi ? undefined : 'Appui long pour signaler ou bloquer'}
          accessibilityActions={deMoi ? undefined : [{ name: 'longpress', label: 'Signaler ou bloquer' }]}
          onAccessibilityAction={() => onOptions(message)}
          onLongPress={deMoi ? undefined : () => onOptions(message)}
          delayLongPress={350}
          style={[styles.bulle, deMoi ? styles.bulleMoi : styles.bulleAutre, coins, message.enAttente && styles.enAttente]}>
          <Text style={[styles.bulleTexte, deMoi && styles.bulleTexteMoi]}>{message.texte}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** La conversation d'une session. */
export default function ConversationSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { compte, pret } = useCompte();
  const { conversations, recharger, marquerLue } = useMessages();
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

  // Quand un message arrive : seulement ceux postérieurs au dernier qu'on a déjà (pas les 200 derniers)
  const dernier = useRef<Date | null>(null);
  useEffect(() => {
    dernier.current = messages?.filter((m) => !m.enAttente).at(-1)?.date ?? null;
  }, [messages]);
  const lireNouveaux = useCallback(async () => {
    const depuis = dernier.current;
    if (!depuis) return relire();
    const nouveaux = await lireMessages(id, depuis);
    if (nouveaux?.length) setMessages((avant) => fusionnerMessages(avant ?? [], nouveaux));
  }, [id, relire]);

  // Lecture à l'ouverture, puis en direct à chaque nouveau message
  useEffect(() => {
    Promise.resolve().then(relire);
    return ecouterMessages(id, lireNouveaux);
  }, [id, relire, lireNouveaux]);

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
    if (Platform.OS === 'ios') {
      // La feuille d'actions d'iOS, qui monte du bas de l'écran
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: prenom,
          message: message.texte.slice(0, 120),
          options: ['Signaler ce message', `Bloquer ${prenom}`, 'Annuler'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          tintColor: c.rouge,
        },
        (choix) => {
          if (choix === 0) signaler();
          if (choix === 1) bloquerLui();
        },
      );
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
  const peutEnvoyer = texte.trim().length > 0;
  const places = placesDansLeFil(messages ?? []);
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

      <FlatList
        ref={liste}
        data={messages ?? []}
        keyExtractor={(m) => m.id}
        style={styles.fil}
        contentContainerStyle={styles.filContenu}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => liste.current?.scrollToEnd({ animated: false })}
        // En haut du fil, comme au début d'une conversation Messenger : de quoi il s'agit, une seule fois
        ListHeaderComponent={
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
          return (
            <Bulle
              message={item}
              deMoi={item.auteurId === compte?.id}
              place={places[index]}
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
          placeholder="Message"
          placeholderTextColor={c.texteSecondaire}
          multiline
          maxLength={1000}
          numberOfLines={1}
          style={styles.champ}
        />
        {/* Comme Messenger : le bouton d'envoi n'apparaît que quand il y a quelque chose à envoyer */}
        {peutEnvoyer && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            onPress={envoyer}
            hitSlop={4}
            style={({ pressed }) => [styles.envoyer, pressed && { opacity: 0.6 }]}>
            <IconeEnvoyer couleur={c.rouge} taille={26} />
          </Pressable>
        )}
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
    fil: { flex: 1 },
    filContenu: { paddingHorizontal: 12, paddingBottom: 8, flexGrow: 1 },
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
    vide: { textAlign: 'center', fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, paddingTop: 8 },
    finGroupe: { marginBottom: 10 },
    separateur: {
      textAlign: 'center',
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.pastille,
      color: c.texteSecondaire,
      paddingTop: 8,
      paddingBottom: 12,
    },
    rangee: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 2 },
    rangeeMoi: { justifyContent: 'flex-end' },
    avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarVide: { width: 28 },
    avatarTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille, color: c.surAvatar },
    prenom: {
      fontFamily: Polices.texte,
      fontSize: Tailles.pastille,
      color: c.texteSecondaire,
      paddingLeft: 48,
      paddingBottom: 2,
    },
    bulle: { maxWidth: '75%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18 },
    bulleAutre: { backgroundColor: c.beige },
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
      paddingTop: 8,
      paddingHorizontal: 12,
      backgroundColor: c.fond,
    },
    champ: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.beige,
      fontFamily: Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
    envoyer: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

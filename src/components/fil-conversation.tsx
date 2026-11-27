// Le fil d'une conversation (bulles, envoi, arrivée en direct, signaler / bloquer), partagé par
// les groupes de session (`messages/[id]`) et les conversations privées (`prive/[id]`).
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeEnvoyer } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import {
  elementsDuFil,
  fusionnerMessages,
  initiale,
  teinte,
  texteSeparateur,
  type Arrivee,
  type ElementDuFil,
  type PlaceDansLeFil,
} from '@/lib/fil-messages';
import { vibrer } from '@/lib/haptics';
import { ecouterFil, envoyerDansFil, lireArrivees, lireFil, type Fil, type Message } from '@/lib/messages';
import { bloquer, demander } from '@/lib/moderation';
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
  avecPrenoms,
  organise,
  onOptions,
}: {
  message: Message;
  deMoi: boolean;
  place: PlaceDansLeFil;
  /** L'auteur organise la session : une petite étiquette à côté de son prénom */
  organise?: boolean;
  /** À deux, on sait qui parle : pas de prénom au-dessus des bulles */
  avecPrenoms: boolean;
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
      {!deMoi && avecPrenoms && place.avecPrenom && (
        <View style={styles.ligneP}>
          <Text style={styles.prenom}>{message.prenom || 'Quelqu’un'}</Text>
          {organise && (
            <Text maxFontSizeMultiplier={1.3} style={styles.orga}>
              organise
            </Text>
          )}
        </View>
      )}
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

/** Une petite barre des places, dans une ligne du fil : « 6/10 » */
function MiniBarre({ nombre, total }: { nombre: number; total: number }) {
  const styles = useStyles(creerStyles);
  const cases = Math.min(total, 12);
  const pleines = Math.round((Math.min(nombre, total) / total) * cases);
  return (
    <View style={styles.mini} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: cases }, (_, i) => (
        <View key={i} style={[styles.miniCase, i < pleines && styles.miniPleine]} />
      ))}
    </View>
  );
}

/** Ce qui arrive à la session, au milieu du fil : « Sarah a catché · 6/10 », « Plus que 2 places », « C’est parti » */
function LigneEvenement({ element, moi }: { element: Exclude<ElementDuFil, { type: 'message' }>; moi?: string }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  if (element.type === 'repere') {
    return (
      <View style={styles.repere} accessibilityRole="text">
        <View style={styles.trait} />
        <Text maxFontSizeMultiplier={1.3} style={styles.repereTexte}>
          {element.texte}
        </Text>
        <View style={styles.trait} />
      </View>
    );
  }
  const cEstMoi = element.joueurId === moi;
  const texte = cEstMoi ? 'Tu as catché' : `${element.prenom || 'Quelqu’un'} a catché`;
  return (
    <View
      style={styles.arrivee}
      accessible
      accessibilityLabel={`${texte}, ${element.nombre} sur ${element.total}`}>
      <View style={[styles.avatarPetit, { backgroundColor: cEstMoi ? c.rouge : teintes[teinte(element.joueurId)] }]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.avatarPetitTexte, cEstMoi && styles.surRouge]}>
          {cEstMoi ? 'T' : initiale(element.prenom)}
        </Text>
      </View>
      <Text maxFontSizeMultiplier={1.3} style={styles.arriveeTexte}>
        {texte} ·
      </Text>
      <MiniBarre nombre={element.nombre} total={element.total} />
      <Text maxFontSizeMultiplier={1.3} style={styles.arriveeTexte}>
        {element.nombre}/{element.total}
      </Text>
    </View>
  );
}

/**
 * Les messages d'un fil et le champ pour écrire. À placer sous l'en-tête de l'écran,
 * dans un `KeyboardAvoidingView`.
 */
export function FilConversation({
  fil,
  intro,
  vide,
  avecPrenoms = true,
  groupe,
  onLu,
  relireConversations,
}: {
  fil: Fil;
  /** En haut du fil, une seule fois : de quoi parle la conversation */
  intro?: React.ReactElement;
  /** Le groupe d'une session : le fil raconte aussi les arrivées et marque l'organisateur */
  groupe?: { organisateurId: string; joueurs: number; debut: Date };
  /** Texte quand personne n'a encore écrit */
  vide: string;
  avecPrenoms?: boolean;
  /** Appelé à chaque nouveau message affiché : l'écran est ouvert, tout est lu */
  onLu: () => void;
  /** Après un envoi ou un blocage : relire la liste des conversations (aperçus, non lus) */
  relireConversations: () => void;
}) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const { compte } = useCompte();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [echecLecture, setEchecLecture] = useState(false);
  const [texte, setTexte] = useState('');
  const [echecEnvoi, setEchecEnvoi] = useState(false);
  const liste = useRef<FlatList<ElementDuFil>>(null);
  const { type, id } = fil;

  const relire = useCallback(async () => {
    const lus = await lireFil({ type, id });
    if (!lus) {
      setEchecLecture(true);
      return;
    }
    setEchecLecture(false);
    // Les messages en cours d'envoi restent affichés tant que le serveur ne les a pas rendus
    setMessages((avant) => [...lus, ...(avant ?? []).filter((m) => m.enAttente)]);
  }, [type, id]);

  // Quand un message arrive : seulement ceux postérieurs au dernier qu'on a déjà (pas les 200 derniers)
  const dernier = useRef<Date | null>(null);
  useEffect(() => {
    dernier.current = messages?.filter((m) => !m.enAttente).at(-1)?.date ?? null;
  }, [messages]);
  const lireNouveaux = useCallback(async () => {
    const depuis = dernier.current;
    if (!depuis) return relire();
    const nouveaux = await lireFil({ type, id }, depuis);
    if (nouveaux?.length) setMessages((avant) => fusionnerMessages(avant ?? [], nouveaux));
  }, [type, id, relire]);

  // Le groupe d'une session : qui a rejoint et quand, relu à chaque nouveau message (quelqu'un a pu catcher)
  const [arrivees, setArrivees] = useState<Arrivee[] | null>(null);
  const nombreMessages = messages?.length ?? 0;
  const avecArrivees = type === 'session' && !!groupe;
  useEffect(() => {
    if (!avecArrivees) return;
    let actif = true;
    lireArrivees(id).then((lues) => {
      if (actif && lues) setArrivees(lues);
    });
    return () => {
      actif = false;
    };
  }, [avecArrivees, id, nombreMessages]);

  // Lecture à l'ouverture, puis en direct à chaque nouveau message
  useEffect(() => {
    Promise.resolve().then(relire);
    return ecouterFil({ type, id }, lireNouveaux);
  }, [type, id, relire, lireNouveaux]);

  // Tant que l'écran est ouvert, tout ce qui arrive est lu
  const nombre = messages?.length ?? 0;
  const surLu = useRef(onLu);
  useEffect(() => {
    surLu.current = onLu;
  });
  useEffect(() => {
    surLu.current();
  }, [id, nombre]);

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
          relireConversations();
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
    const envoye = await envoyerDansFil({ type, id }, propre);
    if (envoye) {
      setMessages((avant) => [
        ...(avant ?? []).filter((m) => m.id !== provisoire.id && m.id !== envoye.id),
        envoye,
      ]);
      relireConversations();
    } else {
      setMessages((avant) => (avant ?? []).filter((m) => m.id !== provisoire.id));
      setTexte((actuel) => actuel || propre);
      setEchecEnvoi(true);
      vibrer.erreur();
    }
  }

  const peutEnvoyer = texte.trim().length > 0;
  const elements = elementsDuFil(
    messages ?? [],
    groupe && arrivees ? { ...groupe, arrivees } : undefined,
  );

  return (
    <>
      <FlatList
        ref={liste}
        data={elements}
        keyExtractor={(e) => (e.type === 'message' ? e.message.id : e.id)}
        style={styles.fil}
        contentContainerStyle={styles.filContenu}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => liste.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={intro}
        ListEmptyComponent={
          <Text style={styles.vide}>
            {echecLecture ? 'Pas de réseau.' : messages ? vide : ''}
          </Text>
        }
        renderItem={({ item }) =>
          item.type === 'message' ? (
            <Bulle
              message={item.message}
              deMoi={item.message.auteurId === compte?.id}
              place={item.place}
              avecPrenoms={avecPrenoms}
              organise={!!groupe && item.message.auteurId === groupe.organisateurId}
              onOptions={options}
            />
          ) : (
            <LigneEvenement element={item} moi={compte?.id} />
          )
        }
      />

      {echecEnvoi && (
        <Text accessibilityLiveRegion="polite" style={styles.echec}>
          Message pas envoyé, pas de réseau.
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
    </>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fil: { flex: 1 },
    filContenu: { paddingHorizontal: 12, paddingBottom: 8, flexGrow: 1 },
    vide: { textAlign: 'center', ...Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, paddingTop: 8 },
    finGroupe: { marginBottom: 10 },
    separateur: {
      textAlign: 'center',
      ...Polices.texteMoyen,
      fontSize: Tailles.pastille,
      color: c.texteSecondaire,
      paddingTop: 8,
      paddingBottom: 12,
    },
    rangee: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 2 },
    rangeeMoi: { justifyContent: 'flex-end' },
    avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarVide: { width: 28 },
    avatarTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.surAvatar },
    ligneP: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 48, paddingBottom: 2 },
    prenom: { ...Polices.texte, fontSize: Tailles.pastille, color: c.texteSecondaire },
    orga: {
      ...Polices.texteDemi,
      fontSize: Tailles.minuscule,
      color: c.orangeTexte,
      backgroundColor: c.orangeDoux,
      borderRadius: Rayons.pilule,
      paddingHorizontal: 6,
      overflow: 'hidden',
    },
    arrivee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
    arriveeTexte: { ...Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
    avatarPetit: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    avatarPetitTexte: { ...Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surAvatar },
    surRouge: { color: c.surRouge },
    mini: { flexDirection: 'row', gap: 2, width: 90 },
    miniCase: { flex: 1, height: 7, borderRadius: 3, backgroundColor: c.trait },
    miniPleine: { backgroundColor: c.encre },
    repere: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8 },
    trait: { flex: 1, height: 1, backgroundColor: c.trait },
    repereTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.rougeTexte },
    bulle: { maxWidth: '75%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18 },
    bulleAutre: { backgroundColor: c.beige },
    bulleMoi: { backgroundColor: c.rouge },
    enAttente: { opacity: 0.6 },
    bulleTexte: { ...Polices.texte, fontSize: Tailles.courant, lineHeight: 21, color: c.encre },
    bulleTexteMoi: { color: c.surRouge },
    echec: {
      ...Polices.texte,
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
      ...Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
    envoyer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  });

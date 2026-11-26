import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { BalleRebond, CartesFantomes } from '@/components/chargement';
import { IconeChevron } from '@/components/icones';
import { PointEnDirect } from '@/components/pastille-session';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { ImagesSports } from '@/donnees/images-sports';
import { useCompte } from '@/lib/compte';
import { initiale, teinte } from '@/lib/fil-messages';
import { rubriqueConversation, tempsConversation } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { quandMessage, useMessages, type Conversation, type ConversationPrivee } from '@/lib/messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** « Lucas : on est devant la buvette », « Toi : j'arrive », ou une invitation à écrire le premier. */
function apercu(conversation: Conversation) {
  const { dernier } = conversation;
  if (!dernier) return 'Dis bonjour au groupe';
  return `${dernier.deMoi ? 'Toi' : dernier.prenom || 'Quelqu’un'} : ${dernier.texte}`;
}

/**
 * Une ligne de groupe (finition 1 de Maxime, 26 novembre) : la photo du sport en rond (anneau rouge en direct),
 * le titre suivi d'une pastille du moment (« Dans 3 h », « En direct », « Demain 18h »), l'aperçu et l'heure.
 * Non lu = texte en gras et un point rouge à droite. Une session terminée est grisée, sans pastille.
 */
function LigneConversation({ conversation }: { conversation: Conversation }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const nonLue = conversation.nonLus > 0;
  const quandTexte = quandMessage(conversation.dernier?.date ?? conversation.inscritLe);
  const temps = tempsConversation(conversation.debut, conversation.fin);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${conversation.titre}, ${temps.court}, ${nonLue ? 'non lu, ' : ''}${apercu(conversation)}, ${quandTexte}`}
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.ligne, temps.ton === 'fini' && styles.terminee, pressed && styles.presse]}>
      <View style={[styles.cadrePhoto, temps.ton === 'direct' && styles.anneau]}>
        <Image source={ImagesSports[conversation.sport]} style={styles.photo} resizeMode="cover" />
      </View>
      <View style={styles.textes}>
        <View style={styles.ligneTitre}>
          <Text style={[styles.titre, nonLue && styles.gras]} numberOfLines={1}>
            {conversation.titre}
          </Text>
          {temps.ton !== 'fini' && (
            <View
              style={[
                styles.pastille,
                temps.ton === 'direct' ? styles.pastilleDirect : temps.ton === 'bientot' ? styles.pastilleBientot : styles.pastilleNeutre,
              ]}>
              {temps.ton === 'direct' && <PointEnDirect couleur={c.surRouge} />}
              <Text
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                style={[
                  styles.pastilleTexte,
                  temps.ton === 'direct' ? styles.surRouge : temps.ton === 'bientot' ? styles.rougeTexte : styles.secondaire,
                ]}>
                {temps.court}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.ligneApercu}>
          <Text style={[styles.apercu, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {apercu(conversation)}
          </Text>
          <Text style={[styles.quand, nonLue && styles.apercuNonLu]} numberOfLines={1}>
            {`\u00A0· ${quandTexte}`}
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
            {`\u00A0· ${quandTexte}`}
          </Text>
        </View>
      </View>
      {nonLue && <View style={styles.point} />}
    </Pressable>
  );
}

type Espace = 'groupes' | 'prives';

/**
 * « Groupes » / « Privés » : deux onglets calmes, le nom en encre et un trait dessous pour celui qu'on lit,
 * et en rouge le nombre de conversations pas encore lues (le rouge reste pour ce qui demande d'agir).
 */
function ChoixEspace({
  espace,
  onChoix,
  nonLusGroupes,
  nonLusPrives,
}: {
  espace: Espace;
  onChoix: (espace: Espace) => void;
  nonLusGroupes: number;
  nonLusPrives: number;
}) {
  const styles = useStyles(creerStyles);
  const choix = (valeur: Espace, titre: string, nombre: number) => {
    const actif = espace === valeur;
    return (
      <Pressable
        key={valeur}
        accessibilityRole="tab"
        accessibilityState={{ selected: actif }}
        accessibilityLabel={nombre ? `${titre}, ${nombre} non ${nombre > 1 ? 'lues' : 'lue'}` : titre}
        onPress={() => {
          if (!actif) vibrer.selection();
          onChoix(valeur);
        }}
        style={[styles.choix, actif && styles.choixActif]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.choixTexte, actif && styles.choixTexteActif]}>
          {titre}
        </Text>
        {nombre > 0 && (
          <View style={styles.compteur}>
            <Text maxFontSizeMultiplier={1.3} style={styles.compteurTexte}>
              {nombre}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };
  return (
    <View accessibilityRole="tablist" style={styles.espaces}>
      {choix('groupes', 'Groupes', nonLusGroupes)}
      {choix('prives', 'Privés', nonLusPrives)}
    </View>
  );
}

const TITRES_RUBRIQUES = { aujourdhui: 'Aujourd’hui', semaine: 'Cette semaine', plusTard: 'Plus tard' } as const;

/** Les groupes rangés par moment, et les sessions terminées repliées tout en bas */
function ListeGroupes({ conversations }: { conversations: Conversation[] }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const [ouvertes, setOuvertes] = useState(false);
  const maintenant = new Date();
  const rangees = (Object.keys(TITRES_RUBRIQUES) as (keyof typeof TITRES_RUBRIQUES)[]).map((rubrique) => ({
    rubrique,
    liste: conversations
      .filter((x) => rubriqueConversation(x.debut, x.fin, maintenant) === rubrique)
      .sort((a, b) => a.debut.getTime() - b.debut.getTime()),
  }));
  const terminees = conversations
    .filter((x) => rubriqueConversation(x.debut, x.fin, maintenant) === 'terminee')
    .sort((a, b) => b.fin.getTime() - a.fin.getTime());
  return (
    <View style={styles.liste}>
      {rangees
        .filter((r) => r.liste.length > 0)
        .map((r) => (
          <View key={r.rubrique} style={styles.rubrique}>
            <Text accessibilityRole="header" style={styles.rubriqueTitre}>
              {TITRES_RUBRIQUES[r.rubrique]}
            </Text>
            {r.liste.map((conversation) => (
              <LigneConversation key={conversation.id} conversation={conversation} />
            ))}
          </View>
        ))}
      {terminees.length > 0 && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: ouvertes }}
            accessibilityLabel={`Terminées, ${terminees.length}`}
            onPress={() => {
              vibrer.selection();
              setOuvertes((o) => !o);
            }}
            style={({ pressed }) => [styles.repli, pressed && styles.presse]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.repliTexte}>
              Terminées · {terminees.length}
            </Text>
            <View style={ouvertes ? styles.chevronHaut : styles.chevronBas}>
              <IconeChevron couleur={c.texteSecondaire} taille={18} />
            </View>
          </Pressable>
          {ouvertes &&
            terminees.map((conversation) => <LigneConversation key={conversation.id} conversation={conversation} />)}
        </>
      )}
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
        <CartesFantomes accessibilityLabel="Chargement de tes conversations" />
      </Ecran>
    );
  }

  return (
    // Tout l'écran défile (comme Mes sessions) : la liste passe sous la barre et « + Créer »,
    // au lieu de s'arrêter au-dessus en laissant une bande vide.
    <Ecran titre="Messages" defile>
      <ChoixEspace espace={espace} onChoix={setEspace} nonLusGroupes={nonLusGroupes} nonLusPrives={nonLusPrives} />
      {espace === 'groupes' ? (
        conversations.length === 0 ? (
          <View style={styles.vide}>
            <BalleRebond taille={44} hauteur={70} />
            <Text accessibilityRole="header" style={styles.videTitre}>
              Pas encore de groupe
            </Text>
            <Text style={styles.videTexte}>Catche une session : tu pourras écrire à tous ses joueurs ici.</Text>
            <View>
              <Bouton titre="Voir la carte" onPress={() => router.navigate('/')} />
            </View>
          </View>
        ) : (
          <ListeGroupes conversations={conversations} />
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
    espaces: { flexDirection: 'row', gap: 22, borderBottomWidth: 1, borderBottomColor: c.trait, marginBottom: 4 },
    choix: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: Espaces.cibleTactile,
      borderBottomWidth: 2.5,
      borderBottomColor: 'transparent',
      marginBottom: -1,
    },
    choixActif: { borderBottomColor: c.encre },
    choixTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.texteSecondaire },
    choixTexteActif: { color: c.encre },
    compteur: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Rayons.pilule, backgroundColor: c.rouge, alignItems: 'center' },
    compteurTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.micro, color: c.surRouge },
    rubrique: { gap: 2 },
    rubriqueTitre: {
      fontFamily: Polices.titreDemi,
      fontSize: Tailles.petit,
      color: c.encre,
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 2,
    },
    ligneTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cadrePhoto: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    anneau: { borderWidth: 2.5, borderColor: c.rouge },
    photo: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.fondPhoto },
    terminee: { opacity: 0.62 },
    pastille: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 0,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: Rayons.pilule,
    },
    pastilleDirect: { backgroundColor: c.rouge },
    pastilleBientot: { backgroundColor: c.rougeDoux },
    pastilleNeutre: { backgroundColor: c.beige },
    pastilleTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.micro },
    surRouge: { color: c.surRouge },
    rougeTexte: { color: c.rougeTexte },
    secondaire: { color: c.texteSecondaire },
    repli: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: Espaces.cibleTactile,
      marginTop: 14,
      marginHorizontal: 10,
      paddingHorizontal: 14,
      borderRadius: Rayons.bouton,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.trait,
    },
    repliTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.texteSecondaire },
    chevronBas: { transform: [{ rotate: '90deg' }] },
    chevronHaut: { transform: [{ rotate: '-90deg' }] },
    vide: { alignItems: 'center', gap: 10, paddingTop: 36, paddingHorizontal: 16 },
    videTitre: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.encre, textAlign: 'center' },
    videTexte: { fontFamily: Polices.texte, fontSize: Tailles.courant, color: c.texteSecondaire, textAlign: 'center', marginBottom: 6 },
  });

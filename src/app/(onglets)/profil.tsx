// Profil : la carte de joueur (finition 3 choisie par Maxime le 26 novembre, maquettes
// https://claude.ai/artifact/EKi9mpqNJWqrBcJmPZTAQD). En haut, une carte orange comme l'en-tête d'une session :
// son rond, son prénom, « Joue au foot, au padel… » et l'interrupteur « Dispo ce soir ? ». Elle reste en haut et
// se replie en une ligne en défilant. Dessous, une seule page : la question du moment, les potes, les Catchs en
// photos, les sports. Plus d'« À venir » : c'est l'onglet Mes sessions.
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { Chargement } from '@/components/chargement';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron, IconeMenu, IconePhoto, IconeProfil, IconeVerifie } from '@/components/icones';
import { SITE } from '@/constants/liens';
import { BarreNavigation, Espaces, Polices, RESERVE_BAS, Rayons, Tailles } from '@/constants/theme';
import { ImagesSports } from '@/donnees/images-sports';
import type { Sport } from '@/donnees/pictos';
import { NOM_ZONE } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { choisir, prevenir } from '@/lib/alerte';
import { useCompte, type Compte } from '@/lib/compte';
import { ecrireA } from '@/lib/ecrire-prive';
import { quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { useHistorique } from '@/lib/historique';
import { useMesSports } from '@/lib/mes-sports';
import { usePhoto } from '@/lib/photo';
import { repondre, usePotes, type Pote } from '@/lib/potes';
import { accorder, dateCourte, initiale, separerTraces, sportsDuProfil, type Trace } from '@/lib/profil';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Au-delà de ce défilement, la carte de joueur se replie */
const SEUIL_REPLI = 60;

function inviterDesAmis() {
  const texte = 'Viens faire du sport avec moi sur Catch :';
  Share.share(Platform.OS === 'ios' ? { message: texte, url: SITE } : { message: `${texte} ${SITE}` }).catch(
    () => {},
  );
}

/** « Lu », « Sa » : les deux premières lettres du prénom */
function deuxLettres(prenom: string) {
  const net = prenom.trim();
  return net ? net.charAt(0).toUpperCase() + net.slice(1, 2).toLowerCase() : '?';
}

/** Les trois traits : réglages, aide, compte */
function BoutonMenu() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Réglages"
      onPress={() => router.push('/reglages')}
      hitSlop={8}
      style={({ pressed }) => [styles.menu, pressed && { backgroundColor: c.trait }]}>
      <IconeMenu couleur={c.encre} taille={22} />
    </Pressable>
  );
}

/** Son rond : sa photo, sinon l'initiale sur un carré arrondi légèrement penché */
function MonRond({ prenom, petit = false }: { prenom: string | null; petit?: boolean }) {
  const styles = useStyles(creerStyles);
  const { photo } = usePhoto();
  return (
    <View
      style={[styles.monRond, petit && styles.monRondPetit, photo && styles.monRondPhoto]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={[styles.monRondLettre, petit && styles.monRondLettrePetite]} maxFontSizeMultiplier={1}>
          {initiale(prenom) || '?'}
        </Text>
      )}
    </View>
  );
}

/** Le grand rond de l'en-tête : le toucher pour mettre, changer ou retirer sa photo */
function RondAvecPhoto({ prenom }: { prenom: string | null }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { photo, envoi, choisir: choisirPhoto, retirer } = usePhoto();

  async function prendre(source: 'appareil' | 'galerie') {
    const resultat = await choisirPhoto(source);
    if (resultat === 'ok') vibrer.succes();
    if (resultat === 'erreur') {
      vibrer.erreur();
      prevenir('Photo pas envoyée', 'Pas de réseau. Réessaie.');
    }
  }

  function ouvrir() {
    vibrer.selection();
    choisir({
      titre: 'Une photo de ton visage aide les autres à te reconnaître au terrain.',
      couleur: c.rouge,
      options: [
        { texte: 'Prendre une photo', onPress: () => prendre('appareil') },
        { texte: 'Choisir dans mes photos', onPress: () => prendre('galerie') },
        ...(photo
          ? [
              {
                texte: 'Retirer ma photo',
                destructif: true,
                onPress: async () => {
                  if (!(await retirer())) prevenir('Pas de réseau', 'Ta photo n’a pas été retirée. Réessaie.');
                },
              },
            ]
          : []),
      ],
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={photo ? 'Changer ma photo' : 'Ajouter une photo'}
      onPress={ouvrir}
      disabled={envoi}
      style={({ pressed }) => [styles.rondAvecPhoto, (pressed || envoi) && styles.presse]}>
      <MonRond prenom={prenom} />
      {!photo && (
        <View style={styles.badgePhoto}>
          <IconePhoto couleur={c.surEncre} taille={13} />
        </View>
      )}
    </Pressable>
  );
}

/** Rond d'un pote : sa photo ou ses deux premières lettres, entouré de rouge s'il est dispo ce soir */
function RondPote({ prenom, index, dispo = false, photo }: { prenom: string; index: number; dispo?: boolean; photo?: string | null }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const fond = [c.avatar1, c.avatar2, c.avatar3, c.avatar4][index % 4];
  return (
    <View style={[styles.anneauPote, dispo && styles.anneauDispo]}>
      <View style={[styles.rondPote, { backgroundColor: fond }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
        ) : (
          <Text style={styles.rondPoteTexte} maxFontSizeMultiplier={1}>
            {deuxLettres(prenom)}
          </Text>
        )}
      </View>
    </View>
  );
}

/** « Joue au foot, au padel et au basket » */
function phraseSports(sports: Sport[]) {
  if (sports.length === 0) return 'Choisis tes sports pour commencer';
  const noms = sports.slice(0, 3).map((s) => `au ${(ficheSport(s).nomTuile ?? ficheSport(s).nom).toLowerCase()}`);
  const liste = noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}` : noms[0];
  return `Joue ${liste}${sports.length > 3 ? '…' : ''}`;
}

/**
 * La carte de joueur (finition 3 choisie par Maxime le 26 novembre) : orange comme l'en-tête d'une session,
 * son rond, son prénom, les sports qu'il joue et l'interrupteur « Dispo ce soir ? ». Elle reste en haut et
 * se replie en une ligne quand on fait défiler.
 */
function CarteJoueur({
  compte,
  sports,
  dispo,
  onDispo,
  replie,
  onMesure,
}: {
  compte: Compte;
  sports: Sport[];
  dispo: boolean;
  onDispo: () => void;
  replie: boolean;
  onMesure: (hauteur: number) => void;
}) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={[styles.carteJoueur, { paddingTop: top + (replie ? 8 : 14) }, replie && styles.carteJoueurRepliee]}
      onLayout={(e) => !replie && onMesure(e.nativeEvent.layout.height)}>
      <View style={styles.identite}>
        {replie ? <MonRond prenom={compte.prenom} petit /> : <RondAvecPhoto prenom={compte.prenom} />}
        <View style={styles.identiteTextes}>
          <Text accessibilityRole="header" style={[styles.prenom, replie && styles.prenomReplie]} numberOfLines={1}>
            {compte.prenom ?? 'Profil'}
          </Text>
          {!replie && (
            <View style={styles.verifie}>
              {compte.verifiePar && <IconeVerifie couleur={c.surCreer} taille={15} />}
              <Text style={styles.verifieTexte} numberOfLines={1}>
                {compte.verifiePar ? `Vérifié · ${NOM_ZONE}` : NOM_ZONE}
              </Text>
            </View>
          )}
        </View>
        {replie && dispo && (
          <View style={styles.dispoMini}>
            <Text style={styles.dispoMiniTexte} maxFontSizeMultiplier={1.3}>
              Dispo ce soir
            </Text>
          </View>
        )}
        <BoutonMenu />
      </View>
      {!replie && (
        <>
          <Pressable onPress={() => router.push('/mes-sports')} accessibilityRole="button" accessibilityHint="Choisir mes sports">
            <Text style={styles.joue}>{phraseSports(sports)}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Dispo ce soir"
            accessibilityHint="Tes potes le voient jusqu’à minuit"
            accessibilityState={{ checked: dispo }}
            onPress={onDispo}
            style={({ pressed }) => [styles.interrupteur, dispo && styles.interrupteurActif, pressed && styles.presse]}>
            <Text style={[styles.interrupteurTexte, dispo && styles.interrupteurTexteActif]} maxFontSizeMultiplier={1.3}>
              {dispo ? 'Dispo ce soir' : 'Dispo ce soir ?'}
            </Text>
            <View style={[styles.glissiere, dispo && styles.glissiereActive]}>
              <View style={[styles.bouleGlissiere, dispo && styles.bouleGlissiereActive]} />
            </View>
          </Pressable>
        </>
      )}
    </View>
  );
}

/** « Tu rejouerais avec qui ? » : on coche les joueurs ici même, sans changer d'écran */
function QuestionRejouer({ donnees }: { donnees: ReturnType<typeof usePotes> }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const [coches, setCoches] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [merci, setMerci] = useState<string | null>(null);
  const q = donnees.question;
  if (merci !== null) {
    return (
      <View style={styles.carte}>
        <Text style={styles.titreQuestion}>Merci !</Text>
        <Text style={styles.aide}>{merci}</Text>
      </View>
    );
  }
  if (!q) return null;
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];

  async function valider() {
    if (!q) return;
    setEnvoi(true);
    const nouveaux = await repondre(q.sessionId, coches);
    setEnvoi(false);
    if (nouveaux === null) {
      vibrer.erreur();
      prevenir('Pas de réseau', 'Ta réponse n’est pas partie. Réessaie.');
      return;
    }
    vibrer.succes();
    setMerci(
      nouveaux.length
        ? `Toi et ${nouveaux.map((p) => p.prenom).join(', ')}, vous êtes potes maintenant.`
        : 'C’est noté.',
    );
    donnees.recharger();
  }

  return (
    <View style={styles.carte}>
      <View>
        <Text style={styles.titreQuestion}>Tu rejouerais avec qui ?</Text>
        <Text style={styles.aide} numberOfLines={1}>
          {q.titre} · {q.lieu}
        </Text>
      </View>
      <View style={styles.choixJoueurs}>
        {q.joueurs.map((j, i) => {
          const coche = coches.includes(j.id);
          return (
            <Pressable
              key={j.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: coche }}
              accessibilityLabel={j.prenom}
              onPress={() => {
                vibrer.selection();
                setCoches((avant) => (coche ? avant.filter((x) => x !== j.id) : [...avant, j.id]));
              }}
              style={[styles.choixJoueur, coche && styles.choixJoueurCoche]}>
              <View style={[styles.miniRond, { backgroundColor: teintes[i % 4] }]}>
                <Text style={styles.miniRondTexte} maxFontSizeMultiplier={1}>
                  {initiale(j.prenom)}
                </Text>
              </View>
              <Text style={[styles.choixJoueurTexte, coche && styles.choixJoueurTexteCoche]} maxFontSizeMultiplier={1.3}>
                {j.prenom}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.boutonGauche}>
        <Bouton titre={coches.length ? 'C’est bon' : 'Personne cette fois'} variante={coches.length ? undefined : 'secondaire'} attente={envoi} onPress={valider} />
      </View>
    </View>
  );
}

/** Mes potes : un rond chacun, entouré de rouge s'il est dispo ce soir ; puis ce qu'ils jouent cette semaine */
function BlocPotes({ donnees }: { donnees: ReturnType<typeof usePotes> }) {
  const styles = useStyles(creerStyles);
  const { potes, semaine: sessions } = donnees;
  if (potes.length === 0) {
    return (
      <View style={styles.bloc}>
        <Text style={styles.titreBloc}>Mes potes</Text>
        <View style={styles.vide}>
          <Text style={styles.titreVide}>Pas encore de potes</Text>
          <Text style={styles.aideCentree}>Après une session, dis avec qui tu rejouerais. Si c’est réciproque, vous devenez potes.</Text>
          <Bouton titre="Inviter des amis" variante="secondaire" onPress={inviterDesAmis} />
        </View>
      </View>
    );
  }
  const aVenir = [...sessions].sort((a, b) => a.debut.getTime() - b.debut.getTime()).slice(0, 3);
  return (
    <View style={styles.bloc}>
      <Text style={styles.titreBloc}>Mes potes · {potes.length}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ronds}>
        {potes.map((p, i) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${p.prenom}${p.dispo ? ', dispo ce soir' : ''}. Lui écrire`}
            accessibilityHint="Appui long pour signaler"
            accessibilityActions={[{ name: 'longpress', label: 'Plus d’options' }]}
            onAccessibilityAction={() => optionsPote(p)}
            onPress={() => ecrireA({ autreId: p.id, prenom: p.prenom, connecte: true })}
            onLongPress={() => optionsPote(p)}
            style={styles.rondAvecNom}>
            <RondPote prenom={p.prenom} index={i} dispo={p.dispo} photo={p.photo} />
            <Text style={styles.nomRond} numberOfLines={1}>
              {p.prenom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {aVenir.map((s) => {
        const pote = potes.find((p) => p.id === s.poteId);
        return (
          <Pressable
            key={`${s.poteId}:${s.sessionId}`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/session/[id]', params: { id: s.sessionId } })}
            style={({ pressed }) => [styles.ligneSession, pressed && styles.presse]}>
            <Image source={ImagesSports[s.sport]} style={styles.vignette} resizeMode="cover" />
            <View style={styles.flex}>
              <Text style={styles.quandPote} numberOfLines={1}>
                {quand(s.debut)}
              </Text>
              <Text style={styles.ligneTitre} numberOfLines={1}>
                {s.titre} · {s.lieu}
              </Text>
              <Text style={styles.aide} numberOfLines={1}>
                {pote?.prenom ?? 'Un pote'} {s.organise ? 'organise' : 'y va'}
                {s.jYSuis ? ' · tu y vas aussi' : s.inscrits >= s.joueurs ? ' · complet' : ` · ${accorder(s.joueurs - s.inscrits, 'place', 'places')}`}
              </Text>
            </View>
            <IconeChevronSecondaire />
          </Pressable>
        );
      })}
    </View>
  );
}

function IconeChevronSecondaire() {
  const c = useCouleurs();
  return <IconeChevron couleur={c.texteSecondaire} taille={20} />;
}

/** Mes Catchs : les sessions jouées, en cartes photo qui défilent de côté */
function BlocCatchs({ jouees, etat }: { jouees: Trace[]; etat: string }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.bloc}>
      <Text style={styles.titreBloc}>Mes Catchs{jouees.length ? ` · ${jouees.length}` : ''}</Text>
      {jouees.length === 0 ? (
        etat === 'chargement' ? (
          <Chargement />
        ) : (
          <View style={styles.vide}>
            <Text style={styles.titreVide}>{etat === 'erreur' ? 'Pas de réseau' : 'Ton premier Catch t’attend'}</Text>
            <Text style={styles.aideCentree}>
              {etat === 'erreur' ? 'Tes Catchs s’afficheront dès que ça revient.' : 'Les sessions que tu joues s’afficheront ici.'}
            </Text>
            {etat !== 'erreur' && <Bouton titre="Voir la carte" onPress={() => router.navigate('/')} />}
          </View>
        )
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrousel}>
            {jouees.map((t) => (
              <View key={t.id} style={styles.carteCatch} accessible accessibilityLabel={`${t.titre}, ${dateCourte(t.debut)}, ${t.lieu}`}>
                <Image source={ImagesSports[t.sport]} style={styles.photoCatch} resizeMode="cover" />
                <View style={styles.texteCatch}>
                  <Text style={styles.ligneTitre} numberOfLines={1}>
                    {t.titre}
                  </Text>
                  <Text style={styles.aide} numberOfLines={1}>
                    {dateCourte(t.debut)}
                    {t.organise ? ' · tu organisais' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

/** Mes sports : une pastille photo par sport, et « Ajouter » */
function BlocSports({ sports }: { sports: Sport[] }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.bloc}>
      <Text style={styles.titreBloc}>Mes sports</Text>
      <View style={styles.pastillesSports}>
        {sports.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityHint="Modifier mes sports"
            onPress={() => router.push('/mes-sports')}
            style={({ pressed }) => [styles.pastilleSport, pressed && styles.presse]}>
            <Image source={ImagesSports[s]} style={styles.rondSport} resizeMode="cover" />
            <Text style={styles.pastilleSportTexte} maxFontSizeMultiplier={1.3}>
              {ficheSport(s).nomTuile ?? ficheSport(s).nom}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/mes-sports')}
          style={({ pressed }) => [styles.pastilleSport, styles.pastilleAjout, pressed && styles.presse]}>
          <Text style={styles.pastilleAjoutTexte} maxFontSizeMultiplier={1.3}>
            {sports.length ? '+ Ajouter' : '+ Choisir mes sports'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Appui long sur un pote : lui écrire, signaler sa photo, le signaler */
function optionsPote(p: Pote) {
  vibrer.selection();
  const signalerCible = (cible: 'photo' | 'joueur') =>
    router.push({
      pathname: '/signaler',
      params: {
        cible,
        id: p.id,
        nom: cible === 'photo' ? `La photo de profil de ${p.prenom}` : p.prenom,
        auteur: p.id,
        prenom: p.prenom,
      },
    });
  choisir({
    titre: p.prenom,
    options: [
      { texte: `Écrire à ${p.prenom}`, onPress: () => ecrireA({ autreId: p.id, prenom: p.prenom, connecte: true }) },
      ...(p.photo ? [{ texte: 'Signaler sa photo', destructif: true, onPress: () => signalerCible('photo') }] : []),
      { texte: `Signaler ${p.prenom}`, destructif: !p.photo, onPress: () => signalerCible('joueur') },
    ],
  });
}

function ProfilConnecte({ compte }: { compte: Compte }) {
  const styles = useStyles(creerStyles);
  const [replie, setReplie] = useState(false);
  const [hauteurCarte, setHauteurCarte] = useState(220);
  const { traces, etat } = useHistorique();
  const potes = usePotes();
  const { sports: mesSports } = useMesSports();
  const { jouees } = separerTraces(traces);
  const sports = sportsDuProfil(traces, mesSports);

  function defiler(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const voulu = e.nativeEvent.contentOffset.y > SEUIL_REPLI;
    if (voulu !== replie) setReplie(voulu);
  }

  async function dispo() {
    vibrer.selection();
    const ok = await potes.basculerDispo();
    if (!ok) prevenir('Pas de réseau', 'Ta dispo n’a pas changé.');
  }

  return (
    <View style={[styles.fond, StyleSheet.absoluteFill]}>
      <ScrollView
        onScroll={defiler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contenu, { paddingTop: hauteurCarte + 16 }]}>
        <QuestionRejouer key={potes.question?.sessionId ?? 'aucune'} donnees={potes} />
        <BlocPotes donnees={potes} />
        <BlocCatchs jouees={jouees} etat={etat} />
        <BlocSports sports={sports} />
      </ScrollView>
      <CarteJoueur
        compte={compte}
        sports={sports}
        dispo={potes.dispo}
        onDispo={dispo}
        replie={replie}
        onMesure={setHauteurCarte}
      />
    </View>
  );
}

/** Sans compte : le rond vide, « Me connecter », et le menu (réglages, aide) */
function ProfilInvite() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Ecran titre="Profil" defile action={<BoutonMenu />}>
      <View style={styles.invite}>
        <View style={styles.rondVide}>
          <IconeProfil couleur={c.texteSecondaire} taille={36} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.ligneTitre}>Ton profil</Text>
          <Text style={styles.aide}>Tes potes, tes Catchs et tes sports.</Text>
        </View>
      </View>
      <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
      <View>
        <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
      </View>
    </Ecran>
  );
}

export default function Profil() {
  const { compte, pret } = useCompte();
  if (!pret) return <Ecran titre="Profil" />;
  if (!compte) return <ProfilInvite />;
  return <ProfilConnecte compte={compte} />;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fond },
    flex: { flex: 1, gap: 2 },
    presse: { opacity: 0.85 },
    contenu: {
      paddingHorizontal: Espaces.marge,
      paddingBottom: RESERVE_BAS + BarreNavigation.margeBas + 24,
      gap: 22,
    },
    aide: { ...Polices.texte, fontSize: Tailles.aide, lineHeight: 18, color: c.texteSecondaire },
    aideCentree: { ...Polices.texte, fontSize: Tailles.aide, lineHeight: 18, color: c.texteSecondaire, textAlign: 'center' },

    // La carte de joueur, orange comme l'en-tête d'une session
    carteJoueur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Espaces.marge,
      paddingBottom: 16,
      gap: 12,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      backgroundColor: c.creerDebut,
      experimental_backgroundImage: `linear-gradient(160deg, ${c.creerDebut}, ${c.creerFin})`,
      boxShadow: c.ombreFlottante,
    },
    carteJoueurRepliee: { paddingBottom: 10 },
    identite: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    identiteTextes: { flex: 1, gap: 2 },
    prenom: { fontFamily: Polices.titre, fontSize: Tailles.titreSession, color: c.surCreer },
    prenomReplie: { fontSize: Tailles.accent },
    verifie: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    verifieTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.surCreer },
    joue: { ...Polices.texteDemi, fontSize: Tailles.courant, color: c.surCreer },
    menu: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.voileSurCreer,
    },
    monRond: {
      width: 58,
      height: 58,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surCreer,
      transform: [{ rotate: '-6deg' }],
    },
    monRondPetit: { width: 36, height: 36, borderRadius: 12, transform: [] },
    monRondPhoto: { overflow: 'hidden', backgroundColor: c.beige },
    photo: { width: '100%', height: '100%' },
    rondAvecPhoto: { position: 'relative' },
    badgePhoto: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 26,
      height: 26,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
      borderWidth: 2,
      borderColor: c.surCreer,
    },
    monRondLettre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.creerFin, transform: [{ rotate: '6deg' }] },
    monRondLettrePetite: { fontSize: Tailles.accent, transform: [] },
    interrupteur: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: Espaces.cibleTactile,
      paddingLeft: 16,
      paddingRight: 8,
      borderRadius: Rayons.pilule,
      backgroundColor: c.voileSurCreer,
    },
    interrupteurActif: { backgroundColor: c.surCreer },
    interrupteurTexte: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.surCreer },
    interrupteurTexteActif: { color: c.creerFin },
    glissiere: { width: 46, height: 28, borderRadius: Rayons.pilule, padding: 3, backgroundColor: c.voileSurCreer },
    glissiereActive: { backgroundColor: c.rouge },
    bouleGlissiere: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.surCreer, boxShadow: c.ombrePetite },
    bouleGlissiereActive: { transform: [{ translateX: 18 }] },
    dispoMini: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Rayons.pilule, backgroundColor: c.surCreer },
    dispoMiniTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.creerFin },

    // Les blocs
    bloc: { gap: 10 },
    titreBloc: { ...Polices.texteDemi, fontSize: Tailles.sousTitre, color: c.encre },
    carte: {
      padding: 14,
      gap: 12,
      borderRadius: 18,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombrePetite,
    },
    vide: {
      alignItems: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.trait,
    },
    titreVide: { fontFamily: Polices.titre, fontSize: Tailles.texte, color: c.encre, textAlign: 'center' },
    ligneTitre: { ...Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },

    // Tu rejouerais avec qui ?
    titreQuestion: { fontFamily: Polices.titre, fontSize: Tailles.texte, color: c.encre },
    choixJoueurs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choixJoueur: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: Espaces.cibleTactile - 6,
      paddingLeft: 4,
      paddingRight: 12,
      borderRadius: Rayons.pilule,
      borderWidth: 1.5,
      borderColor: c.trait,
      backgroundColor: c.fond,
    },
    choixJoueurCoche: { backgroundColor: c.encre, borderColor: c.encre },
    choixJoueurTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    choixJoueurTexteCoche: { color: c.surEncre },
    miniRond: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    miniRondTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.surAvatar },
    boutonGauche: { alignSelf: 'flex-start' },

    // Potes
    ronds: { gap: 14, paddingVertical: 6, paddingHorizontal: 2 },
    rondAvecNom: { width: 64, alignItems: 'center', gap: 4 },
    nomRond: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.encre },
    anneauPote: { padding: 3, borderRadius: Rayons.pilule, borderWidth: 2.5, borderColor: 'transparent' },
    anneauDispo: { borderColor: c.rouge },
    rondPote: {
      width: 52,
      height: 52,
      borderRadius: Rayons.pilule,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rondPoteTexte: { fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.surAvatar },
    ligneSession: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingRight: 12,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    vignette: { width: 72, height: 72, backgroundColor: c.fondPhoto },
    quandPote: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },

    // Catchs
    carrousel: { gap: 10, paddingRight: 4 },
    carteCatch: {
      width: 150,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    photoCatch: { width: '100%', height: 90, backgroundColor: c.fondPhoto },
    texteCatch: { padding: 10, gap: 2 },

    // Sports
    pastillesSports: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pastilleSport: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: Espaces.cibleTactile,
      paddingLeft: 4,
      paddingRight: 14,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.carte,
    },
    rondSport: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.fondPhoto },
    pastilleSportTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    pastilleAjout: { paddingLeft: 14, borderStyle: 'dashed' },
    pastilleAjoutTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },

    // Sans compte
    invite: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
    rondVide: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
  });

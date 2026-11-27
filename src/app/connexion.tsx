import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef, type ComponentRef } from 'react';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { IconeFermer, IconeGoogle, IconeRetour } from '@/components/icones';
import { Durees, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { ANNULE, useCompte } from '@/lib/compte';
import { vibrer } from '@/lib/haptics';
import { expliquerEchec } from '@/lib/catch';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Etape = 'choix' | 'email' | 'code' | 'prenom';

/**
 * Connexion, demandée seulement au moment d'agir. Ouverte depuis le bouton Catch avec
 * l'identifiant de la session : une fois connecté, la session est catchée toute seule.
 */
export default function Connexion() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id, pour } = useLocalSearchParams<{ id?: string; pour?: 'publier' }>();
  const { bottom } = useSafeAreaInsets();
  const { sessions, catcher } = useSessions();
  const { compte, envoyerCode, verifierCode, connecterApple, connecterGoogle, enregistrerPrenom } = useCompte();
  const session = sessions.find((s) => s.id === id);

  const [etapeChoisie, setEtape] = useState<Etape>('choix');
  // Dès qu'on est connecté sans prénom, on passe à l'étape « prénom »
  const etape: Etape = compte && !compte.prenom ? 'prenom' : etapeChoisie;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const catchEnCours = useRef(false);
  const [appleDisponible, setAppleDisponible] = useState(false);
  // Sur le site, la page d'invitation garde l'e-mail : Google y demanderait une autre adresse de retour
  const googleDisponible = Platform.OS !== 'web';

  useEffect(() => {
    // Dans Expo Go, Apple connecterait à « Expo Go » et pas à Catch : le bouton n'apparaît que dans la vraie app
    const dansExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (Platform.OS === 'ios' && !dansExpoGo) {
      AppleAuthentication.isAvailableAsync().then(setAppleDisponible, () => {});
    }
  }, []);

  /** Lance une action, affiche son erreur, et dit si elle a réussi. */
  async function essayer(action: () => Promise<string | null>) {
    if (occupe) return false;
    setOccupe(true);
    setErreur(null);
    const resultat = await action();
    setOccupe(false);
    if (resultat === ANNULE) return false;
    if (resultat) {
      setErreur(resultat);
      vibrer.erreur();
      return false;
    }
    return true;
  }

  /** Connecté, prénom connu : on catche la session et on fête ça. */
  async function terminer() {
    if (!session) {
      router.back();
      return;
    }
    // Une seule demande à la fois, même si l'écran se redessine
    if (catchEnCours.current) return;
    catchEnCours.current = true;
    const resultat = await catcher(session.id);
    catchEnCours.current = false;
    if (resultat === 'ok') {
      vibrer.succes();
      router.replace({ pathname: '/catchee/[id]', params: { id: session.id } });
    } else {
      // Connecté, mais le Catch n'a pas pu se faire : on revient sur la session avec l'explication
      router.back();
      expliquerEchec(resultat);
    }
  }

  // Dès qu'on est connecté : il ne manque plus que le prénom, ou plus rien
  useEffect(() => {
    if (compte?.prenom) terminer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compte?.id, compte?.prenom]);

  const emailValide = /^\S+@\S+\.\S+$/.test(email.trim());

  function retour() {
    setErreur(null);
    if (etape === 'email') setEtape('choix');
    else if (etape === 'code') setEtape('email');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const prenomTape = prenom.trim();
  const titreChoix = session ? 'Connecte-toi pour la catcher' : pour === 'publier' ? 'Connecte-toi pour publier' : 'Connecte-toi';
  const texteChoix =
    pour === 'publier'
      ? 'Une seule fois. Ta session part juste après.'
      : session
        ? 'Une seule fois. Après, tu catches en un appui.'
        : 'Une seule fois, en quelques secondes.';
  const titreFin = session ? 'Catch' : pour === 'publier' ? 'Publier' : 'Continuer';

  return (
    <View style={[styles.ecran, !router.canGoBack() && styles.ecranSeul]}>
      {/* Derrière, l'écran d'où l'on vient (la session) reste visible sous un voile ; le toucher ferme */}
      <Animated.View entering={FadeIn.duration(Durees.standard)} style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={[StyleSheet.absoluteFill, styles.voile]}
        />
      </Animated.View>
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={styles.porteFeuille}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          entering={SlideInDown.duration(Durees.emphasized)}
          style={[styles.feuille, { paddingBottom: Math.max(bottom, 16) + 8 }]}>
          <View style={styles.poignee} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={etape === 'choix' || etape === 'prenom' ? 'Fermer' : 'Retour'}
            onPress={retour}
            hitSlop={6}
            style={({ pressed }) => [styles.fermer, pressed && { backgroundColor: c.trait }]}>
            {etape === 'choix' || etape === 'prenom' ? (
              <IconeFermer couleur={c.encre} taille={18} />
            ) : (
              <IconeRetour couleur={c.encre} taille={18} />
            )}
          </Pressable>
          <ScrollView
            contentContainerStyle={styles.contenu}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {etape === 'choix' && (
              <>
                <Text accessibilityRole="header" style={styles.titre}>
                  {titreChoix}
                </Text>
                {session && <EquipeQuiAttend session={session} prenom="" />}
                <Text style={styles.texte}>{texteChoix}</Text>
                <View style={styles.actions}>
                  {appleDisponible && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={Rayons.bouton}
                      style={styles.apple}
                      onPress={() => essayer(connecterApple)}
                    />
                  )}
                  {googleDisponible && (
                    <Bouton
                      titre="Continuer avec Google"
                      variante="secondaire"
                      Icone={IconeGoogle}
                      disabled={occupe}
                      onPress={() => essayer(connecterGoogle)}
                    />
                  )}
                  <Bouton
                    titre="Continuer avec un e-mail"
                    onPress={() => {
                      setErreur(null);
                      setEtape('email');
                    }}
                  />
                </View>
                <Text style={styles.mention}>
                  En continuant, tu acceptes les{' '}
                  <Text accessibilityRole="link" style={styles.lien} onPress={() => router.push('/conditions')}>
                    conditions d’utilisation
                  </Text>{' '}
                  et la{' '}
                  <Text accessibilityRole="link" style={styles.lien} onPress={() => router.push('/confidentialite')}>
                    politique de confidentialité
                  </Text>
                  .
                </Text>
              </>
            )}

            {etape === 'email' && (
              <>
                <Text accessibilityRole="header" style={styles.titre}>
                  Ton e-mail
                </Text>
                <Text style={styles.texte}>On t’envoie un code à 6 chiffres. Pas de mot de passe à retenir.</Text>
                <TextInput
                  style={styles.champ}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="prenom@exemple.be"
                  placeholderTextColor={c.texteSecondaire}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="send"
                  accessibilityLabel="Ton e-mail"
                  onSubmitEditing={async () => {
                    if (emailValide && (await essayer(() => envoyerCode(email.trim())))) setEtape('code');
                  }}
                />
                <Bouton
                  titre={occupe ? 'Envoi…' : 'Recevoir le code'}
                  disabled={!emailValide || occupe}
                  style={(!emailValide || occupe) && styles.inactif}
                  onPress={async () => {
                    if (await essayer(() => envoyerCode(email.trim()))) setEtape('code');
                  }}
                />
              </>
            )}

            {etape === 'code' && (
              <>
                <Text accessibilityRole="header" style={styles.titre}>
                  Ton code
                </Text>
                <Text style={styles.texte}>Envoyé à {email.trim()}. Regarde aussi dans tes indésirables.</Text>
                <CasesCode
                  code={code}
                  faux={!!erreur}
                  onChange={(chiffres) => {
                    setCode(chiffres);
                    if (erreur) setErreur(null);
                    // Le code part tout seul dès qu'il est complet
                    if (chiffres.length === 6) essayer(() => verifierCode(email.trim(), chiffres));
                  }}
                />
                <Bouton
                  titre="Renvoyer le code"
                  variante="lien"
                  disabled={occupe}
                  onPress={() => {
                    setCode('');
                    essayer(() => envoyerCode(email.trim()));
                  }}
                />
              </>
            )}

            {etape === 'prenom' && (
              <>
                <Text accessibilityRole="header" style={styles.titre}>
                  Ton prénom
                </Text>
                {session && <EquipeQuiAttend session={session} prenom={prenomTape} />}
                <Text style={styles.texte}>
                  {session ? 'Ton initiale prend ta place dans l’équipe.' : 'C’est comme ça que les autres joueurs te verront.'}
                </Text>
                <TextInput
                  style={styles.champ}
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholder="Prénom"
                  placeholderTextColor={c.texteSecondaire}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  maxLength={30}
                  autoFocus
                  returnKeyType="done"
                  accessibilityLabel="Ton prénom"
                />
                <Bouton
                  titre={occupe ? 'Un instant…' : titreFin}
                  disabled={prenomTape.length < 2 || occupe}
                  style={(prenomTape.length < 2 || occupe) && styles.inactif}
                  onPress={() => essayer(() => enregistrerPrenom(prenomTape))}
                />
              </>
            )}

            {erreur && (
              <View accessibilityLiveRegion="polite" style={styles.erreur}>
                <Text style={styles.erreurTexte}>{erreur}</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Qui t'attend : un rond par inscrit et un rond en pointillés pour toi, que ton initiale vient remplir
 * quand tu écris ton prénom (finition 2 de la Connexion, choisie par Maxime le 27 novembre).
 */
function EquipeQuiAttend({ session, prenom }: { session: Session; prenom: string }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  const inscrits = session.inscrits.filter((nom) => nom !== 'Toi');
  const autres = inscrits.length - 1;
  const phrase =
    autres > 0
      ? `${session.organisateur} et ${autres} ${autres > 1 ? 'autres' : 'autre'} t’attendent.`
      : `${session.organisateur} t’attend.`;
  return (
    <View style={styles.equipe} accessible accessibilityLabel={phrase}>
      <View style={styles.ronds}>
        {inscrits.slice(0, 11).map((nom, i) => (
          <View key={`${nom}-${i}`} style={[styles.rond, { backgroundColor: teintes[i % 4] }]}>
            <Text style={styles.rondTexte} maxFontSizeMultiplier={1}>
              {nom.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
        <View style={[styles.rondToi, prenom && styles.rondToiPlein]}>
          <Text style={[styles.rondToiTexte, prenom && styles.rondToiTextePlein]} maxFontSizeMultiplier={1}>
            {prenom ? prenom.charAt(0).toUpperCase() : 'Toi'}
          </Text>
        </View>
      </View>
      <Text style={styles.aide}>{phrase}</Text>
    </View>
  );
}

/** Le code en 6 cases, posées sur un champ caché : le clavier du téléphone et le remplissage depuis l'e-mail marchent */
function CasesCode({ code, faux, onChange }: { code: string; faux: boolean; onChange: (code: string) => void }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const champ = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable onPress={() => champ.current?.focus()} accessible={false} style={styles.cases}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.case,
            i < code.length && (faux ? styles.caseFausse : styles.caseRemplie),
            !faux && i === code.length && styles.caseActive,
          ]}>
          <Text style={styles.caseTexte} maxFontSizeMultiplier={1.2}>
            {code[i] ?? ''}
          </Text>
        </View>
      ))}
      <TextInput
        ref={champ}
        value={code}
        onChangeText={(valeur) => onChange(valeur.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        caretHidden
        selectionColor={c.rouge}
        accessibilityLabel="Code à 6 chiffres"
        style={styles.champCache}
      />
    </Pressable>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: 'transparent' },
    // Ouverte directement (lien), sans écran derrière : le fond de l'app plutôt que du noir
    ecranSeul: { backgroundColor: c.fond },
    voile: { backgroundColor: c.voile },
    porteFeuille: { flex: 1, justifyContent: 'flex-end' },
    feuille: {
      maxHeight: '92%',
      paddingTop: 8,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      backgroundColor: c.fond,
      boxShadow: c.ombreVersHaut,
    },
    poignee: { width: 40, height: 5, borderRadius: Rayons.pilule, backgroundColor: c.trait, alignSelf: 'center' },
    fermer: {
      position: 'absolute',
      top: 12,
      right: 14,
      zIndex: 2,
      width: 36,
      height: 36,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    contenu: { paddingHorizontal: Espaces.marge, paddingTop: 14, gap: 12 },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, lineHeight: 28, color: c.encre, paddingRight: 44 },
    texte: { ...Polices.texte, fontSize: Tailles.courant, lineHeight: 22, color: c.texteSecondaire },
    aide: { ...Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    actions: { gap: 10, marginTop: 4 },
    apple: { height: 52 },
    champ: {
      height: 56,
      paddingHorizontal: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.bouton,
      borderWidth: 1.5,
      borderColor: c.encre,
      ...Polices.texteMoyen,
      fontSize: Tailles.accent,
      color: c.encre,
    },
    inactif: { opacity: 0.45 },
    mention: {
      ...Polices.texte,
      fontSize: Tailles.pastille,
      lineHeight: 18,
      color: c.texteSecondaire,
      textAlign: 'center',
    },
    lien: { ...Polices.texteDemi, color: c.rougeTexte },
    erreur: { padding: 12, borderRadius: 14, backgroundColor: c.beige },
    erreurTexte: { ...Polices.texteMoyen, fontSize: Tailles.petit, lineHeight: 20, color: c.encre },

    // L'équipe qui attend
    equipe: { gap: 6 },
    ronds: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
    rond: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    rondTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.surAvatar },
    rondToi: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.rouge,
    },
    rondToiPlein: { borderStyle: 'solid', backgroundColor: c.rouge },
    rondToiTexte: { ...Polices.texteDemi, fontSize: Tailles.micro, color: c.rougeTexte },
    rondToiTextePlein: { fontSize: Tailles.texte, color: c.surRouge },

    // Le code en 6 cases
    cases: { flexDirection: 'row', gap: 8 },
    case: {
      flex: 1,
      height: 58,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.trait,
      backgroundColor: c.carte,
    },
    caseRemplie: { borderColor: c.encre },
    caseFausse: { borderColor: c.encre, backgroundColor: c.beige },
    caseActive: { borderColor: c.rouge, borderWidth: 2 },
    caseTexte: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
    champCache: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  });

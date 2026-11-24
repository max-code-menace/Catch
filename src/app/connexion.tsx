import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
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
import { IconeGoogle, IconeRetour } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { ANNULE, useCompte } from '@/lib/compte';
import { quandPhrase, textePlaces } from '@/lib/formats';
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
    else router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.ecran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.contenu, { paddingBottom: Math.max(bottom, 16) + 8 }]}
        keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etape === 'choix' || etape === 'prenom' ? 'Fermer' : 'Retour'}
          onPress={retour}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, pressed && { backgroundColor: c.beige }]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>

        {session && (
          <View style={styles.rappel}>
            <View style={styles.picto}>
              <PictoSport sport={session.sport} taille={30} />
            </View>
            <View style={styles.rappelTextes}>
              <Text style={styles.rappelTitre} numberOfLines={1}>
                {session.titre} · {quandPhrase(session)}
              </Text>
              <Text style={styles.aide}>{textePlaces(session)}</Text>
            </View>
          </View>
        )}

        {etape === 'choix' && (
          <>
            <Text accessibilityRole="header" style={styles.titre}>
              {session ? 'Connecte-toi pour la catcher' : pour === 'publier' ? 'Connecte-toi pour publier' : 'Connecte-toi'}
            </Text>
            <Text style={styles.texte}>
              {pour === 'publier'
                ? 'Une seule fois. Ta session est publiée juste après.'
                : 'Une seule fois. Ensuite, tu catches en un appui.'}
            </Text>
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
                variante={appleDisponible ? 'secondaire' : 'principal'}
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
            <TextInput
              style={[styles.champ, styles.champCode]}
              value={code}
              onChangeText={(valeur) => {
                const chiffres = valeur.replace(/\D/g, '').slice(0, 6);
                setCode(chiffres);
                // Le code part tout seul dès qu'il est complet
                if (chiffres.length === 6) essayer(() => verifierCode(email.trim(), chiffres));
              }}
              placeholder="000000"
              placeholderTextColor={c.trait}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
              accessibilityLabel="Code à 6 chiffres"
            />
            <Bouton
              titre={occupe ? 'Vérification…' : 'Valider'}
              disabled={code.length !== 6 || occupe}
              style={(code.length !== 6 || occupe) && styles.inactif}
              onPress={() => essayer(() => verifierCode(email.trim(), code))}
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
            <Text style={styles.texte}>C’est comme ça que les autres joueurs te verront.</Text>
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
              titre={occupe ? 'Un instant…' : session ? 'Catch' : 'Continuer'}
              disabled={prenom.trim().length < 2 || occupe}
              style={(prenom.trim().length < 2 || occupe) && styles.inactif}
              onPress={() => essayer(() => enregistrerPrenom(prenom.trim()))}
            />
          </>
        )}

        {erreur && (
          <Text accessibilityLiveRegion="polite" style={styles.erreur}>
            {erreur}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    contenu: { flexGrow: 1, paddingHorizontal: Espaces.marge, paddingTop: 16, gap: 12 },
    retour: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      marginLeft: -4,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    rappel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      marginTop: 4,
      backgroundColor: c.carte,
      borderRadius: Rayons.bouton,
      borderWidth: 1,
      borderColor: c.trait,
    },
    picto: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rappelTextes: { flex: 1, gap: 2 },
    rappelTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    titre: {
      marginTop: 12,
      fontFamily: Polices.titre,
      fontSize: Tailles.titreEcran,
      lineHeight: 34,
      color: c.encre,
    },
    texte: {
      fontFamily: Polices.texte,
      fontSize: Tailles.texte,
      lineHeight: 24,
      color: c.texteSecondaire,
    },
    actions: { gap: 10, marginTop: 12 },
    apple: { height: 52 },
    champ: {
      height: 56,
      marginVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.bouton,
      borderWidth: 1,
      borderColor: c.trait,
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.accent,
      color: c.encre,
    },
    champCode: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, letterSpacing: 8, textAlign: 'center' },
    inactif: { opacity: 0.45 },
    mention: {
      marginTop: 8,
      fontFamily: Polices.texte,
      fontSize: Tailles.aide,
      lineHeight: 20,
      color: c.texteSecondaire,
      textAlign: 'center',
    },
    lien: { fontFamily: Polices.texteDemi, color: c.rougeTexte },
    erreur: {
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.petit,
      lineHeight: 20,
      color: c.rougeTexte,
      textAlign: 'center',
    },
  });

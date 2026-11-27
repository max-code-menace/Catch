// Le compte de l'utilisateur : connexion par e-mail (code à 6 chiffres), avec Apple ou avec Google, via Supabase.
// On ne demande la connexion qu'au moment d'agir (Catch, créer, écrire), jamais pour regarder.
import type { Session as SessionSupabase } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, use, useEffect, useState } from 'react';

import { oublierAppareil } from '@/lib/notifications';
import { lireRetourConnexion, prenomDepuisNom } from '@/lib/retour-connexion';
import { supabase } from '@/lib/supabase';

export type Compte = {
  id: string;
  prenom: string | null;
  /** Date de création du compte (« Membre depuis ») */
  inscritLe: Date | null;
  /** Comment le compte a été vérifié : adresse e-mail confirmée par le code, compte Apple ou compte Google */
  verifiePar: 'email' | 'apple' | 'google' | null;
};

/** Chaque action renvoie `null` si tout va bien, sinon le message à afficher. */
type Resultat = Promise<string | null>;

type Valeur = {
  compte: Compte | null;
  /** Faux tant qu'on ne sait pas encore si quelqu'un est connecté */
  pret: boolean;
  envoyerCode: (email: string) => Resultat;
  verifierCode: (email: string, code: string) => Resultat;
  connecterApple: () => Resultat;
  connecterGoogle: () => Resultat;
  enregistrerPrenom: (prenom: string) => Resultat;
  deconnecter: () => Resultat;
  /** Efface le compte et tout ce qui va avec. Définitif. */
  supprimerCompte: () => Resultat;
};

/** Renvoyé quand la personne ferme la fenêtre de connexion : rien à afficher */
export const ANNULE = 'annule';

const PAS_BRANCHEE = 'La connexion n’est pas encore disponible.';
// Pas de réseau : la demande n'est pas partie
const ECHEC = 'Pas de réseau. Réessaie.';
// Supabase a répondu par une erreur : le téléphone n'y est pour rien
const PANNE = 'Ça coince de notre côté. Réessaie dans un instant.';

function message(erreur: { status?: number; code?: string } | null) {
  if (!erreur) return null;
  if (erreur.status === 429 || erreur.code === 'over_email_send_rate_limit') {
    return 'Trop d’essais. Réessaie dans une minute.';
  }
  if (erreur.code === 'otp_expired' || erreur.code === 'invalid_credentials' || erreur.status === 403) {
    return 'Ce code n’est pas le bon, ou il a expiré.';
  }
  if (erreur.code === 'email_address_invalid' || erreur.code === 'validation_failed') {
    return 'Cette adresse e-mail n’a pas l’air valide.';
  }
  return erreur.status && erreur.status >= 400 ? PANNE : ECHEC;
}

const Contexte = createContext<Valeur | null>(null);

export function FournisseurCompte({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionSupabase | null>(null);
  const [pret, setPret] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setPret(true));
    const { data } = supabase.auth.onAuthStateChange((_evenement, suivante) => setSession(suivante));
    return () => data.subscription.unsubscribe();
  }, []);

  const prenom = session?.user.user_metadata?.prenom;
  const utilisateur = session?.user;
  const compte: Compte | null = utilisateur
    ? {
        id: utilisateur.id,
        prenom: typeof prenom === 'string' && prenom ? prenom : null,
        inscritLe: utilisateur.created_at ? new Date(utilisateur.created_at) : null,
        verifiePar:
          utilisateur.app_metadata?.provider === 'apple'
            ? 'apple'
            : utilisateur.app_metadata?.provider === 'google'
              ? 'google'
              : utilisateur.email_confirmed_at
              ? 'email'
              : null,
      }
    : null;

  async function envoyerCode(email: string) {
    if (!supabase) return PAS_BRANCHEE;
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      return message(error);
    } catch {
      return ECHEC;
    }
  }

  async function verifierCode(email: string, code: string) {
    if (!supabase) return PAS_BRANCHEE;
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      return message(error);
    } catch {
      return ECHEC;
    }
  }

  async function enregistrerPrenom(valeur: string) {
    if (!supabase) return PAS_BRANCHEE;
    try {
      const { error } = await supabase.auth.updateUser({ data: { prenom: valeur } });
      if (error) return message(error);
      // Le compte est relu pour que le prénom s'affiche tout de suite
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      return null;
    } catch {
      return ECHEC;
    }
  }

  async function connecterApple() {
    if (!supabase) return PAS_BRANCHEE;
    try {
      const identite = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!identite.identityToken) return ECHEC;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identite.identityToken,
      });
      if (error) return message(error);
      // Apple ne donne le prénom qu'à la toute première connexion : on le garde
      const donne = identite.fullName?.givenName;
      if (donne) await enregistrerPrenom(donne);
      return null;
    } catch (erreur) {
      // La personne a fermé la fenêtre d'Apple : ce n'est pas une erreur
      if ((erreur as { code?: string }).code === 'ERR_REQUEST_CANCELED') return ANNULE;
      return ECHEC;
    }
  }

  async function connecterGoogle() {
    if (!supabase) return PAS_BRANCHEE;
    try {
      // Adresse de retour vers l'app : catch://connexion-google dans la vraie app, exp://…/--/connexion-google
      // dans Expo Go. Elle doit être dans les « Redirect URLs » de Supabase (Authentication > URL Configuration).
      const retour = Linking.createURL('connexion-google');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: retour, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      });
      if (error) return message(error);
      if (!data?.url) return ECHEC;
      // Fenêtre de Google par-dessus l'app ; elle se ferme toute seule en revenant sur l'adresse de retour
      const resultat = await WebBrowser.openAuthSessionAsync(data.url, retour);
      if (resultat.type !== 'success') return ANNULE;
      const lu = lireRetourConnexion(resultat.url);
      if (lu.type === 'erreur') return lu.code === 'access_denied' ? ANNULE : PANNE;
      if (lu.type === 'vide') return PANNE;
      const { data: connecte, error: erreurSession } = await supabase.auth.setSession({
        access_token: lu.accessToken,
        refresh_token: lu.refreshToken,
      });
      if (erreurSession) return message(erreurSession);
      // Google donne le nom à chaque fois : on n'en tire le prénom que s'il n'y en a pas encore
      const meta = connecte.user?.user_metadata;
      if (meta && !(typeof meta.prenom === 'string' && meta.prenom)) {
        const donne = prenomDepuisNom(meta.given_name) ?? prenomDepuisNom(meta.full_name ?? meta.name);
        if (donne) await enregistrerPrenom(donne);
      }
      return null;
    } catch {
      return ECHEC;
    }
  }

  async function deconnecter() {
    if (!supabase) return PAS_BRANCHEE;
    try {
      // Avant de partir : ce téléphone ne doit plus recevoir les notifications de ce compte
      await oublierAppareil();
      const { error } = await supabase.auth.signOut();
      return message(error);
    } catch {
      return ECHEC;
    }
  }

  async function supprimerCompte() {
    if (!supabase) return PAS_BRANCHEE;
    try {
      // Avant de partir : ce téléphone ne doit plus recevoir les notifications de ce compte
      await oublierAppareil();
      // Sa photo de profil part avec le compte (rien si elle n'existe pas)
      if (session?.user.id) {
        await supabase.storage.from('photos').remove([`${session.user.id}/photo.jpg`]).catch(() => {});
      }
      const { error } = await supabase.rpc('supprimer_mon_compte');
      if (error) return message(error);
      // Le compte n'existe plus côté serveur : on ferme aussi la connexion gardée sur le téléphone
      await supabase.auth.signOut({ scope: 'local' });
      return null;
    } catch {
      return ECHEC;
    }
  }

  return (
    <Contexte
      value={{
        compte,
        pret,
        envoyerCode,
        verifierCode,
        connecterApple,
        connecterGoogle,
        enregistrerPrenom,
        deconnecter,
        supprimerCompte,
      }}>
      {children}
    </Contexte>
  );
}

export function useCompte() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useCompte doit être utilisé dans <FournisseurCompte>');
  return valeur;
}

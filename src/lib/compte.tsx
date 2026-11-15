// Le compte de l'utilisateur : connexion par e-mail (code à 6 chiffres) ou avec Apple, via Supabase.
// On ne demande la connexion qu'au moment d'agir (Catch, créer, écrire), jamais pour regarder.
import type { Session as SessionSupabase } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, use, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Compte = { id: string; prenom: string | null };

/** Chaque action renvoie `null` si tout va bien, sinon le message à afficher. */
type Resultat = Promise<string | null>;

type Valeur = {
  compte: Compte | null;
  /** Faux tant qu'on ne sait pas encore si quelqu'un est connecté */
  pret: boolean;
  envoyerCode: (email: string) => Resultat;
  verifierCode: (email: string, code: string) => Resultat;
  connecterApple: () => Resultat;
  enregistrerPrenom: (prenom: string) => Resultat;
  deconnecter: () => Resultat;
};

/** Renvoyé quand la personne ferme la fenêtre de connexion : rien à afficher */
export const ANNULE = 'annule';

const PAS_BRANCHEE = 'La connexion n’est pas encore disponible.';
const ECHEC = 'Ça n’a pas marché. Vérifie ta connexion et réessaie.';

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
  return ECHEC;
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
  const compte: Compte | null = session
    ? { id: session.user.id, prenom: typeof prenom === 'string' && prenom ? prenom : null }
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

  async function deconnecter() {
    if (!supabase) return PAS_BRANCHEE;
    try {
      const { error } = await supabase.auth.signOut();
      return message(error);
    } catch {
      return ECHEC;
    }
  }

  return (
    <Contexte
      value={{ compte, pret, envoyerCode, verifierCode, connecterApple, enregistrerPrenom, deconnecter }}>
      {children}
    </Contexte>
  );
}

export function useCompte() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useCompte doit être utilisé dans <FournisseurCompte>');
  return valeur;
}

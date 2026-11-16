// Notifications push (voir docs/produit.md) : jamais demandées au lancement, seulement après un Catch
// ou depuis Profil > Notifications. L'envoi se fait côté serveur (supabase/migrations).
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Sport } from '@/donnees/pictos';
import { supabase } from '@/lib/supabase';

/** `a-demander` : la question n'a pas encore été posée. `indisponible` : navigateur, simulateur, Expo Go sur Android. */
export type Permission = 'accordee' | 'refusee' | 'a-demander' | 'indisponible';

export type Reglages = {
  rappel: boolean;
  message: boolean;
  /** Une session où je suis inscrit change d'horaire ou de lieu, ou est annulée */
  changement: boolean;
  nouvelleSession: boolean;
  sports: Sport[];
};

export const REGLAGES_PAR_DEFAUT: Reglages = {
  rappel: true,
  message: true,
  changement: true,
  nouvelleSession: false,
  sports: [],
};

/** Les deux réponses du rappel 3h avant */
export const ACTION_VIENS = 'viens';
export const ACTION_PEUX_PLUS = 'peux-plus';

const possible = Platform.OS !== 'web' && Device.isDevice;

/** Jeton de ce téléphone, une fois enregistré */
let jeton: string | null = null;

if (possible) {
  // App ouverte : la notification s'affiche quand même en bandeau
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Déclare les boutons du rappel : « Je viens » / « Je ne peux plus ». */
export async function preparerNotifications() {
  if (!possible) return;
  try {
    await Notifications.setNotificationCategoryAsync('rappel', [
      { identifier: ACTION_VIENS, buttonTitle: 'Je viens', options: { opensAppToForeground: false } },
      { identifier: ACTION_PEUX_PLUS, buttonTitle: 'Je ne peux plus', options: { opensAppToForeground: true } },
    ]);
  } catch {
    // Sans les boutons, le rappel reste utile : on touche la notification
  }
}

export async function permissionNotifications(): Promise<Permission> {
  if (!possible) return 'indisponible';
  try {
    const droit = await Notifications.getPermissionsAsync();
    if (droit.granted) return 'accordee';
    return droit.canAskAgain ? 'a-demander' : 'refusee';
  } catch {
    return 'indisponible';
  }
}

/**
 * Rattache ce téléphone au compte connecté pour qu'il reçoive les notifications.
 * `demander` : poser la question du système si elle ne l'a pas encore été.
 */
export async function activerNotifications(demander: boolean): Promise<Permission> {
  if (!possible || !supabase) return 'indisponible';
  try {
    let droit = await Notifications.getPermissionsAsync();
    if (!droit.granted && demander && droit.canAskAgain) {
      droit = await Notifications.requestPermissionsAsync();
    }
    if (!droit.granted) return droit.canAskAgain ? 'a-demander' : 'refusee';
    const { data } = await Notifications.getExpoPushTokenAsync();
    const { error } = await supabase.rpc('enregistrer_appareil', {
      p_jeton: data,
      p_plateforme: Platform.OS,
    });
    if (error) return 'indisponible';
    jeton = data;
    return 'accordee';
  } catch {
    // Pas de jeton possible ici (Expo Go sur Android, pas de réseau…)
    return 'indisponible';
  }
}

/** À la déconnexion : ce téléphone ne reçoit plus rien pour ce compte. */
export async function oublierAppareil() {
  if (!jeton || !supabase) return;
  try {
    await supabase.rpc('oublier_appareil', { p_jeton: jeton });
  } catch {
    // Tant pis : le jeton sera rattaché au prochain compte connecté
  }
  jeton = null;
}

export async function lireReglages(): Promise<Reglages | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reglages_notifications')
      .select('rappel, message, changement, nouvelle_session, sports')
      .maybeSingle();
    if (error) return null;
    if (!data) return REGLAGES_PAR_DEFAUT;
    return {
      rappel: data.rappel,
      message: data.message,
      changement: data.changement,
      nouvelleSession: data.nouvelle_session,
      sports: data.sports as Sport[],
    };
  } catch {
    return null;
  }
}

/** Renvoie `false` si les réglages n'ont pas pu être enregistrés. */
export async function enregistrerReglages(joueurId: string, reglages: Reglages) {
  if (!supabase) return false;
  const valeurs = {
    rappel: reglages.rappel,
    message: reglages.message,
    changement: reglages.changement,
    nouvelle_session: reglages.nouvelleSession,
    sports: reglages.sports,
  };
  try {
    const modif = await supabase
      .from('reglages_notifications')
      .update(valeurs)
      .eq('joueur_id', joueurId)
      .select('joueur_id');
    if (modif.error) return false;
    if (modif.data.length > 0) return true;
    // Première fois : la ligne n'existe pas encore
    const ajout = await supabase.from('reglages_notifications').insert(valeurs);
    return !ajout.error;
  } catch {
    return false;
  }
}

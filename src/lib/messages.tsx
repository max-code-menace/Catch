// Messagerie interne : une conversation par session, réservée à ses inscrits (voir docs/produit.md).
import { createContext, use, useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import type { Sport } from '@/donnees/pictos';
import type { Coordonnees } from '@/donnees/sessions';
import { useCompte } from '@/lib/compte';
import { supabase } from '@/lib/supabase';

export type Conversation = {
  /** Une conversation = une session : même identifiant */
  id: string;
  titre: string;
  sport: Sport;
  lieu: string;
  commune: string;
  position: Coordonnees;
  debut: Date;
  fin: Date;
  /** Quand je me suis inscrit : c'est le début de la conversation pour moi */
  inscritLe: Date;
  inscrits: number;
  dernier: { texte: string; date: Date; prenom: string; deMoi: boolean } | null;
  nonLus: number;
};

/** Une conversation privée : à deux, ouverte depuis une session (l'organisateur, ou un coéquipier). */
export type ConversationPrivee = {
  id: string;
  autreId: string;
  /** Prénom de l'autre personne */
  prenom: string;
  /** La session où on s'est croisés, si elle existe encore */
  sessionId: string | null;
  /** Titre et sport de cette session, recopiés à l'ouverture (« Foot à 5 ») */
  sujet: string | null;
  sport: Sport | null;
  creeLe: Date;
  dernier: { texte: string; date: Date; deMoi: boolean } | null;
  nonLus: number;
};

/** De quel fil on parle : le groupe d'une session, ou une conversation privée. */
export type Fil = { type: 'session' | 'prive'; id: string };

export type Message = {
  id: string;
  auteurId: string;
  prenom: string;
  texte: string;
  date: Date;
  /** En cours d'envoi : affiché tout de suite, confirmé ensuite par le serveur */
  enAttente?: boolean;
};

type Valeur = {
  conversations: Conversation[];
  /** Les conversations privées, la plus récemment active en premier (y compris celles encore vides) */
  prives: ConversationPrivee[];
  /** `erreur` : la lecture a échoué et il n'y a rien à montrer */
  etat: 'chargement' | 'pretes' | 'erreur';
  /** Total des messages non lus (groupes + privés), pour la pastille de l'onglet */
  nonLus: number;
  /** Conversations avec du non lu, par espace (pour les points sur « Groupes » et « Privés ») */
  nonLusGroupes: number;
  nonLusPrives: number;
  /** Relit les conversations ; renvoie `false` si la lecture a échoué (pas de réseau) */
  recharger: () => Promise<boolean>;
  /** J'ai ouvert cette conversation : tout est lu */
  marquerLue: (id: string) => void;
  marquerPriveLue: (id: string) => void;
};

type LignePrivee = {
  id: string;
  autre_id: string;
  autre_prenom: string | null;
  session_id: string | null;
  sujet: string | null;
  sport: Sport | null;
  cree_le: string;
  dernier_texte: string | null;
  dernier_le: string | null;
  dernier_auteur: string | null;
  non_lus: number;
};

type LigneConversation = {
  session_id: string;
  titre: string;
  sport: Sport;
  lieu: string;
  commune: string;
  lat: number;
  lng: number;
  debut: string;
  fin: string;
  inscrit_le: string;
  inscrits: number;
  dernier_texte: string | null;
  dernier_le: string | null;
  dernier_auteur: string | null;
  dernier_prenom: string | null;
  non_lus: number;
};

const Contexte = createContext<Valeur | null>(null);

export function FournisseurMessages({ children }: { children: React.ReactNode }) {
  const { compte } = useCompte();
  const moi = compte?.id ?? null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [prives, setPrives] = useState<ConversationPrivee[]>([]);
  const [etat, setEtat] = useState<Valeur['etat']>('chargement');

  const recharger = useCallback(async () => {
    if (!supabase || !moi) {
      setConversations([]);
      setPrives([]);
      setEtat('pretes');
      return true;
    }
    try {
      const [groupes, privees] = await Promise.all([
        supabase.from('conversations').select('*'),
        supabase.from('conversations_privees').select('*'),
      ]);
      const { data, error } = groupes;
      if (error) throw error;
      if (privees.error) throw privees.error;
      const lues = (data as LigneConversation[]).map(
        (l): Conversation => ({
          id: l.session_id,
          titre: l.titre,
          sport: l.sport,
          lieu: l.lieu,
          commune: l.commune,
          position: { latitude: l.lat, longitude: l.lng },
          debut: new Date(l.debut),
          fin: new Date(l.fin),
          inscritLe: new Date(l.inscrit_le),
          inscrits: l.inscrits,
          dernier: l.dernier_le
            ? {
                texte: l.dernier_texte ?? '',
                date: new Date(l.dernier_le),
                prenom: l.dernier_prenom ?? '',
                deMoi: l.dernier_auteur === moi,
              }
            : null,
          nonLus: l.non_lus,
        }),
      );
      // La plus récemment active en premier ; sans message, c'est la date d'inscription qui compte
      lues.sort(
        (a, b) => (b.dernier?.date ?? b.inscritLe).getTime() - (a.dernier?.date ?? a.inscritLe).getTime(),
      );
      const luesPrivees = (privees.data as LignePrivee[]).map(
        (l): ConversationPrivee => ({
          id: l.id,
          autreId: l.autre_id,
          prenom: l.autre_prenom ?? '',
          sessionId: l.session_id,
          sujet: l.sujet,
          sport: l.sport,
          creeLe: new Date(l.cree_le),
          dernier: l.dernier_le
            ? { texte: l.dernier_texte ?? '', date: new Date(l.dernier_le), deMoi: l.dernier_auteur === moi }
            : null,
          nonLus: l.non_lus,
        }),
      );
      luesPrivees.sort(
        (a, b) => (b.dernier?.date ?? b.creeLe).getTime() - (a.dernier?.date ?? a.creeLe).getTime(),
      );
      setConversations(lues);
      setPrives(luesPrivees);
      setEtat('pretes');
      return true;
    } catch {
      setEtat((avant) => (avant === 'pretes' ? 'pretes' : 'erreur'));
      return false;
    }
  }, [moi]);

  // À la connexion, puis chaque fois que l'app revient à l'écran
  useEffect(() => {
    Promise.resolve().then(recharger);
    if (Platform.OS === 'web') return;
    const ecoute = AppState.addEventListener('change', (etatApp) => {
      if (etatApp === 'active') recharger();
    });
    return () => ecoute.remove();
  }, [recharger]);

  function marquerLue(id: string) {
    if (!supabase || !moi) return;
    setConversations((liste) => liste.map((c) => (c.id === id ? { ...c, nonLus: 0 } : c)));
    supabase
      .from('lectures')
      .upsert({ session_id: id, joueur_id: moi, lu_le: new Date().toISOString() })
      .then(
        () => {},
        () => {},
      );
  }

  function marquerPriveLue(id: string) {
    if (!supabase || !moi) return;
    setPrives((liste) => liste.map((c) => (c.id === id ? { ...c, nonLus: 0 } : c)));
    supabase
      .from('lectures_privees')
      .upsert({ prive_id: id, joueur_id: moi, lu_le: new Date().toISOString() })
      .then(
        () => {},
        () => {},
      );
  }

  const nonLusGroupes = conversations.filter((c) => c.nonLus > 0).length;
  const nonLusPrives = prives.filter((c) => c.nonLus > 0).length;

  return (
    <Contexte
      value={{
        conversations,
        prives,
        etat,
        nonLus:
          conversations.reduce((total, c) => total + c.nonLus, 0) + prives.reduce((total, c) => total + c.nonLus, 0),
        nonLusGroupes,
        nonLusPrives,
        recharger,
        marquerLue,
        marquerPriveLue,
      }}>
      {children}
    </Contexte>
  );
}

export function useMessages() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useMessages doit être utilisé dans <FournisseurMessages>');
  return valeur;
}

type LigneMessage = {
  id: string;
  auteur_id: string;
  texte: string;
  cree_le: string;
  auteur: { prenom: string } | null;
};

function lire(ligne: LigneMessage): Message {
  return {
    id: ligne.id,
    auteurId: ligne.auteur_id,
    prenom: ligne.auteur?.prenom ?? '',
    texte: ligne.texte,
    date: new Date(ligne.cree_le),
  };
}

const CHAMPS = 'id, auteur_id, texte, cree_le, auteur:profils(prenom)';

/** Table et colonne de chaque sorte de fil */
function tableDu(fil: Fil) {
  return fil.type === 'session'
    ? { table: 'messages', colonne: 'session_id' }
    : { table: 'messages_prives', colonne: 'prive_id' };
}

/**
 * Les 200 derniers messages d'un fil, du plus ancien au plus récent. `null` si la lecture échoue.
 * Avec `apres` : seulement ceux arrivés depuis (quand un message arrive, on ne relit pas tout).
 */
export async function lireFil(fil: Fil, apres?: Date): Promise<Message[] | null> {
  if (!supabase) return null;
  const { table, colonne } = tableDu(fil);
  try {
    let requete = supabase.from(table).select(CHAMPS).eq(colonne, fil.id);
    if (apres) requete = requete.gt('cree_le', apres.toISOString());
    const { data, error } = await requete.order('cree_le', { ascending: false }).limit(200);
    if (error) return null;
    return (data as unknown as LigneMessage[]).map(lire).reverse();
  } catch {
    return null;
  }
}

/** Envoie un message. Renvoie le message enregistré, ou `null` si l'envoi a échoué. */
export async function envoyerDansFil(fil: Fil, texte: string): Promise<Message | null> {
  if (!supabase) return null;
  const { table, colonne } = tableDu(fil);
  try {
    const { data, error } = await supabase
      .from(table)
      .insert({ [colonne]: fil.id, texte })
      .select(CHAMPS)
      .single();
    if (error || !data) return null;
    return lire(data as unknown as LigneMessage);
  } catch {
    return null;
  }
}

/** Prévient dès qu'un message arrive dans ce fil. Renvoie de quoi arrêter l'écoute. */
export function ecouterFil(fil: Fil, quandCaArrive: () => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const { table, colonne } = tableDu(fil);
  const canal = client
    .channel(`${table}-${fil.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `${colonne}=eq.${fil.id}` }, quandCaArrive)
    .subscribe();
  return () => {
    client.removeChannel(canal);
  };
}

/**
 * Ouvre (ou retrouve) une conversation privée avec quelqu'un. `sessionId` : la session d'où on écrit
 * (obligatoire pour écrire à un organisateur sans avoir catché).
 * Renvoie l'identifiant de la conversation, `interdit` (blocage, ou personne jamais croisée),
 * `limite` (20 nouvelles conversations par 24 h) ou `erreur` (pas de réseau).
 */
export async function ouvrirPrive(autreId: string, sessionId?: string): Promise<{ id: string } | 'interdit' | 'limite' | 'erreur'> {
  if (!supabase) return 'erreur';
  try {
    const { data, error } = await supabase.rpc('ouvrir_prive', { p_autre: autreId, p_session: sessionId ?? null });
    if (error) {
      if (error.message?.includes('limite_prives')) return 'limite';
      if (error.message?.includes('interdit')) return 'interdit';
      return 'erreur';
    }
    return typeof data === 'string' ? { id: data } : 'erreur';
  } catch {
    return 'erreur';
  }
}

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

/** « 19h02 » aujourd'hui, « Hier », « Lun. » cette semaine, sinon « 12/11 ». */
export function quandMessage(date: Date, maintenant = new Date()) {
  const jour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ecart = Math.round((jour(maintenant) - jour(date)) / 86_400_000);
  if (ecart <= 0) return `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  if (ecart === 1) return 'Hier';
  if (ecart < 7) return JOURS[date.getDay()];
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

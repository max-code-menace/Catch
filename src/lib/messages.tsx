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
  /** `erreur` : la lecture a échoué et il n'y a rien à montrer */
  etat: 'chargement' | 'pretes' | 'erreur';
  /** Total des messages non lus, pour la pastille de l'onglet */
  nonLus: number;
  /** Relit les conversations ; renvoie `false` si la lecture a échoué (pas de réseau) */
  recharger: () => Promise<boolean>;
  /** J'ai ouvert cette conversation : tout est lu */
  marquerLue: (id: string) => void;
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
  const [etat, setEtat] = useState<Valeur['etat']>('chargement');

  const recharger = useCallback(async () => {
    if (!supabase || !moi) {
      setConversations([]);
      setEtat('pretes');
      return true;
    }
    try {
      const { data, error } = await supabase.from('conversations').select('*');
      if (error) throw error;
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
      setConversations(lues);
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

  return (
    <Contexte
      value={{
        conversations,
        etat,
        nonLus: conversations.reduce((total, c) => total + c.nonLus, 0),
        recharger,
        marquerLue,
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

/** Les 200 derniers messages d'une conversation, du plus ancien au plus récent. `null` si la lecture échoue. */
export async function lireMessages(sessionId: string): Promise<Message[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(CHAMPS)
      .eq('session_id', sessionId)
      .order('cree_le', { ascending: false })
      .limit(200);
    if (error) return null;
    return (data as unknown as LigneMessage[]).map(lire).reverse();
  } catch {
    return null;
  }
}

/** Envoie un message. Renvoie le message enregistré, ou `null` si l'envoi a échoué. */
export async function envoyerMessage(sessionId: string, texte: string): Promise<Message | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, texte })
      .select(CHAMPS)
      .single();
    if (error || !data) return null;
    return lire(data as unknown as LigneMessage);
  } catch {
    return null;
  }
}

/** Prévient dès qu'un message arrive dans cette conversation. Renvoie de quoi arrêter l'écoute. */
export function ecouterMessages(sessionId: string, quandCaArrive: () => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const canal = client
    .channel(`messages-${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
      quandCaArrive,
    )
    .subscribe();
  return () => {
    client.removeChannel(canal);
  };
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

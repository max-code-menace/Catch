// Les potes : on le devient quand deux personnes ont choisi, après une session, de rejouer ensemble.
// Tout passe par des fonctions de la base (migration 20261122010000_potes.sql) : on ne voit jamais
// qui nous a choisis ni qui ne nous a pas choisis, seulement ses potes, leur semaine et leur « dispo ce soir ».
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Sport } from '@/donnees/pictos';
import { useCompte } from '@/lib/compte';
import { supabase } from '@/lib/supabase';

export type Pote = { id: string; prenom: string; dispo: boolean; photo: string | null };

/** Une session d'un pote dans les 7 prochains jours */
export type SessionPote = {
  poteId: string;
  sessionId: string;
  sport: Sport;
  titre: string;
  lieu: string;
  debut: Date;
  fin: Date;
  /** C'est lui qui organise */
  organise: boolean;
  joueurs: number;
  inscrits: number;
  /** J'y suis aussi */
  jYSuis: boolean;
};

/** « Tu rejouerais avec qui ? » : la dernière session terminée où il reste des joueurs à qui répondre */
export type QuestionRejouer = {
  sessionId: string;
  sport: Sport;
  titre: string;
  lieu: string;
  fin: Date;
  joueurs: { id: string; prenom: string }[];
};

type LignePote = { id: string; prenom: string; dispo: boolean };
type LigneSemaine = {
  pote_id: string;
  session_id: string;
  sport: Sport;
  titre: string;
  lieu: string;
  debut: string;
  fin: string;
  organise: boolean;
  joueurs: number;
  inscrits: number;
  j_y_suis: boolean;
};
type LigneQuestion = {
  session_id: string;
  sport: Sport;
  titre: string;
  lieu: string;
  fin: string;
  joueurs: { id: string; prenom: string }[];
};

export async function lireQuestion(): Promise<QuestionRejouer | null | 'erreur'> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('question_rejouer');
    if (error) return 'erreur';
    const q = ((data ?? []) as LigneQuestion[])[0];
    if (!q) return null;
    return {
      sessionId: q.session_id,
      sport: q.sport,
      titre: q.titre,
      lieu: q.lieu,
      fin: new Date(q.fin),
      joueurs: (q.joueurs ?? []).map((j) => ({ id: j.id, prenom: j.prenom || 'Joueur' })),
    };
  } catch {
    return 'erreur';
  }
}

/** Enregistre ses choix. Renvoie les nouveaux potes (ceux qui nous avaient déjà choisis), ou `null` sans réseau. */
export async function repondre(sessionId: string, joueurs: string[]): Promise<{ id: string; prenom: string }[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('repondre_rejouer', { p_session: sessionId, p_joueurs: joueurs });
    if (error) return null;
    return (data ?? []) as { id: string; prenom: string }[];
  } catch {
    return null;
  }
}

/** « Je suis dispo ce soir » (jusqu'à minuit) ou plus dispo. Renvoie le nouvel état, ou `null` sans réseau. */
export async function reglerDispo(dispo: boolean): Promise<boolean | null> {
  if (!supabase) return null;
  try {
    const { error } = await supabase.rpc('regler_dispo', { p_dispo: dispo });
    return error ? null : dispo;
  } catch {
    return null;
  }
}

async function lirePotes() {
  if (!supabase) return { potes: [], semaine: [], dispo: false, question: null };
  const [potes, semaine, dispo, question, photos] = await Promise.all([
    supabase.rpc('mes_potes'),
    supabase.rpc('semaine_des_potes'),
    supabase.rpc('ma_dispo'),
    lireQuestion(),
    supabase.rpc('photos_des_potes'),
  ]);
  const photoDe = new Map(((photos.data ?? []) as { id: string; photo: string }[]).map((p) => [p.id, p.photo]));
  if (potes.error || semaine.error) return null;
  return {
    potes: ((potes.data ?? []) as LignePote[]).map((p) => ({
      id: p.id,
      prenom: p.prenom || 'Pote',
      dispo: p.dispo,
      photo: photoDe.get(p.id) ?? null,
    })),
    semaine: ((semaine.data ?? []) as LigneSemaine[]).map(
      (s): SessionPote => ({
        poteId: s.pote_id,
        sessionId: s.session_id,
        sport: s.sport,
        titre: s.titre,
        lieu: s.lieu,
        debut: new Date(s.debut),
        fin: new Date(s.fin),
        organise: s.organise,
        joueurs: s.joueurs,
        inscrits: s.inscrits,
        jYSuis: s.j_y_suis,
      }),
    ),
    dispo: !dispo.error && !!dispo.data,
    question: question === 'erreur' ? null : question,
  };
}

/** Potes, leur semaine, ma dispo et la question en attente : relus à chaque retour sur le Profil. */
export function usePotes() {
  const { compte } = useCompte();
  const moi = compte?.id ?? null;
  const [potes, setPotes] = useState<Pote[]>([]);
  const [semaine, setSemaine] = useState<SessionPote[]>([]);
  const [dispo, setDispo] = useState(false);
  const [question, setQuestion] = useState<QuestionRejouer | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!moi) return;
      let actif = true;
      lirePotes()
        .then((lu) => {
          if (!actif || !lu) return;
          setPotes(lu.potes);
          setSemaine(lu.semaine);
          setDispo(lu.dispo);
          setQuestion(lu.question);
        })
        .catch(() => {});
      return () => {
        actif = false;
      };
    }, [moi]),
  );

  return {
    potes: moi ? potes : [],
    semaine: moi ? semaine : [],
    dispo: moi ? dispo : false,
    question: moi ? question : null,
    /** Change tout de suite à l'écran, puis demande à la base ; revient en arrière si ça échoue */
    basculerDispo: async () => {
      const voulu = !dispo;
      setDispo(voulu);
      const resultat = await reglerDispo(voulu);
      if (resultat === null) setDispo(!voulu);
      return resultat !== null;
    },
  };
}

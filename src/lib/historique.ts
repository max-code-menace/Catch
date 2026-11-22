// Mon historique : toutes les sessions où je suis (ou j'étais) inscrit, passées comprises.
// Les règles de la base ne laissent lire que ses propres sessions. Le ménage automatique efface
// les sessions 30 jours après leur fin : l'historique ne remonte donc pas plus loin.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Sport } from '@/donnees/pictos';
import { useCompte } from '@/lib/compte';
import type { Trace } from '@/lib/profil';
import { useSessions } from '@/lib/sessions';
import { supabase } from '@/lib/supabase';

type Ligne = {
  sessions: {
    id: string;
    sport: Sport;
    titre: string;
    lieu: string;
    debut: string;
    fin: string;
    organisateur_id: string;
    annulee_le: string | null;
  } | null;
};

export type EtatHistorique = 'chargement' | 'pret' | 'erreur';

async function lireHistorique(moi: string): Promise<Trace[] | null> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('participations')
      .select('sessions!inner(id, sport, titre, lieu, debut, fin, organisateur_id, annulee_le)')
      .eq('joueur_id', moi)
      .returns<Ligne[]>();
    if (error || !data) return null;
    return data
      .map((ligne) => ligne.sessions)
      .filter((s) => s !== null && !s.annulee_le)
      .map((s) => ({
        id: s!.id,
        sport: s!.sport,
        titre: s!.titre,
        lieu: s!.lieu,
        debut: new Date(s!.debut),
        fin: new Date(s!.fin),
        organise: s!.organisateur_id === moi,
      }));
  } catch {
    return null;
  }
}

/** Relu à chaque retour sur l'onglet, et quand les sessions de la carte changent (Catch, annulation). */
export function useHistorique() {
  const { compte } = useCompte();
  const { sessions } = useSessions();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [etat, setEtat] = useState<EtatHistorique>('chargement');
  const moi = compte?.id ?? null;
  // Change quand je catche ou quitte une session : on relit alors l'historique
  const signature = moi
    ? sessions
        .filter((s) => s.idsInscrits.includes(moi))
        .map((s) => `${s.id}${s.debut.getTime()}`)
        .join(',')
    : '';

  useFocusEffect(
    useCallback(() => {
      if (!moi) return;
      let actif = true;
      lireHistorique(moi).then((lues) => {
        if (!actif) return;
        if (lues) {
          setTraces(lues);
          setEtat('pret');
        } else {
          setEtat((avant) => (avant === 'pret' ? 'pret' : 'erreur'));
        }
      });
      return () => {
        actif = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moi, signature]),
  );

  return { traces: moi ? traces : [], etat };
}

// Signaler, bloquer, débloquer. Les signalements sont lus par l'équipe sur le site Supabase, jamais par l'app.
import { Alert, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type Cible = 'session' | 'joueur' | 'message';
export type Motif = 'comportement' | 'contenu' | 'faux' | 'danger' | 'autre';

export const MOTIFS: { valeur: Motif; titre: string; detail: string }[] = [
  { valeur: 'comportement', titre: 'Comportement déplacé', detail: 'Harcèlement, insultes, propos blessants' },
  { valeur: 'contenu', titre: 'Contenu inapproprié', detail: 'Message ou description choquants' },
  { valeur: 'faux', titre: 'Fausse session ou arnaque', detail: 'Session qui n’existe pas, demande d’argent' },
  { valeur: 'danger', titre: 'Je me sens en danger', detail: 'Menace, lieu ou situation dangereuse' },
  { valeur: 'autre', titre: 'Autre chose', detail: 'Un problème qui n’est pas dans la liste' },
];

const ECHEC = 'Ça n’a pas marché. Vérifie ta connexion et réessaie.';

/** Chaque action renvoie `null` si tout va bien, sinon le message à afficher. */
type Resultat = Promise<string | null>;

export async function signaler(cible: Cible, cibleId: string, motif: Motif, details: string): Resultat {
  if (!supabase) return ECHEC;
  try {
    const propre = details.trim();
    const { error } = await supabase
      .from('signalements')
      .insert({ cible, cible_id: cibleId, motif, details: propre || null });
    // 23505 : déjà signalé par ce compte. Pour la personne c'est la même chose : c'est transmis.
    if (error && error.code !== '23505') return ECHEC;
    return null;
  } catch {
    return ECHEC;
  }
}

export async function bloquer(id: string): Resultat {
  if (!supabase) return ECHEC;
  try {
    const { error } = await supabase.from('blocages').insert({ bloque_id: id });
    if (error && error.code !== '23505') return ECHEC;
    return null;
  } catch {
    return ECHEC;
  }
}

export async function debloquer(id: string): Resultat {
  if (!supabase) return ECHEC;
  try {
    const { error } = await supabase.from('blocages').delete().eq('bloque_id', id);
    return error ? ECHEC : null;
  } catch {
    return ECHEC;
  }
}

export type Bloque = { id: string; prenom: string };

/** Les personnes que j'ai bloquées, ou `null` si la lecture a échoué. */
export async function lireBloques(): Promise<Bloque[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('blocages')
      .select('bloque_id, profils:bloque_id(prenom)')
      .order('cree_le', { ascending: false });
    if (error || !data) return null;
    return (data as unknown as { bloque_id: string; profils: { prenom: string } | null }[]).map((ligne) => ({
      id: ligne.bloque_id,
      prenom: ligne.profils?.prenom || 'Quelqu’un',
    }));
  } catch {
    return null;
  }
}

/** Une question avec deux réponses. `Alert` ne marche pas sur le web : on y utilise la fenêtre du navigateur. */
export function demander({
  titre,
  texte,
  confirmer,
  destructif = false,
  onConfirmer,
}: {
  titre: string;
  texte: string;
  confirmer: string;
  destructif?: boolean;
  onConfirmer: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titre}\n\n${texte}`)) onConfirmer();
    return;
  }
  Alert.alert(titre, texte, [
    { text: 'Annuler', style: 'cancel' },
    { text: confirmer, style: destructif ? 'destructive' : 'default', onPress: onConfirmer },
  ]);
}

// Signaler, bloquer, débloquer. Les signalements sont lus par l'équipe sur le site Supabase, jamais par l'app.
import { supabase } from '@/lib/supabase';

export type Cible = 'session' | 'joueur' | 'message' | 'photo';
export type Motif = 'comportement' | 'contenu' | 'faux' | 'danger' | 'autre';

export const MOTIFS: { valeur: Motif; titre: string; detail: string }[] = [
  { valeur: 'comportement', titre: 'Comportement déplacé', detail: 'Harcèlement, insultes, propos blessants' },
  { valeur: 'contenu', titre: 'Contenu inapproprié', detail: 'Message ou description choquants' },
  { valeur: 'faux', titre: 'Fausse session ou arnaque', detail: 'Session qui n’existe pas, demande d’argent' },
  { valeur: 'danger', titre: 'Je me sens en danger', detail: 'Menace, lieu ou situation dangereuse' },
  { valeur: 'autre', titre: 'Autre chose', detail: 'Un problème qui n’est pas dans la liste' },
];

/** Pour une photo de profil : les mêmes motifs côté base, des mots qui parlent d'une photo */
export const MOTIFS_PHOTO: { valeur: Motif; titre: string; detail: string }[] = [
  { valeur: 'contenu', titre: 'Photo choquante', detail: 'Nudité, violence, symbole haineux' },
  { valeur: 'faux', titre: 'Ce n’est pas cette personne', detail: 'Photo volée, célébrité, faux profil' },
  { valeur: 'comportement', titre: 'Photo blessante', detail: 'Moquerie, provocation, contenu qui vise quelqu’un' },
  { valeur: 'autre', titre: 'Autre chose', detail: 'Un problème qui n’est pas dans la liste' },
];

const ECHEC = 'Pas de réseau. Réessaie.';

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

// Les questions de confirmation vivent dans lib/alerte ; on les garde accessibles d'ici pour les écrans de modération
export { demander } from '@/lib/alerte';

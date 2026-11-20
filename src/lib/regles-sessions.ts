// Règles du Catch, de la création et de l'annulation, côté app.
// Calcul pur (pas d'import de code) pour pouvoir le tester avec `npm test` (tests/regles-sessions.test.mjs).
// Les règles qui comptent vraiment (place libre, limites) sont vérifiées par la base : voir supabase/tests/.
import type { Session } from '@/donnees/sessions';
import type { NouvelleSession, ResultatCatch } from '@/lib/sessions';

/**
 * Réponse de la fonction `catcher` de la base → ce que l'app en fait.
 * `introuvable` (session supprimée, ou organisateur qui nous a bloqués) se présente comme « terminée ».
 * Une panne ou une réponse inconnue n'est jamais prise pour un Catch réussi.
 */
export function interpreterCatch(reponse: unknown, enErreur: boolean): ResultatCatch {
  if (enErreur) return 'erreur';
  if (reponse === 'ok' || reponse === 'complete' || reponse === 'limite') return reponse;
  if (reponse === 'terminee' || reponse === 'introuvable') return 'terminee';
  return 'erreur';
}

/** La ligne envoyée à la table `sessions` : seulement les champs du formulaire, le reste est rempli par la base. */
export function ligneNouvelleSession(nouvelle: NouvelleSession) {
  return {
    sport: nouvelle.sport,
    titre: nouvelle.titre,
    lieu: nouvelle.lieu,
    commune: nouvelle.commune,
    lat: nouvelle.position.latitude,
    lng: nouvelle.position.longitude,
    debut: nouvelle.debut.toISOString(),
    fin: nouvelle.fin.toISOString(),
    joueurs: nouvelle.joueurs,
    debutants_bienvenus: nouvelle.debutantsBienvenus,
    a_savoir_titre: nouvelle.aSavoir?.titre ?? null,
    a_savoir_detail: nouvelle.aSavoir?.detail ?? null,
    evenement_id: nouvelle.evenementId ?? null,
  };
}

/** Réponse de la base à une création : l'id de la session, `limite` (6 par 24 h dépassé) ou `null` (échec). */
export function interpreterCreation(
  data: { id?: unknown } | null,
  erreur: { message?: string } | null,
): { id: string } | 'limite' | null {
  if (erreur?.message?.includes('limite_sessions')) return 'limite';
  if (erreur || !data || typeof data.id !== 'string') return null;
  return { id: data.id };
}

/** Ce qui manque avant de publier une session, dans l'ordre où on le demande. */
export function etapePublication({
  sportChoisi,
  lieuChoisi,
  connecte,
}: {
  sportChoisi: boolean;
  lieuChoisi: boolean;
  /** Connecté avec un prénom */
  connecte: boolean;
}): 'sport' | 'lieu' | 'connexion' | 'envoyer' {
  if (!sportChoisi) return 'sport';
  // Jamais de lieu par défaut publié par mégarde : il faut l'avoir choisi sur la carte
  if (!lieuChoisi) return 'lieu';
  if (!connecte) return 'connexion';
  return 'envoyer';
}

/**
 * « Je ne peux plus » sur une session :
 * - l'organisateur ne la quitte pas, il l'annule pour tout le monde (après confirmation) ;
 * - un inscrit la quitte sans question jusqu'à 3 h avant ;
 * - après, on lui demande confirmation.
 */
export function choixAnnulation(
  session: Pick<Session, 'organisateurId'>,
  moi: string | null,
  { libre }: { libre: boolean },
): 'annuler_session' | 'quitter' | 'confirmer_quitter' {
  if (moi && session.organisateurId === moi) return 'annuler_session';
  return libre ? 'quitter' : 'confirmer_quitter';
}

/** Texte de confirmation quand l'organisateur annule : qui sera prévenu. */
export function texteAnnulationSession(session: Pick<Session, 'idsInscrits'>, moi: string) {
  const autres = session.idsInscrits.filter((inscrit) => inscrit !== moi).length;
  if (autres === 0) return 'Elle disparaîtra de la carte.';
  if (autres === 1) return 'Elle disparaîtra de la carte et la personne inscrite sera prévenue.';
  return `Elle disparaîtra de la carte et les ${autres} inscrits seront prévenus.`;
}

/** J'étais le seul inscrit : en partant, la session disparaît (et éclate sur la carte). */
export function dernierInscrit(session: Pick<Session, 'idsInscrits'>, moi: string) {
  return session.idsInscrits.every((inscrit) => inscrit === moi);
}

type Participant = { id: string; prenom: string };

/** Ajoute ou retire « moi » des participants, sans attendre la relecture (jamais deux fois le même compte). */
export function appliquerInscription(participants: Participant[], moi: Participant, inscrit: boolean) {
  const sansMoi = participants.filter((p) => p.id !== moi.id);
  return inscrit ? [...sansMoi, moi] : sansMoi;
}

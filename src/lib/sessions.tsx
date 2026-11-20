// Les sessions et les Catchs, partagés entre la carte, la liste, le détail et la confirmation.
// Tout vient de Supabase : aucune session d'exemple. Tout le monde peut lire, il faut être connecté pour agir.
import { createContext, use, useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import type { Sport } from '@/donnees/pictos';
import { CENTRE_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { demander, prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { annulationLibre, estEnDirect } from '@/lib/formats';
import { AVANCE_EVENEMENTS } from '@/lib/evenements';
import {
  appliquerInscription,
  choixAnnulation,
  dernierInscrit,
  interpreterCatch,
  interpreterCreation,
  ligneNouvelleSession,
  texteAnnulationSession,
} from '@/lib/regles-sessions';
import { supabase } from '@/lib/supabase';

/** Ce que l'écran « Créer une session » fournit ; le reste est rempli par le serveur */
export type NouvelleSession = Omit<
  Session,
  'id' | 'inscrits' | 'idsInscrits' | 'organisateur' | 'organisateurId' | 'nomSport'
>;

/** `chargement` : première lecture en cours. `erreur` : rien n'a pu être lu (pas de réseau, panne). */
export type EtatSessions = 'chargement' | 'pretes' | 'erreur';

/** `limite` : déjà 10 sessions à venir en même temps */
export type ResultatRecherche = 'trouvee' | 'absente' | 'erreur';

export type ResultatCatch = 'ok' | 'complete' | 'terminee' | 'limite' | 'erreur';

/** Ce que l'organisateur peut changer après coup */
export type Modification = Pick<Session, 'debut' | 'fin' | 'lieu' | 'commune' | 'position' | 'joueurs'>;
/** `trop_petit` : moins de places que d'inscrits */
export type ResultatModification = 'ok' | 'trop_petit' | 'erreur';

type Valeur = {
  sessions: Session[];
  etat: EtatSessions;
  recharger: () => Promise<void>;
  /**
   * Va chercher une session précise (lien d'invitation) si elle n'est pas déjà là.
   * `absente` : elle n'existe plus (terminée, annulée). `erreur` : pas de réseau, on ne sait pas.
   */
  chercher: (id: string) => Promise<ResultatRecherche>;
  estCatchee: (id: string) => boolean;
  /** Vrai si le compte connecté organise cette session */
  estOrganisee: (id: string) => boolean;
  /** L'organisateur change l'horaire, le lieu ou le nombre de joueurs : les inscrits sont prévenus */
  modifier: (id: string, modification: Modification) => Promise<ResultatModification>;
  /**
   * Publie une session : l'organisateur y est inscrit d'office. Renvoie son identifiant.
   * Sinon `limite` (trop de sessions créées aujourd'hui) ou `null` (pas de réseau, panne).
   */
  creer: (nouvelle: NouvelleSession) => Promise<{ id: string } | 'limite' | null>;
  /** Dernière session créée depuis ce téléphone, pour « Relancer ta dernière session » */
  derniereCreee: Session | null;
  /** Demande la place au serveur : on ne fête le Catch que s'il répond `ok` */
  catcher: (id: string) => Promise<ResultatCatch>;
  /**
   * Annule ma participation : tout de suite, ou après confirmation si la session commence dans moins de 3h.
   * Pour l'organisateur, c'est toute la session qui est annulée (toujours après confirmation).
   */
  annuler: (session: Session, ensuite?: () => void) => void;
  /** Sessions qui viennent de disparaître (plus aucun inscrit) : la carte les fait éclater puis les oublie */
  eclats: Eclat[];
  /** « Je ne peux plus » depuis le rappel : annule la participation à cette session */
  annulerParId: (id: string) => Promise<void>;
  /** Dernière participation annulée, tant que le toast « Annuler » est affiché */
  annulee: string | null;
  retablir: () => void;
  oublierAnnulation: () => void;
  /** Position de l'utilisateur, connue seulement après « recentrer » */
  position: Coordonnees | null;
  setPosition: (position: Coordonnees) => void;
  /** D'où on mesure les distances : la position, sinon le centre de la zone */
  origine: Coordonnees;
};

/** Une session en train d'éclater sur la carte ; `delai` laisse le temps de revenir sur la carte */
export type Eclat = { session: Session; delai: number };

/** Durée de l'éclatement, en ms */
export const DUREE_ECLAT = 450;

type Inscrit = { id: string; prenom: string };

/** Une ligne de la vue `sessions_visibles` */
type Ligne = {
  id: string;
  organisateur_id: string;
  organisateur: string;
  sport: Sport;
  titre: string;
  lieu: string;
  commune: string;
  lat: number;
  lng: number;
  debut: string;
  fin: string;
  joueurs: number;
  debutants_bienvenus: boolean;
  a_savoir_titre: string | null;
  a_savoir_detail: string | null;
  inscrits: Inscrit[];
  evenement_id: string | null;
};

type SessionLue = Omit<Session, 'inscrits' | 'idsInscrits'> & { participants: Inscrit[] };

/** Ce qu'on écrit dans un avatar : les deux premières lettres du prénom */
function debutPrenom(prenom: string) {
  const net = prenom.trim();
  return net ? net.charAt(0).toUpperCase() + net.slice(1, 2).toLowerCase() : '?';
}

function lire(ligne: Ligne): SessionLue {
  return {
    id: ligne.id,
    sport: ligne.sport,
    nomSport: ficheSport(ligne.sport).nomTuile ?? ficheSport(ligne.sport).nom,
    titre: ligne.titre,
    lieu: ligne.lieu,
    commune: ligne.commune,
    position: { latitude: ligne.lat, longitude: ligne.lng },
    debut: new Date(ligne.debut),
    fin: new Date(ligne.fin),
    joueurs: ligne.joueurs,
    organisateur: ligne.organisateur,
    organisateurId: ligne.organisateur_id,
    debutantsBienvenus: ligne.debutants_bienvenus,
    aSavoir: ligne.a_savoir_titre
      ? { titre: ligne.a_savoir_titre, detail: ligne.a_savoir_detail ?? '' }
      : undefined,
    evenementId: ligne.evenement_id ?? undefined,
    participants: ligne.inscrits ?? [],
  };
}

const Contexte = createContext<Valeur | null>(null);

export function FournisseurSessions({ children }: { children: React.ReactNode }) {
  const { compte } = useCompte();
  const moi = compte?.id ?? null;
  const [lues, setLues] = useState<SessionLue[]>([]);
  const [etat, setEtat] = useState<EtatSessions>(supabase ? 'chargement' : 'erreur');
  const [idCreee, setIdCreee] = useState<string | null>(null);
  const [annulee, setAnnulee] = useState<string | null>(null);
  const [eclats, setEclats] = useState<Eclat[]>([]);
  const [position, setPosition] = useState<Coordonnees | null>(null);

  // Les sessions pas encore finies qui commencent dans les 7 prochains jours,
  // et celles qui vont ensemble à un événement (visible 2 semaines avant) d'ici là
  const recharger = useCallback(async () => {
    if (!supabase) return;
    // Après un échec, « Réessayer » montre tout de suite qu'on cherche à nouveau
    setEtat((avant) => (avant === 'erreur' ? 'chargement' : avant));
    const maintenant = new Date();
    const dans7Jours = new Date(maintenant.getTime() + 7 * 24 * 3_600_000);
    const finEvenements = new Date(maintenant.getTime() + AVANCE_EVENEMENTS);
    try {
      const { data, error } = await supabase
        .from('sessions_visibles')
        .select('*')
        .gt('fin', maintenant.toISOString())
        .or(
          `debut.lt.${dans7Jours.toISOString()},and(evenement_id.not.is.null,debut.lt.${finEvenements.toISOString()})`,
        )
        .order('debut')
        .limit(500);
      if (error) throw error;
      const recues = (data as Ligne[]).map(lire);
      // Une session ouverte par un lien d'invitation peut commencer dans plus de 7 jours : on la garde
      setLues((avant) => [
        ...recues,
        ...avant.filter((s) => s.debut >= dans7Jours && !s.evenementId && !recues.some((r) => r.id === s.id)),
      ]);
      setEtat('pretes');
    } catch {
      // On garde ce qui est déjà affiché ; l'erreur n'est montrée que s'il n'y a rien à voir
      setEtat((avant) => (avant === 'pretes' ? 'pretes' : 'erreur'));
    }
  }, []);

  /** Relit une session sur le serveur : la session, `absente` si elle n'existe plus, `erreur` si on n'a pas pu savoir. */
  const lireSession = useCallback(async (id: string): Promise<SessionLue | 'absente' | 'erreur'> => {
    if (!supabase) return 'erreur';
    try {
      const { data, error } = await supabase
        .from('sessions_visibles')
        .select('*')
        .eq('id', id)
        .gt('fin', new Date().toISOString())
        .maybeSingle();
      if (error) return 'erreur';
      if (!data) return 'absente';
      const trouvee = lire(data as Ligne);
      setLues((liste) => [...liste.filter((s) => s.id !== id), trouvee]);
      return trouvee;
    } catch {
      return 'erreur';
    }
  }, []);

  const chercher = useCallback(
    async (id: string): Promise<ResultatRecherche> => {
      const resultat = await lireSession(id);
      return typeof resultat === 'string' ? resultat : 'trouvee';
    },
    [lireSession],
  );

  // Lecture à l'ouverture, puis chaque fois que l'app revient à l'écran
  useEffect(() => {
    // Lancée juste après l'affichage, pour ne pas le retarder
    Promise.resolve().then(recharger);
    if (Platform.OS === 'web') return;
    const ecoute = AppState.addEventListener('change', (etatApp) => {
      if (etatApp === 'active') recharger();
    });
    return () => ecoute.remove();
  }, [recharger]);

  // Une session sans inscrit n'existe plus : elle quitte l'écran tout de suite, sans attendre la relecture
  const sessions: Session[] = lues
    .filter((s) => s.participants.length > 0)
    .map(({ participants, ...session }) => ({
      ...session,
      idsInscrits: participants.map((p) => p.id),
      inscrits: participants.map((p) => (p.id === moi ? 'Toi' : debutPrenom(p.prenom))),
    }));

  function estCatchee(id: string) {
    return !!moi && !!lues.find((s) => s.id === id)?.participants.some((p) => p.id === moi);
  }

  function estOrganisee(id: string) {
    return !!moi && lues.find((s) => s.id === id)?.organisateurId === moi;
  }

  /** Ajoute ou retire « moi » d'une session sans attendre la relecture */
  function appliquer(id: string, inscrit: boolean) {
    if (!compte) return;
    setLues((liste) =>
      liste.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          participants: appliquerInscription(s.participants, { id: compte.id, prenom: compte.prenom ?? '' }, inscrit),
        };
      }),
    );
  }

  async function catcher(id: string): Promise<ResultatCatch> {
    if (!supabase) return 'erreur';
    try {
      const { data, error } = await supabase.rpc('catcher', { p_session: id });
      const resultat = interpreterCatch(data, !!error);
      if (resultat === 'erreur') return 'erreur';
      if (resultat === 'ok') {
        appliquer(id, true);
        setAnnulee(null);
      }
      recharger();
      return resultat;
    } catch {
      return 'erreur';
    }
  }

  async function creer(nouvelle: NouvelleSession): Promise<{ id: string } | 'limite' | null> {
    if (!supabase || !compte) return null;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(ligneNouvelleSession(nouvelle))
        .select('id')
        .single();
      const resultat = interpreterCreation(data, error);
      if (!resultat || resultat === 'limite') return resultat;
      await recharger();
      setIdCreee(resultat.id);
      return resultat;
    } catch {
      return null;
    }
  }

  async function quitter(id: string, ensuite?: () => void) {
    if (!supabase || !compte) return;
    // J'étais le dernier inscrit : la session disparaît, et la carte la fait éclater
    const session = sessions.find((s) => s.id === id);
    if (session && dernierInscrit(session, compte.id)) {
      // Depuis un autre écran, on attend d'être revenu sur la carte pour que ça se voie
      eclater(session, ensuite ? 450 : 150);
    }
    // On agit tout de suite à l'écran, et on revient en arrière proprement si le serveur refuse
    appliquer(id, false);
    setAnnulee(id);
    ensuite?.();
    try {
      const { error } = await supabase
        .from('participations')
        .delete()
        .eq('session_id', id)
        .eq('joueur_id', compte.id);
      if (error) throw error;
    } catch {
      appliquer(id, true);
      setAnnulee(null);
      prevenir('Annulation impossible', 'Ça n’a pas marché. Vérifie ta connexion et réessaie.');
    }
  }

  /** La session fait éclater sa pastille sur la carte, puis on l'oublie */
  function eclater(session: Session, delai: number) {
    setEclats((liste) => [...liste.filter((e) => e.session.id !== session.id), { session, delai }]);
    setTimeout(
      () => setEclats((liste) => liste.filter((e) => e.session.id !== session.id)),
      delai + DUREE_ECLAT + 100,
    );
  }

  /** L'organisateur annule sa session : elle disparaît pour tout le monde, les inscrits sont prévenus. */
  async function annulerSession(session: Session, ensuite?: () => void) {
    if (!supabase || !compte) return;
    eclater(session, ensuite ? 450 : 150);
    setLues((liste) => liste.filter((s) => s.id !== session.id));
    ensuite?.();
    try {
      const { data, error } = await supabase.rpc('annuler_session', { p_session: session.id });
      if (error || data !== 'ok') throw error ?? new Error(String(data));
    } catch {
      await recharger();
      prevenir('Session pas annulée', 'Ça n’a pas marché. Vérifie ta connexion et réessaie.');
    }
  }

  async function modifier(id: string, m: Modification): Promise<ResultatModification> {
    if (!supabase || !compte) return 'erreur';
    try {
      const { data, error } = await supabase.rpc('modifier_session', {
        p_session: id,
        p_debut: m.debut.toISOString(),
        p_fin: m.fin.toISOString(),
        p_lieu: m.lieu,
        p_commune: m.commune,
        p_lat: m.position.latitude,
        p_lng: m.position.longitude,
        p_joueurs: m.joueurs,
      });
      if (error) return 'erreur';
      if (data === 'ok') {
        await chercher(id);
        return 'ok';
      }
      return data === 'trop_petit' ? 'trop_petit' : 'erreur';
    } catch {
      return 'erreur';
    }
  }

  function annuler(session: Session, ensuite?: () => void) {
    const choix = choixAnnulation(session, compte?.id ?? null, { libre: annulationLibre(session) });
    // L'organisateur ne quitte pas sa session : il l'annule pour tout le monde
    if (choix === 'annuler_session' && compte) {
      demander({
        titre: 'Annuler la session ?',
        texte: texteAnnulationSession(session, compte.id),
        confirmer: 'Annuler la session',
        refuser: 'La garder',
        destructif: true,
        onConfirmer: () => annulerSession(session, ensuite),
      });
      return;
    }
    // Annuler plutôt que confirmer : on ne demande que si c'est trop tard pour annuler librement
    if (choix === 'quitter') {
      quitter(session.id, ensuite);
      return;
    }
    demander({
      titre: 'Annuler ta participation ?',
      texte: estEnDirect(session)
        ? 'La session a déjà commencé. Ta place sera libérée.'
        : 'La session commence dans moins de 3h. Ta place sera libérée.',
      confirmer: 'Annuler ma participation',
      refuser: 'Je viens',
      destructif: true,
      onConfirmer: () => quitter(session.id, ensuite),
    });
  }

  async function annulerParId(id: string) {
    if (!compte) return;
    // On relit la session sur le serveur : la liste à l'écran n'est peut-être pas encore chargée (app fermée)
    const session = await lireSession(id);
    if (session === 'absente') return;
    if (session === 'erreur') {
      prevenir('Annulation impossible', 'Ça n’a pas marché. Vérifie ta connexion et réessaie depuis la session.');
      return;
    }
    // L'organisateur qui répond « Je ne peux plus » : on lui ouvre sa session, à lui de l'annuler pour tout le monde
    if (session.organisateurId === compte.id) return;
    await quitter(id);
  }

  async function retablir() {
    if (!annulee) return;
    const id = annulee;
    setAnnulee(null);
    const resultat = await catcher(id);
    if (resultat !== 'ok') {
      prevenir(
        resultat === 'complete' ? 'La place vient d’être prise' : 'Ça n’a pas marché',
        resultat === 'complete'
          ? 'Quelqu’un a catché la session entre-temps.'
          : 'Vérifie ta connexion et réessaie depuis la session.',
      );
    }
  }

  return (
    <Contexte
      value={{
        sessions,
        etat,
        recharger,
        chercher,
        estCatchee,
        estOrganisee,
        modifier,
        catcher,
        creer,
        derniereCreee: sessions.find((s) => s.id === idCreee) ?? null,
        annuler,
        annulerParId,
        eclats,
        annulee,
        retablir,
        oublierAnnulation: () => setAnnulee(null),
        position,
        setPosition,
        origine: position ?? CENTRE_ZONE,
      }}>
      {children}
    </Contexte>
  );
}

export function useSessions() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useSessions doit être utilisé dans <FournisseurSessions>');
  return valeur;
}

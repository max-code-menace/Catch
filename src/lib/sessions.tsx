// Les sessions et les Catchs, partagés entre la carte, la liste, le détail et la confirmation.
// Tout est encore local : les sessions sont fictives et le Catch n'est pas enregistré (Supabase à l'étape 5).
import { createContext, use, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { sessionsFictives, WAVRE, type Coordonnees, type Session } from '@/donnees/sessions';
import { annulationLibre, estEnDirect } from '@/lib/formats';

type Valeur = {
  /** Sessions avec les Catchs appliqués : une session catchée compte tout de suite un inscrit de plus */
  sessions: Session[];
  estCatchee: (id: string) => boolean;
  catcher: (id: string) => void;
  /** Annule tout de suite, ou demande d'abord si la session commence dans moins de 3h */
  annuler: (session: Session, ensuite?: () => void) => void;
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

const Contexte = createContext<Valeur | null>(null);

export function FournisseurSessions({ children }: { children: React.ReactNode }) {
  const sessionsDeBase = useMemo(() => sessionsFictives(), []);
  const [catchees, setCatchees] = useState<string[]>([]);
  const [annulee, setAnnulee] = useState<string | null>(null);
  const [position, setPosition] = useState<Coordonnees | null>(null);

  const sessions = sessionsDeBase.map((s) =>
    catchees.includes(s.id) ? { ...s, inscrits: ['Toi', ...s.inscrits] } : s,
  );

  function catcher(id: string) {
    setCatchees((liste) => (liste.includes(id) ? liste : [...liste, id]));
    setAnnulee(null);
  }

  function quitter(id: string, ensuite?: () => void) {
    setCatchees((liste) => liste.filter((x) => x !== id));
    setAnnulee(id);
    ensuite?.();
  }

  function annuler(session: Session, ensuite?: () => void) {
    // Annuler plutôt que confirmer : on ne demande que si c'est trop tard pour annuler librement
    if (annulationLibre(session) || Platform.OS === 'web') {
      quitter(session.id, ensuite);
      return;
    }
    Alert.alert(
      'Annuler ta participation ?',
      estEnDirect(session)
        ? 'La session a déjà commencé. Ta place sera libérée.'
        : 'La session commence dans moins de 3h. Ta place sera libérée.',
      [
        { text: 'Je viens', style: 'cancel' },
        {
          text: 'Annuler ma participation',
          style: 'destructive',
          onPress: () => quitter(session.id, ensuite),
        },
      ],
    );
  }

  function retablir() {
    if (annulee) catcher(annulee);
  }

  return (
    <Contexte
      value={{
        sessions,
        estCatchee: (id) => catchees.includes(id),
        catcher,
        annuler,
        annulee,
        retablir,
        oublierAnnulation: () => setAnnulee(null),
        position,
        setPosition,
        origine: position ?? WAVRE,
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

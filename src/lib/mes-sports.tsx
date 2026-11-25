// « Mes sports » : les sports qu'on veut voir sur la carte. Retenus sur le téléphone, sans compte.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

import type { Sport } from '@/donnees/pictos';
import { SPORTS } from '@/donnees/sports';
import {
  basculerSport,
  CHOIX_VIDE,
  garderParSport,
  garderParSports,
  lireChoix,
  type ChoixSports,
} from '@/lib/filtre-sports';

const CLE = 'catch.mes-sports';
const CONNUS = SPORTS.map((s) => s.cle).filter((s) => s !== 'autre');

type Contexte = ChoixSports & {
  /** Faux tant que le choix n'a pas été relu du téléphone */
  pret: boolean;
  basculer: (sport: Sport) => void;
  /** « Tous les sports » (vrai) ou « Mes sports » (faux) */
  setTous: (tous: boolean) => void;
  /** Depuis « Tous les sports » : ne garder que ce sport */
  choisirSeul: (sport: Sport) => void;
};

const ContexteMesSports = createContext<Contexte | null>(null);

export function FournisseurMesSports({ children }: { children: React.ReactNode }) {
  const [choix, setChoix] = useState<ChoixSports>(CHOIX_VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((texte) => setChoix(lireChoix(texte, CONNUS)))
      .catch(() => {})
      .finally(() => setPret(true));
  }, []);

  function changer(nouveau: ChoixSports) {
    setChoix(nouveau);
    AsyncStorage.setItem(CLE, JSON.stringify(nouveau)).catch(() => {});
  }

  return (
    <ContexteMesSports.Provider
      value={{
        ...choix,
        pret,
        basculer: (sport) => changer(basculerSport(choix, sport)),
        setTous: (tous) => changer({ ...choix, tous }),
        choisirSeul: (sport) => changer({ sports: [sport], tous: false }),
      }}>
      {children}
    </ContexteMesSports.Provider>
  );
}

export function useMesSports() {
  const contexte = useContext(ContexteMesSports);
  if (!contexte) throw new Error('useMesSports doit être utilisé dans FournisseurMesSports');
  return contexte;
}

/** Les sports qu'on peut choisir (tous sauf « Autre ») */
export const SPORTS_A_CHOISIR = SPORTS.filter((s) => s.cle !== 'autre');

/** Ce que la carte montre une fois le filtre « Mes sports » appliqué (tout, si le filtre n'est pas actif) */
export function useFiltreMesSports<
  S extends { sport: Sport },
  X extends { session: { sport: Sport } },
  L extends { sports: Sport[] },
  E extends { sport: Sport },
>(listes: { sessions: S[]; eclats: X[]; lieux: L[]; evenements: E[] }) {
  const { sports, tous } = useMesSports();
  const choix = { sports, tous };
  return {
    sessions: garderParSport(listes.sessions, choix),
    eclats: listes.eclats.filter((e) => garderParSport([e.session], choix).length > 0),
    lieux: garderParSports(listes.lieux, choix),
    evenements: garderParSport(listes.evenements, choix),
  };
}

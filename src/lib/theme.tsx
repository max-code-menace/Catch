// Thème clair ou sombre : automatique selon le téléphone, avec un réglage dans Profil.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Palettes, type Palette, type Theme } from '@/constants/theme';

export type { Palette };
export type Apparence = 'auto' | 'clair' | 'sombre';

type Valeur = {
  theme: Theme;
  c: Palette;
  apparence: Apparence;
  setApparence: (apparence: Apparence) => void;
};

const CLE = 'catch.apparence';
const Contexte = createContext<Valeur | null>(null);

export function FournisseurTheme({ children }: { children: React.ReactNode }) {
  const systeme = useColorScheme();
  const [apparence, setApparenceEtat] = useState<Apparence>('auto');

  // On relit le choix enregistré au démarrage
  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => {
        if (v === 'auto' || v === 'clair' || v === 'sombre') setApparenceEtat(v);
      })
      .catch(() => {});
  }, []);

  const theme: Theme = apparence === 'auto' ? (systeme === 'dark' ? 'sombre' : 'clair') : apparence;

  return (
    <Contexte
      value={{
        theme,
        c: Palettes[theme],
        apparence,
        setApparence: (a) => {
          setApparenceEtat(a);
          AsyncStorage.setItem(CLE, a).catch(() => {});
        },
      }}>
      {children}
    </Contexte>
  );
}

export function useTheme() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('useTheme doit être utilisé dans <FournisseurTheme>');
  return valeur;
}

/** Les couleurs du thème en cours. */
export function useCouleurs() {
  return useTheme().c;
}

const cache = new WeakMap<object, Map<Palette, unknown>>();

/** Les styles d'un fichier, calculés une fois par thème : `const styles = useStyles(creerStyles)`. */
export function useStyles<T>(creer: (c: Palette) => T): T {
  const c = useCouleurs();
  let parPalette = cache.get(creer);
  if (!parPalette) {
    parPalette = new Map();
    cache.set(creer, parPalette);
  }
  if (!parPalette.has(c)) parPalette.set(c, creer(c));
  return parPalette.get(c) as T;
}

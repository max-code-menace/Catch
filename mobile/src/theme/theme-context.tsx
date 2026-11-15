import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type Couleurs, type Scheme } from './tokens';

export type Apparence = 'auto' | 'light' | 'dark';

type Theme = {
  scheme: Scheme;
  c: Couleurs;
  apparence: Apparence;
  setApparence: (a: Apparence) => void;
};

const CLE = 'catch.apparence';
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [apparence, setApparenceState] = useState<Apparence>('auto');

  // On relit le choix enregistré (Auto, Clair ou Sombre) au démarrage.
  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'auto') setApparenceState(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme: Scheme =
      apparence === 'auto' ? (systeme === 'dark' ? 'dark' : 'light') : apparence;
    return {
      scheme,
      c: palettes[scheme],
      apparence,
      setApparence: (a) => {
        setApparenceState(a);
        AsyncStorage.setItem(CLE, a).catch(() => {});
      },
    };
  }, [apparence, systeme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const t = use(ThemeContext);
  if (!t) throw new Error('useTheme doit être utilisé dans ThemeProvider');
  return t;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const CLE = 'catch.conseils-securite';

/**
 * Vrai la première fois qu'on catche une session depuis ce téléphone : on propose alors les conseils
 * de sécurité. Retenu tout de suite, pour ne pas les reproposer à chaque Catch (ils restent dans Profil).
 */
export function usePremiersConseils() {
  const [afficher, setAfficher] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((deja) => {
        if (deja) return;
        setAfficher(true);
        return AsyncStorage.setItem(CLE, '1');
      })
      .catch(() => {});
  }, []);
  return afficher;
}

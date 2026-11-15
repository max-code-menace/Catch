import { router } from 'expo-router';

import { useCompte } from '@/lib/compte';
import { useSessions } from '@/lib/sessions';

/** Ce qui se passe autour du bouton Catch : connexion si besoin, puis Catch et confirmation. */
export function useCatch() {
  const { compte } = useCompte();
  const { catcher } = useSessions();

  return {
    /** Connecté : le geste peut partir. Sinon on ouvre la connexion, qui catchera la session ensuite. */
    autoriser(id: string) {
      if (compte?.prenom) return true;
      router.push({ pathname: '/connexion', params: { id } });
      return false;
    },
    confirmer(id: string) {
      catcher(id);
      router.push({ pathname: '/catchee/[id]', params: { id } });
    },
  };
}

import { router } from 'expo-router';

import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { useSessions, type ResultatCatch } from '@/lib/sessions';

/** Dit pourquoi un Catch n'a pas pu se faire : un titre, une phrase, pas de reproche. */
export function expliquerEchec(resultat: Exclude<ResultatCatch, 'ok'>) {
  if (resultat === 'complete') {
    prevenir('Session complète', 'La dernière place vient d’être prise.');
  } else if (resultat === 'limite') {
    prevenir('Tu as déjà 10 sessions à venir', 'Libère une place dans une autre session pour catcher celle-ci.');
  } else if (resultat === 'terminee') {
    prevenir('Session terminée', 'Cette session n’est plus disponible.');
  } else {
    prevenir('Pas de réseau', 'Ton Catch n’est pas parti.');
  }
}

/** Ce qui se passe autour du bouton Catch : connexion si besoin, demande au serveur, puis confirmation. */
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
    /** Demande la place : `true` si elle est prise. Sinon on explique pourquoi. */
    async envoyer(id: string) {
      const resultat = await catcher(id);
      if (resultat === 'ok') return true;
      expliquerEchec(resultat);
      return false;
    },
    /** La place est prise : on fête ça */
    confirmer(id: string) {
      router.push({ pathname: '/catchee/[id]', params: { id } });
    },
  };
}

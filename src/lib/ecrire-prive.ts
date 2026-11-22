// « Écrire à … » : ouvre (ou retrouve) la conversation privée avec quelqu'un, puis l'affiche.
import { router } from 'expo-router';

import { prevenir } from '@/lib/alerte';
import { vibrer } from '@/lib/haptics';
import { ouvrirPrive } from '@/lib/messages';

/**
 * `connecte` : sans compte, on passe d'abord par la connexion.
 * `sessionId` : la session d'où on écrit (permet d'écrire à son organisateur sans l'avoir catchée).
 */
export async function ecrireA({
  autreId,
  prenom,
  sessionId,
  connecte,
}: {
  autreId: string;
  prenom: string;
  sessionId?: string;
  connecte: boolean;
}) {
  if (!connecte) {
    router.push('/connexion');
    return;
  }
  vibrer.selection();
  const resultat = await ouvrirPrive(autreId, sessionId);
  if (typeof resultat === 'object') {
    router.push({ pathname: '/prive/[id]', params: { id: resultat.id } });
    return;
  }
  vibrer.erreur();
  if (resultat === 'limite') {
    prevenir('Doucement', 'Tu as lancé beaucoup de nouvelles conversations aujourd’hui. Réessaie demain.');
  } else if (resultat === 'interdit') {
    prevenir('Impossible d’écrire', `Tu ne peux pas écrire à ${prenom || 'cette personne'} pour l’instant.`);
  } else {
    prevenir('Pas de réseau', 'Impossible d’ouvrir la conversation. Vérifie ta connexion et réessaie.');
  }
}

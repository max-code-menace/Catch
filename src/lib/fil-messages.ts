// Fil d'une conversation : calcul pur (pas d'import de code) pour pouvoir le tester avec `npm test`.
import type { Message } from '@/lib/messages';

/**
 * Ajoute des messages reçus à ceux déjà affichés : sans doublon, dans l'ordre d'arrivée,
 * les messages en cours d'envoi toujours à la fin.
 */
export function fusionnerMessages(avant: Message[], recus: Message[]) {
  const ids = new Set(recus.map((m) => m.id));
  const gardes = avant.filter((m) => !m.enAttente && !ids.has(m.id));
  const enAttente = avant.filter((m) => m.enAttente);
  return [...gardes, ...recus].sort((a, b) => a.date.getTime() - b.date.getTime()).concat(enAttente);
}

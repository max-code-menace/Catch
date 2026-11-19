// « Ajouter à mon calendrier » : ouvre la fiche d'événement du téléphone, déjà remplie.
// On passe par la fiche du système (l'utilisateur valide lui-même) : sur iOS 17+ et Android,
// aucune autorisation n'est demandée. La version « legacy » est la seule qui marche dans Expo Go.
import * as Calendar from 'expo-calendar/legacy';

import { lienSession } from '@/constants/liens';
import type { Session } from '@/donnees/sessions';
import { prevenir } from '@/lib/alerte';
import { vibrer } from '@/lib/haptics';

/** Le calendrier existe sur ce téléphone (faux sur le web). */
export const calendrierDisponible = true;

function evenement(session: Session) {
  return {
    title: `${session.titre} · Catch`,
    startDate: session.debut,
    endDate: session.fin,
    location: session.commune ? `${session.lieu}, ${session.commune}` : session.lieu,
    notes: `Organisée par ${session.organisateur}. ${lienSession(session.id)}`,
    url: lienSession(session.id),
  };
}

export async function ajouterAuCalendrier(session: Session) {
  try {
    const resultat = await Calendar.createEventInCalendarAsync(evenement(session));
    if (resultat.action === 'saved') vibrer.succes();
  } catch {
    // iPhone plus ancien qu'iOS 17 : il faut d'abord l'autorisation du calendrier
    try {
      const { granted } = await Calendar.requestCalendarPermissionsAsync();
      if (!granted) {
        prevenir('Calendrier non autorisé', 'Autorise le calendrier pour Catch dans les Réglages du téléphone.');
        return;
      }
      const resultat = await Calendar.createEventInCalendarAsync(evenement(session));
      if (resultat.action === 'saved') vibrer.succes();
    } catch {
      prevenir('Calendrier indisponible', 'Impossible d’ouvrir le calendrier. Réessaie dans un moment.');
    }
  }
}

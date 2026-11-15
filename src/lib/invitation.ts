// Inviter : partager le lien d'une session (docs/ux-writing.md : on dit « Inviter », et « Rejoindre » pour qui ne connaît pas l'app).
import { Platform, Share } from 'react-native';

import { lienSession } from '@/constants/liens';
import type { Session } from '@/donnees/sessions';
import { quandPhrase } from '@/lib/formats';

/** « Foot jeudi 19h, Parc de la Source (Wavre) » */
function resume(session: Session) {
  const lieu = session.commune ? `${session.lieu} (${session.commune})` : session.lieu;
  return `${session.titre} ${quandPhrase(session)}, ${lieu}`;
}

/** Ouvre la feuille de partage du téléphone avec le lien de la session. */
export async function inviter(session: Session) {
  const lien = lienSession(session.id);
  const texte = `Viens jouer : ${resume(session)}. Rejoins la session ici :`;
  try {
    if (Platform.OS === 'ios') {
      // Sur iPhone, le lien est passé à part pour avoir un bel aperçu dans Messages
      await Share.share({ message: texte, url: lien });
    } else {
      await Share.share({ message: `${texte} ${lien}` });
    }
  } catch {
    // Partage indisponible ou fermé : rien à faire
  }
}

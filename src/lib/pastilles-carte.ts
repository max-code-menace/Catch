// Regroupement des sessions sur la carte, avec les vraies tailles des pastilles (texte, police, grossissement du texte).
// Le calcul lui-même est dans regroupement-sessions.ts (testé par `npm test`).
import { PixelRatio } from 'react-native';

import { Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, sportsDuGroupe, texteGroupe, textePastille } from '@/lib/formats';
import {
  regrouperSessions,
  taillePastille,
  zoomPourSeparer,
  type OptionsRegroupement,
  type VueCarte,
} from '@/lib/regroupement-sessions';
import type { Eclat } from '@/lib/sessions';

function options(): OptionsRegroupement<Session> {
  // Le texte des pastilles grossit avec le réglage de l'iPhone, jusqu'à 130 %
  const echelle = Math.min(1.3, PixelRatio.getFontScale());
  return {
    position: (s) => s.position,
    cle: (s) => s.id,
    taille: (liste) => {
      if (liste.length === 1) {
        const [s] = liste;
        return taillePastille({ texte: textePastille(s), direct: estEnDirect(s) }, Tailles.petit, echelle);
      }
      const sports = sportsDuGroupe(liste).length;
      return taillePastille(
        { texte: texteGroupe(liste), pictos: sports > 1 ? Math.min(3, sports) : 1, direct: liste.some((s) => estEnDirect(s)) },
        Tailles.petit,
        echelle,
      );
    },
  };
}

/** Pastilles et bulles à dessiner à ce zoom */
export function groupesDeSessions(sessions: Session[], vue: VueCarte) {
  return regrouperSessions(sessions, options(), vue);
}

/** Où aller quand on touche une bulle, ou `null` si ses sessions sont au même endroit (on ouvre la liste) */
export function zoomDuGroupe(sessions: Session[], vue: VueCarte) {
  return zoomPourSeparer(sessions, options(), vue);
}

/**
 * Une session qui disparaît n'éclate sur la carte que si elle avait sa propre pastille :
 * dans une bulle, c'est le nombre de la bulle qui baisse.
 */
export function eclatsVisibles(eclats: Eclat[], sessions: Session[], vue: VueCarte) {
  if (eclats.length === 0) return eclats;
  const avant = groupesDeSessions([...sessions, ...eclats.map((e) => e.session)], vue);
  const seules = new Set(avant.filter((g) => g.elements.length === 1).map((g) => g.cle));
  return eclats.filter((e) => seules.has(e.session.id));
}

import { useEffect, useRef, useState } from 'react';

import type { Session } from '@/donnees/sessions';

/** Écart entre deux pastilles qui sortent l'une après l'autre */
export const ECART_APPARITION = 70;
/** Durée de la sortie d'une pastille (ressort compris) */
export const DUREE_APPARITION = 450;
/** Au-delà, les suivantes sortent toutes ensemble : l'attente ne doit pas s'allonger */
const RANG_MAX = 10;

/** Sessions déjà montrées depuis l'ouverture de l'app : une pastille ne sort de terre qu'une fois. */
const dejaVues = new Set<string>();

/** À appeler avant qu'une session arrive sur la carte quand elle a sa propre entrée (session qu'on vient de publier). */
export function marquerVue(id: string) {
  dejaVues.add(id);
}

/**
 * Sessions qui viennent d'apparaître sur la carte, avec le délai de leur sortie :
 * de haut en bas de l'écran, l'une après l'autre. Une fois sorties, elles quittent la liste
 * (la carte peut alors figer leur marqueur en image).
 */
export function useApparitions(sessions: Session[]) {
  const [delais, setDelais] = useState<ReadonlyMap<string, number>>(new Map());
  const planifiees = useRef(new Set<string>());
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Nouvelles venues : on leur donne un délai dès ce rendu (sinon elles s'afficheraient une image avant de sortir)
  const nouvelles = sessions
    .filter((s) => !dejaVues.has(s.id) && !delais.has(s.id))
    .sort((a, b) => b.position.latitude - a.position.latitude);
  if (nouvelles.length > 0) {
    const ajout = nouvelles.map((s, rang) => [s.id, Math.min(rang, RANG_MAX) * ECART_APPARITION] as const);
    setDelais(new Map([...delais, ...ajout]));
  }

  // Une fois affichées : elles sont « vues », et quittent la liste quand leur sortie est finie
  useEffect(() => {
    const aPlanifier = [...delais].filter(([id]) => !planifiees.current.has(id));
    if (aPlanifier.length === 0) return;
    aPlanifier.forEach(([id]) => {
      dejaVues.add(id);
      planifiees.current.add(id);
    });
    const fin = Math.max(...aPlanifier.map(([, delai]) => delai)) + DUREE_APPARITION + 150;
    minuteurs.current.push(
      setTimeout(() => {
        setDelais((avant) => {
          const reste = new Map(avant);
          aPlanifier.forEach(([id]) => reste.delete(id));
          return reste;
        });
      }, fin),
    );
  }, [delais]);

  useEffect(() => {
    const liste = minuteurs.current;
    return () => liste.forEach(clearTimeout);
  }, []);

  return delais;
}

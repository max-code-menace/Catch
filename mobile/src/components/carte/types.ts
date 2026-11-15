import { type Ref } from 'react';

import { type Session } from '@/lib/sessions';

export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

export type CommandesCarte = { allerA: (region: Region) => void };

export type FondCarteProps = {
  ref?: Ref<CommandesCarte>;
  regionInitiale: Region;
  sessions: Session[];
  selection: string | null;
  onSelection: (id: string | null) => void;
  // Afficher le point bleu de la position (seulement si la localisation est autorisée).
  montrerPosition: boolean;
  // Place prise par la barre du haut et par ce qui flotte en bas, pour que rien ne se cache dessous.
  margeHaut: number;
  margeBas: number;
};

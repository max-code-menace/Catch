// Le lieu d'une session en cours de création : un point sur la carte et son nom.
import * as Location from 'expo-location';

import { CENTRE_ZONE, type Coordonnees } from '@/donnees/sessions';

export type Lieu = {
  position: Coordonnees;
  nom: string;
  commune: string;
  /** Faux tant qu'on affiche le lieu par défaut, que personne n'a choisi */
  choisi: boolean;
};

export const LIEU_PAR_DEFAUT: Lieu = {
  position: CENTRE_ZONE,
  nom: 'Centre de Bruxelles',
  commune: 'Bruxelles',
  choisi: false,
};

/** Retrouve le nom de l'endroit (lieu connu ou rue) et la commune d'un point. */
export async function nommer(position: Coordonnees): Promise<Lieu> {
  try {
    const [adresse] = await Location.reverseGeocodeAsync(position);
    return {
      position,
      nom: adresse?.name ?? adresse?.street ?? 'Lieu choisi sur la carte',
      commune: adresse?.city ?? adresse?.subregion ?? '',
      choisi: true,
    };
  } catch {
    return { position, nom: 'Lieu choisi sur la carte', commune: '', choisi: true };
  }
}

/**
 * La position du téléphone, ou `null` si elle est refusée ou indisponible.
 * `demander` à faux : on ne pose pas la question du système, la position n'est lue que si elle est déjà autorisée.
 */
export async function maPosition(demander = true): Promise<Coordonnees | null> {
  try {
    const { granted } = demander
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!granted) return null;
    const trouve =
      (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
    return { latitude: trouve.coords.latitude, longitude: trouve.coords.longitude };
  } catch {
    return null;
  }
}

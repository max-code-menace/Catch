// Le lieu d'une session en cours de création : un point sur la carte et son nom.
import * as Location from 'expo-location';

import { WAVRE, type Coordonnees } from '@/donnees/sessions';

export type Lieu = {
  position: Coordonnees;
  nom: string;
  commune: string;
  /** Faux tant qu'on affiche le lieu par défaut, que personne n'a choisi */
  choisi: boolean;
};

export const LIEU_PAR_DEFAUT: Lieu = {
  position: WAVRE,
  nom: 'Centre de Wavre',
  commune: 'Wavre',
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

/** La position du téléphone, ou `null` si elle est refusée ou indisponible. */
export async function maPosition(): Promise<Coordonnees | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const trouve =
      (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
    return { latitude: trouve.coords.latitude, longitude: trouve.coords.longitude };
  } catch {
    return null;
  }
}

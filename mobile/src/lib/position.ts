import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { type Point } from './geo';

export type ResultatPosition =
  | { etat: 'ok'; point: Point }
  | { etat: 'refuse'; peutRedemander: boolean }
  | { etat: 'introuvable' };

// Donne la position du téléphone. `demander` : afficher la demande d'autorisation si elle n'a pas encore été faite.
export async function trouverPosition(demander: boolean): Promise<ResultatPosition> {
  try {
    let droit = await Location.getForegroundPermissionsAsync();
    if (!droit.granted && demander && droit.canAskAgain) {
      droit = await Location.requestForegroundPermissionsAsync();
    }
    if (!droit.granted) return { etat: 'refuse', peutRedemander: droit.canAskAgain };

    const connue = Platform.OS === 'web' ? null : await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    const position =
      connue ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { etat: 'ok', point: { lat: position.coords.latitude, lng: position.coords.longitude } };
  } catch {
    return { etat: 'introuvable' };
  }
}

// Nom de la commune à cet endroit (« Wavre »), ou null si on ne sait pas.
export async function nomCommune(point: Point): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const [adresse] = await Location.reverseGeocodeAsync({ latitude: point.lat, longitude: point.lng });
    return adresse?.city ?? adresse?.subregion ?? null;
  } catch {
    return null;
  }
}

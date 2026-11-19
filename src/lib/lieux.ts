// Le lieu d'une session en cours de création : un point sur la carte et son nom.
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import { demander as poserQuestion } from '@/lib/alerte';

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

/** Pose une question et attend la réponse : vrai si la personne accepte. */
function question(titre: string, texte: string, confirmer: string, refuser: string) {
  return new Promise<boolean>((resoudre) =>
    poserQuestion({
      titre,
      texte,
      confirmer,
      refuser,
      onConfirmer: () => resoudre(true),
      onRefuser: () => resoudre(false),
    }),
  );
}

/**
 * La position du téléphone, ou `null` si elle est refusée ou indisponible.
 * `demander` à faux : on ne pose aucune question, la position n'est lue que si elle est déjà autorisée.
 * `demander` à vrai : la première fois, on explique à quoi elle sert avant la question du système
 * (un refus du système est presque définitif) ; si elle a été refusée pour de bon, on propose les Réglages.
 */
export async function maPosition(demander = true): Promise<Coordonnees | null> {
  try {
    const actuelle = await Location.getForegroundPermissionsAsync();
    let granted = actuelle.granted;
    if (!granted && demander) {
      if (actuelle.canAskAgain) {
        const accepte =
          Platform.OS === 'web' ||
          (await question(
            'Centrer la carte sur toi ?',
            'Ta position sert à montrer les sessions proches et les distances. Elle reste sur ton téléphone : on ne l’enregistre pas.',
            'Continuer',
            'Pas maintenant',
          ));
        if (!accepte) return null;
        granted = (await Location.requestForegroundPermissionsAsync()).granted;
      } else if (Platform.OS !== 'web') {
        const ouvrir = await question(
          'Position désactivée',
          'Pour centrer la carte sur toi, autorise la position de Catch dans les Réglages du téléphone.',
          'Ouvrir les Réglages',
          'Pas maintenant',
        );
        if (ouvrir) Linking.openSettings();
        return null;
      }
    }
    if (!granted) return null;
    const trouve =
      (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
    return { latitude: trouve.coords.latitude, longitude: trouve.coords.longitude };
  } catch {
    return null;
  }
}

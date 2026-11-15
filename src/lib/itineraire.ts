import { Linking, Platform } from 'react-native';

import type { Coordonnees } from '@/donnees/sessions';

/** Ouvre l'itinéraire vers un lieu dans l'app de cartes du téléphone (Plans sur iPhone, Google Maps ailleurs). */
export function ouvrirItineraire({ latitude, longitude }: Coordonnees) {
  const point = `${latitude},${longitude}`;
  const lien =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${point}`
      : `https://www.google.com/maps/dir/?api=1&destination=${point}`;
  Linking.openURL(lien).catch(() => {});
}

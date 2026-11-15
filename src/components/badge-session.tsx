import { StyleSheet, Text, View } from 'react-native';

import { PointEnDirect } from '@/components/pastille-session';
import { Couleurs, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres } from '@/lib/formats';

/** Badge « En direct » ou « Il manque 1 joueur ». Ne rend rien pour une session ordinaire. */
export function BadgeSession({ session }: { session: Session }) {
  if (estEnDirect(session)) {
    return (
      <View style={[styles.badge, { backgroundColor: Couleurs.rougeDoux }]}>
        <PointEnDirect couleur={Couleurs.rouge} />
        <Text style={[styles.texte, { color: Couleurs.rougeTexte }]}>En direct</Text>
      </View>
    );
  }
  if (placesLibres(session) === 1) {
    return (
      <View style={[styles.badge, { backgroundColor: Couleurs.orangeDoux }]}>
        <Text style={[styles.texte, { color: Couleurs.orangeTexte }]}>Il manque 1 joueur</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: Rayons.pilule,
  },
  texte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille },
});

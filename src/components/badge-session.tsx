import { StyleSheet, Text, View } from 'react-native';

import { PointEnDirect } from '@/components/pastille-session';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres } from '@/lib/formats';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Badge « En direct » ou « Il manque 1 joueur ». Ne rend rien pour une session ordinaire. */
export function BadgeSession({ session }: { session: Session }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  if (estEnDirect(session)) {
    return (
      <View style={[styles.badge, { backgroundColor: c.rougeDoux }]}>
        <PointEnDirect couleur={c.rouge} />
        <Text style={[styles.texte, { color: c.rougeTexte }]}>En direct</Text>
      </View>
    );
  }
  if (placesLibres(session) === 1) {
    return (
      <View style={[styles.badge, { backgroundColor: c.orangeDoux }]}>
        <Text style={[styles.texte, { color: c.orangeTexte }]}>Il manque 1 joueur</Text>
      </View>
    );
  }
  return null;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
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

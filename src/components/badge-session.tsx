import { StyleSheet, Text, View } from 'react-native';

import { PointEnDirect } from '@/components/pastille-session';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres } from '@/lib/formats';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Badge « En direct », « Il manque 1 joueur » ou « Presque plein » (2 places). Ne rend rien pour une session ordinaire. */
export function BadgeSession({ session }: { session: Session }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  if (estEnDirect(session)) {
    return (
      <View style={[styles.badge, { backgroundColor: c.rougeDoux }]}>
        <PointEnDirect couleur={c.rouge} />
        <Text maxFontSizeMultiplier={1.3} style={[styles.texte, { color: c.rougeTexte }]}>En direct</Text>
      </View>
    );
  }
  const libres = placesLibres(session);
  if (libres === 1 || libres === 2) {
    return (
      <View style={[styles.badge, { backgroundColor: c.orangeDoux }]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.texte, { color: c.orangeTexte }]}>
          {libres === 1 ? 'Il manque 1 joueur' : 'Presque plein'}
        </Text>
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

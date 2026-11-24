import { StyleSheet, Text, View } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { pointsDesPlaces } from '@/lib/formats';
import { useStyles, type Palette } from '@/lib/theme';

/**
 * Une ligne de points sous une session (idée de Mathias) : un point plein par joueur déjà là, rouge pour soi,
 * un point vide par place libre. On voit d'un coup d'œil si c'est presque plein.
 * Purement visuel : le texte à côté (« 3 places libres ») reste celui que lit VoiceOver.
 */
export function PointsPlaces({ session, taille = 9 }: { session: Session; taille?: number }) {
  const styles = useStyles(creerStyles);
  const { points, reste } = pointsDesPlaces(session);
  const forme = { width: taille, height: taille, borderRadius: taille / 2 };

  return (
    <View
      style={styles.ligne}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {points.map((point, i) => (
        <View key={i} style={[forme, styles[point]]} />
      ))}
      {reste > 0 && (
        <Text maxFontSizeMultiplier={1.3} style={styles.reste}>
          +{reste}
        </Text>
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ligne: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
    joueur: { backgroundColor: c.encre },
    toi: { backgroundColor: c.rouge },
    libre: { borderWidth: 1.5, borderColor: c.pointVide },
    reste: { marginLeft: 2, fontFamily: Polices.texteMoyen, fontSize: Tailles.minuscule, color: c.texteSecondaire },
  });

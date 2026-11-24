import { StyleSheet, Text, View } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { placesLibres, pointsDesPlaces } from '@/lib/formats';
import { useStyles, type Palette } from '@/lib/theme';

/** Il reste 1 ou 2 places : les cases libres passent en orange (le badge de la session dit « Presque plein ») */
export function presquePlein(session: Session) {
  const libres = placesLibres(session);
  return libres > 0 && libres <= 2;
}

/**
 * Les places d'une session en barre segmentée (finitions S2 + S3 choisies par Maxime le 24 novembre) :
 * une case foncée par joueur, rouge pour soi, une case claire par place libre (orange quand c'est presque plein),
 * et « 7/10 » à droite. Au-delà de 12 places, la barre s'arrête à 12 cases. VoiceOver lit le texte, pas les cases.
 */
export function BarrePlaces({ session }: { session: Session }) {
  const styles = useStyles(creerStyles);
  const { points } = pointsDesPlaces(session);
  const libres = placesLibres(session);
  const urgent = presquePlein(session);
  const nombre = Math.min(session.inscrits.length, session.joueurs);

  return (
    <View style={styles.ligne}>
      <View style={styles.cases} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {points.map((point, i) => (
          <View key={i} style={[styles.case, styles[point], point === 'libre' && urgent && styles.urgent]} />
        ))}
      </View>
      {libres === 0 ? (
        <Text maxFontSizeMultiplier={1.3} style={styles.complet}>
          Complet
        </Text>
      ) : (
        <Text
          maxFontSizeMultiplier={1.3}
          accessibilityLabel={`${nombre} sur ${session.joueurs}, ${libres} ${libres === 1 ? 'place' : 'places'}`}
          style={styles.compte}>
          {nombre}
          <Text style={styles.total}>/{session.joueurs}</Text>
        </Text>
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cases: { flex: 1, flexDirection: 'row', gap: 3 },
    case: { flex: 1, height: 12, borderRadius: 4 },
    joueur: { backgroundColor: c.encre },
    toi: { backgroundColor: c.rouge },
    libre: { backgroundColor: c.beige },
    urgent: { backgroundColor: c.orangeDoux, borderWidth: 1.5, borderColor: c.orange },
    compte: { minWidth: 44, textAlign: 'right', fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.rougeTexte },
    total: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },
    complet: { minWidth: 44, textAlign: 'right', fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

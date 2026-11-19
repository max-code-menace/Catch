import { StyleSheet, Text, View } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

/** Une partie d'une page de texte (confidentialité, conditions) : un titre et ses paragraphes. */
export function Partie({ titre, children }: { titre: string; children: React.ReactNode }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.partie}>
      <Text accessibilityRole="header" style={styles.titre}>
        {titre}
      </Text>
      {children}
    </View>
  );
}

export function Paragraphe({ children }: { children: React.ReactNode }) {
  const styles = useStyles(creerStyles);
  return <Text style={styles.texte}>{children}</Text>;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    partie: { gap: 8 },
    titre: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre },
    texte: { fontFamily: Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
  });

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarreNavigation, Espaces, Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

type Props = {
  titre: string;
  children?: React.ReactNode;
  /** Le contenu défile (à utiliser quand l'écran peut dépasser la hauteur du téléphone) */
  defile?: boolean;
};

/** Cadre commun des écrans : fond chaud, marges, titre, place réservée pour la barre du bas. */
export function Ecran({ titre, children, defile = false }: Props) {
  const styles = useStyles(creerStyles);
  if (defile) {
    return (
      <SafeAreaView style={[styles.fond, StyleSheet.absoluteFill]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.contenuDefilant}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.titre}>
            {titre}
          </Text>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.fond} edges={['top', 'left', 'right']}>
      <View style={styles.contenu}>
        <Text accessibilityRole="header" style={styles.titre}>
          {titre}
        </Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function Aide({ children }: { children: React.ReactNode }) {
  const styles = useStyles(creerStyles);
  return <Text style={styles.aide}>{children}</Text>;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { flex: 1, backgroundColor: c.fond },
    contenu: {
      flex: 1,
      paddingHorizontal: Espaces.marge,
      paddingTop: 24,
      paddingBottom: BarreNavigation.hauteur + BarreNavigation.margeBas + 24,
      gap: 12,
    },
    contenuDefilant: {
      flexGrow: 1,
      paddingHorizontal: Espaces.marge,
      paddingTop: 24,
      paddingBottom: BarreNavigation.hauteur + BarreNavigation.margeBas + 24,
      gap: 12,
    },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    aide: {
      fontFamily: Polices.texte,
      fontSize: Tailles.texte,
      lineHeight: 24,
      color: c.texteSecondaire,
    },
  });

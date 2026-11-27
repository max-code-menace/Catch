import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarreNavigation, RESERVE_BAS, Espaces, Polices, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

type Props = {
  titre: string;
  children?: React.ReactNode;
  /** Le contenu défile (à utiliser quand l'écran peut dépasser la hauteur du téléphone) */
  defile?: boolean;
  /** Bouton à droite du titre (menu du profil) */
  action?: React.ReactNode;
};

/**
 * Cadre commun des écrans : fond chaud, marges, titre, place réservée pour la barre du bas.
 * Calé sur toute la surface de l'onglet (absoluteFill) : sur le web, l'onglet grandit sinon avec son contenu.
 */
export function Ecran({ titre, children, defile = false, action }: Props) {
  const styles = useStyles(creerStyles);
  const entete = (
    <View style={styles.entete}>
      <Text accessibilityRole="header" style={styles.titre} numberOfLines={1}>
        {titre}
      </Text>
      {action}
    </View>
  );
  if (defile) {
    return (
      <SafeAreaView style={[styles.fond, StyleSheet.absoluteFill]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.contenuDefilant}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {entete}
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.fond, StyleSheet.absoluteFill]} edges={['top', 'left', 'right']}>
      <View style={styles.contenu}>
        {entete}
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
      paddingBottom: RESERVE_BAS + BarreNavigation.margeBas + 24,
      gap: 12,
    },
    contenuDefilant: {
      flexGrow: 1,
      paddingHorizontal: Espaces.marge,
      paddingTop: 24,
      paddingBottom: RESERVE_BAS + BarreNavigation.margeBas + 24,
      gap: 12,
    },
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    titre: { flexShrink: 1, fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    aide: {
      ...Polices.texte,
      fontSize: Tailles.texte,
      lineHeight: 24,
      color: c.texteSecondaire,
    },
  });

import { Stack, router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Espaces, Polices } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  titre: string;
  children: React.ReactNode;
  /** Écran présenté en feuille (Signaler) : pas de retour, un bouton « Fermer » à droite */
  modale?: boolean;
};

/**
 * Réglages de la vraie barre de titre du système (iOS : grand titre qui se réduit en défilant, chevron de retour).
 * Sur le web, une page ouverte par un lien n'a pas d'écran précédent : « Accueil » ramène à la carte.
 */
export function useOptionsEntete(titre: string, modale = false) {
  const c = useCouleurs();
  return {
    headerShown: true,
    title: titre,
    headerLargeTitle: Platform.OS === 'ios' && !modale,
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: c.fond },
    headerTintColor: c.rouge,
    headerTitleStyle: { fontFamily: Polices.titreDemi, color: c.encre },
    headerLargeTitleStyle: { fontFamily: Polices.titre, color: c.encre },
    headerBackButtonDisplayMode: 'minimal' as const,
    headerLeft:
      Platform.OS === 'web' && !router.canGoBack()
        ? () => (
            <Pressable accessibilityRole="link" onPress={() => router.replace('/')} hitSlop={8}>
              <Text style={{ fontFamily: Polices.texteDemi, color: c.rouge }}>Accueil</Text>
            </Pressable>
          )
        : undefined,
    headerRight: modale
      ? () => (
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
            <Text style={{ fontFamily: Polices.texteDemi, color: c.rouge }}>Fermer</Text>
          </Pressable>
        )
      : undefined,
  };
}

/** Cadre des écrans posés par-dessus les onglets (sans barre du bas) : barre de titre du système, contenu qui défile. */
export function EcranSecondaire({ titre, children, modale = false }: Props) {
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const options = useOptionsEntete(titre, modale);

  return (
    <>
      <Stack.Screen options={options} />
      <ScrollView
        style={styles.ecran}
        // Le contenu passe sous la barre de titre et le grand titre se réduit en défilant (iOS)
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.contenu, { paddingBottom: bottom + 24 }]}>
        {children}
      </ScrollView>
    </>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    contenu: { padding: Espaces.marge, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  });

import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeRetour } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = { titre: string; children: React.ReactNode };

/** Cadre des écrans posés par-dessus les onglets (sans barre du bas) : bouton retour, titre, contenu qui défile. */
export function EcranSecondaire({ titre, children }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top, bottom } = useSafeAreaInsets();

  function retour() {
    // Arrivé par un lien web : il n'y a pas d'écran précédent
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={[styles.ecran, { paddingTop: top + 8 }]}>
      <View style={styles.entete}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={retour}
          hitSlop={4}
          style={({ pressed }) => [styles.retour, pressed && styles.presse]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.titre}>
          {titre}
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.contenu, { paddingBottom: bottom + 24 }]}>
        {children}
      </ScrollView>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    entete: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
    retour: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presse: { backgroundColor: c.beige },
    titre: { flex: 1, fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    contenu: { padding: Espaces.marge, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  });

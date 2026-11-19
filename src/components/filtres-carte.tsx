import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Ce que montre la carte : tout, ou une seule famille */
export type FiltreCarte = 'tout' | 'sessions' | 'evenements' | 'lieux';

const FILTRES: { cle: FiltreCarte; titre: string }[] = [
  { cle: 'tout', titre: 'Tout' },
  { cle: 'sessions', titre: 'Sessions' },
  { cle: 'evenements', titre: 'Événements' },
  { cle: 'lieux', titre: 'Salles et terrains' },
];

/** Hauteur de la rangée de filtres, marge comprise : les panneaux se placent dessous */
export const HAUTEUR_FILTRES_CARTE = 44;

/** Rangée de filtres flottante sous la barre du haut, sur la carte seulement. */
export function FiltresCarte({ filtre, onChoisir }: { filtre: FiltreCarte; onChoisir: (f: FiltreCarte) => void }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.rangee, { top: top + HAUTEUR_BARRE_HAUT + 2 }]}
      contentContainerStyle={styles.contenu}>
      {FILTRES.map(({ cle, titre }) => {
        const actif = cle === filtre;
        return (
          <Pressable
            key={cle}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => {
              if (actif) return;
              vibrer.selection();
              onChoisir(cle);
            }}
            style={({ pressed }) => [styles.filtre, actif && styles.filtreActif, pressed && { opacity: 0.8 }]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.texte, actif && { color: c.surEncre }]}>
              {titre}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    rangee: { position: 'absolute', left: 0, right: 0, flexGrow: 0 },
    // Un peu d'air en bas pour que les ombres ne soient pas coupées
    contenu: { gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
    filtre: {
      height: 36,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombrePetite,
    },
    filtreActif: { backgroundColor: c.encre, borderColor: c.encre },
    texte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
  });

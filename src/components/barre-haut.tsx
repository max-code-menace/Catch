import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeCarte, IconeEtoile, IconeListe } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

export type Vue = 'carte' | 'liste';

type Props = {
  zone: string;
  vue: Vue;
  onBasculer: () => void;
  /** Nombre de sports choisis quand la carte est filtrée (0 : elle montre tout) */
  nombreSports: number;
  /** Lu par VoiceOver sur l'étoile */
  descriptionSports: string;
  onMesSports: () => void;
};

/** Hauteur occupée par la barre du haut, marge comprise : sert à décaler la liste. */
export const HAUTEUR_BARRE_HAUT = 68;

/** Barre flottante du haut : logo, zone, bascule Liste / Carte, étoile « Mes sports ». */
export function BarreHaut({ zone, vue, onBasculer, nombreSports, descriptionSports, onMesSports }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const versListe = vue === 'carte';
  const Icone = versListe ? IconeListe : IconeCarte;

  return (
    <View style={[styles.barre, { top: top + 8 }]}>
      <Text maxFontSizeMultiplier={1.3} style={styles.logo}>catch</Text>
      <View style={styles.separateur} />
      <Text maxFontSizeMultiplier={1.3} style={styles.zone} numberOfLines={1}>
        {zone}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={versListe ? 'Voir la liste' : 'Voir la carte'}
        onPress={onBasculer}
        style={({ pressed }) => [styles.bascule, pressed && styles.presse]}>
        <Icone couleur={c.encre} taille={18} />
        <Text maxFontSizeMultiplier={1.3} style={styles.basculeTexte}>{versListe ? 'Liste' : 'Carte'}</Text>
      </Pressable>
      {/* L'étoile garde sa place en vue liste : le filtre vaut aussi pour la liste */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={descriptionSports}
        accessibilityHint="Passe de tes sports à tous les sports"
        onPress={onMesSports}
        hitSlop={4}
        style={({ pressed }) => [styles.etoile, nombreSports > 0 && styles.etoileActive, pressed && styles.presse]}>
        <IconeEtoile couleur={nombreSports > 0 ? c.rouge : c.encre} taille={22} pleine={nombreSports > 0} />
        {nombreSports > 0 && (
          <View style={styles.compteur}>
            <Text maxFontSizeMultiplier={1.2} style={styles.compteurTexte}>
              {nombreSports}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    barre: {
      position: 'absolute',
      left: 12,
      right: 12,
      height: 52,
      paddingLeft: 16,
      paddingRight: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombre,
    },
    logo: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.rouge },
    separateur: { width: 1, height: 20, backgroundColor: c.trait },
    zone: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    bascule: {
      height: 40,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: Rayons.pilule,
      backgroundColor: c.fond,
      borderWidth: 1,
      borderColor: c.trait,
    },
    basculeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    etoile: {
      width: Espaces.cibleTactile,
      height: 40,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.fond,
      borderWidth: 1,
      borderColor: c.trait,
    },
    etoileActive: { backgroundColor: c.rougeDoux, borderColor: c.rougeBordure },
    compteur: {
      position: 'absolute',
      top: -5,
      right: -3,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
      borderWidth: 2,
      borderColor: c.carte,
    },
    compteurTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surRouge },
    presse: { backgroundColor: c.beige },
  });

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeCarte, IconeListe } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

export type Vue = 'carte' | 'liste';

type Props = {
  vue: Vue;
  onBasculer: () => void;
  /** Sports choisis quand la carte est filtrée (vide : elle montre tout) */
  sports: Sport[];
  /** « Tous les sports » ou « Foot, padel » : lu à voix haute aussi */
  libelle: string;
  menuOuvert: boolean;
  onMenu: () => void;
};

/** Hauteur occupée par la barre du haut, marge comprise : sert à décaler la liste et les messages. */
export const HAUTEUR_BARRE_HAUT = 62;
/** Hauteur de la pastille et du rond Liste / Carte */
export const HAUTEUR_PASTILLE = 46;
/** Nombre de pictos montrés dans la pastille quand on a choisi des sports */
const PICTOS_MONTRES = 3;

/**
 * Barre du haut (finition B2, choisie par Maxime le 24 novembre) : une pastille avec le logo et le filtre
 * (« Tous les sports » ou les pictos et les noms des sports choisis), qui ouvre le menu des sports, et un rond
 * Liste / Carte à côté, en un toucher.
 */
export function BarreHaut({ vue, onBasculer, sports, libelle, menuOuvert, onMenu }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const versListe = vue === 'carte';
  const Icone = versListe ? IconeListe : IconeCarte;

  return (
    <View pointerEvents="box-none" style={[styles.barre, { top: top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sports : ${libelle}`}
        accessibilityHint="Choisir les sports à montrer"
        accessibilityState={{ expanded: menuOuvert }}
        onPress={onMenu}
        style={({ pressed }) => [styles.pastille, pressed && styles.presse]}>
        <Text maxFontSizeMultiplier={1.3} style={styles.logo}>
          catch
        </Text>
        <View style={styles.separateur} />
        {sports.length > 0 && (
          <View style={styles.pictos}>
            {sports.slice(0, PICTOS_MONTRES).map((sport, i) => (
              <View key={sport} style={[styles.rondPicto, i > 0 && styles.recouvert]}>
                <PictoSport sport={sport} taille={18} />
              </View>
            ))}
          </View>
        )}
        <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.libelle}>
          {libelle}
        </Text>
        <View style={{ transform: [{ rotate: menuOuvert ? '180deg' : '0deg' }] }}>
          <Chevron couleur={c.encre} />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={versListe ? 'Voir la liste' : 'Voir la carte'}
        onPress={onBasculer}
        style={({ pressed }) => [styles.rond, pressed && styles.presse]}>
        <Icone couleur={c.encre} taille={20} />
      </Pressable>
    </View>
  );
}

/** Petite flèche vers le bas, comme celle d'un menu déroulant */
function Chevron({ couleur }: { couleur: string }) {
  return (
    <View style={{ width: 12, height: 8, alignItems: 'center' }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: couleur,
          transform: [{ rotate: '45deg' }],
          marginTop: -2,
        }}
      />
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    barre: {
      position: 'absolute',
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    pastille: {
      flexShrink: 1,
      height: HAUTEUR_PASTILLE,
      paddingLeft: 16,
      paddingRight: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombre,
    },
    logo: { fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.rouge },
    separateur: { width: 1, height: 20, backgroundColor: c.trait },
    pictos: { flexDirection: 'row', paddingLeft: 6 },
    rondPicto: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
      borderWidth: 1,
      borderColor: c.trait,
    },
    recouvert: { marginLeft: -6 },
    libelle: { flexShrink: 1, fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    rond: {
      width: HAUTEUR_PASTILLE,
      height: HAUTEUR_PASTILLE,
      borderRadius: HAUTEUR_PASTILLE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombre,
      minWidth: Espaces.cibleTactile,
    },
    presse: { backgroundColor: c.beige },
  });

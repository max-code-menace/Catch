import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { IconeEtoile } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { vibrer } from '@/lib/haptics';
import { SPORTS_A_CHOISIR, useMesSports } from '@/lib/mes-sports';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Ce que la carte montre en plus des sports : sessions, événements, salles et terrains */
export type TypeCarte = 'sessions' | 'evenements' | 'lieux';
export type TypesCarte = Record<TypeCarte, boolean>;
export const TOUS_LES_TYPES: TypesCarte = { sessions: true, evenements: true, lieux: true };

const TYPES: { cle: TypeCarte; titre: string }[] = [
  { cle: 'sessions', titre: 'Sessions' },
  { cle: 'evenements', titre: 'Événements' },
  { cle: 'lieux', titre: 'Lieux' },
];

type Props = {
  onFermer: () => void;
  types: TypesCarte;
  onTypes: (types: TypesCarte) => void;
  /** Sessions du rayon, par sport : le petit nombre dans chaque tuile */
  comptes: Partial<Record<Sport, number>>;
  /** « Bruxelles · 5 km », rappelé en bas du menu */
  zone: string;
};

/**
 * Menu sous la pastille du haut : « Tous » et une tuile par sport (avec le nombre de sessions), puis ce qu'on affiche.
 * Un toucher change le filtre tout de suite ; on le ferme en touchant la carte. Remplace l'étoile et sa feuille.
 */
export function MenuFiltre({ onFermer, types, onTypes, comptes, zone }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const { sports, tous, basculer, choisirSeul, setTous } = useMesSports();
  const filtre = !tous && sports.length > 0;

  function toucherSport(sport: Sport) {
    vibrer.selection();
    // Depuis « Tous les sports », un toucher choisit ce sport seul ; ensuite on ajoute ou on retire
    if (filtre) basculer(sport);
    else choisirSeul(sport);
  }

  function toucherTous() {
    if (!filtre) return;
    vibrer.selection();
    setTous(true);
  }

  function basculerType(cle: TypeCarte) {
    const nouveau = { ...types, [cle]: !types[cle] };
    // Au moins une chose à montrer : on ne peut pas tout décocher
    if (!nouveau.sessions && !nouveau.evenements && !nouveau.lieux) return;
    vibrer.selection();
    onTypes(nouveau);
  }

  return (
    <>
      <Pressable accessibilityLabel="Fermer le menu des sports" style={StyleSheet.absoluteFill} onPress={onFermer} />
      <Animated.View
        entering={FadeIn.duration(Durees.fast)}
        exiting={FadeOut.duration(Durees.instant)}
        style={[styles.menu, { top: top + HAUTEUR_BARRE_HAUT }]}>
        <ScrollView style={styles.defile} contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
          <View style={styles.grille}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tous les sports"
              accessibilityState={{ selected: !filtre }}
              onPress={toucherTous}
              style={({ pressed }) => [styles.tuile, !filtre && styles.tuileChoisie, pressed && { opacity: 0.8 }]}>
              <IconeEtoile couleur={!filtre ? c.rougeTexte : c.encre} taille={28} />
              <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.tuileTexte, !filtre && { color: c.rougeTexte }]}>
                Tous
              </Text>
            </Pressable>
            {SPORTS_A_CHOISIR.map((fiche) => {
              const choisi = filtre && sports.includes(fiche.cle);
              const nombre = comptes[fiche.cle] ?? 0;
              return (
                <Pressable
                  key={fiche.cle}
                  accessibilityRole="button"
                  accessibilityLabel={`${fiche.nom}${nombre ? `, ${nombre} ${nombre > 1 ? 'sessions' : 'session'}` : ''}`}
                  accessibilityState={{ selected: choisi }}
                  onPress={() => toucherSport(fiche.cle)}
                  style={({ pressed }) => [styles.tuile, choisi && styles.tuileChoisie, pressed && { opacity: 0.8 }]}>
                  {nombre > 0 && (
                    <Text maxFontSizeMultiplier={1.2} style={styles.nombre}>
                      {nombre}
                    </Text>
                  )}
                  <PictoSport sport={fiche.cle} taille={30} />
                  <Text
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                    style={[styles.tuileTexte, choisi && { color: c.rougeTexte }]}>
                    {fiche.nomTuile ?? fiche.nom}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        </ScrollView>
        <View style={styles.puces}>
          {TYPES.map(({ cle, titre }) => {
            const actif = types[cle];
            return (
              <Pressable
                key={cle}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                onPress={() => basculerType(cle)}
                style={({ pressed }) => [styles.puce, actif && styles.puceActive, pressed && { opacity: 0.8 }]}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.puceTexte, actif && { color: c.surEncre }]}>
                  {titre}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.zone}>
          {zone}
        </Text>
      </Animated.View>
    </>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      left: 12,
      right: 12,
      maxHeight: '62%',
      padding: 12,
      gap: 8,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    defile: { flexGrow: 0, flexShrink: 1 },
    contenu: { gap: 12 },
    grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 8 },
    tuile: {
      // 4 par rangée ; la dernière reste alignée à gauche
      width: '23.5%',
      height: 68,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.trait,
      backgroundColor: c.fond,
    },
    tuileChoisie: { borderColor: c.rouge, backgroundColor: c.rougeDoux },
    tuileTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille, color: c.encre },
    nombre: {
      position: 'absolute',
      top: 5,
      right: 8,
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.minuscule,
      color: c.texteSecondaire,
    },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    puce: {
      minHeight: 40,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    puceActive: { backgroundColor: c.encre, borderColor: c.encre },
    puceTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    zone: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire, textAlign: 'center' },
  });

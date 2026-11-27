import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { IconeEtoile } from '@/components/icones';
import { TuileSport } from '@/components/tuile-sport';
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
            <TuileSport
              icone={<IconeEtoile couleur={!filtre ? c.rougeTexte : c.encre} taille={26} />}
              nom="Tous"
              description="Tous les sports"
              choisie={!filtre}
              largeur="23.5%"
              onPress={toucherTous}
            />
            {SPORTS_A_CHOISIR.map((fiche) => {
              const nombre = comptes[fiche.cle] ?? 0;
              return (
                <TuileSport
                  key={fiche.cle}
                  sport={fiche.cle}
                  nom={fiche.nomTuile ?? fiche.nom}
                  description={`${fiche.nom}${nombre ? `, ${nombre} ${nombre > 1 ? 'sessions' : 'session'}` : ''}`}
                  choisie={filtre && sports.includes(fiche.cle)}
                  largeur="23.5%"
                  nombre={nombre}
                  onPress={() => toucherSport(fiche.cle)}
                />
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
    grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 10 },
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
    puceTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    zone: { ...Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire, textAlign: 'center' },
  });

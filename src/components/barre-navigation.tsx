import { usePathname } from "expo-router";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BarreNavigation as Mesures,
  Durees,
  Polices,
  Rayons,
  Ressorts,
  Tailles,
} from "@/constants/theme";
import { IconeCreer } from "@/components/icones";
import { useCouleurs, useStyles, type Palette } from "@/lib/theme";

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

type OngletProps = Omit<TabTriggerSlotProps, "ref"> & {
  ref?: React.Ref<any>;
  titre: string;
  Icone: Icone;
  /** Nombre affiché en pastille sur l'icône (messages non lus) */
  pastille?: number;
};

export function Onglet({
  titre,
  Icone,
  pastille = 0,
  isFocused,
  onPressIn,
  onPressOut,
  style,
  ...props
}: OngletProps) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const echelle = useSharedValue(1);
  const actif = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    actif.set(withTiming(isFocused ? 1 : 0, { duration: Durees.standard }));
  }, [isFocused, actif]);

  const styleOnglet = useAnimatedStyle(() => ({
    transform: [{ scale: echelle.get() }],
  }));
  const styleFond = useAnimatedStyle(() => ({ opacity: actif.get() }));
  const couleur = isFocused ? c.surRouge : c.texteSecondaire;

  return (
    <PressableAnime
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={
        pastille > 0 ? `${titre}, ${pastille} non lus` : titre
      }
      onPressIn={(e) => {
        echelle.set(withSpring(0.96, Ressorts.snappy));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        echelle.set(withSpring(1, Ressorts.snappy));
        onPressOut?.(e);
      }}
      style={[styles.onglet, styleOnglet]}
      {...props}
    >
      <Animated.View style={[styles.fondActif, styleFond]} />
      <View>
        <Icone couleur={couleur} taille={22} />
        {pastille > 0 && (
          <View style={styles.pastille}>
            <Text maxFontSizeMultiplier={1.3} style={styles.pastilleTexte}>
              {pastille > 9 ? "9+" : pastille}
            </Text>
          </View>
        )}
      </View>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.titre, { color: couleur }]}
      >
        {titre}
      </Text>
    </PressableAnime>
  );
}

type BoutonCreerProps = Omit<TabTriggerSlotProps, "ref"> & {
  ref?: React.Ref<any>;
};

/**
 * Bouton « + Créer » rouge orangé, compact et centré au-dessus de la barre flottante.
 * Caché sur l'écran Créer lui-même (son bouton « Publier » prend la place) et sur Messages.
 */
export function BoutonCreer({
  isFocused,
  onPressIn,
  onPressOut,
  style,
  ...props
}: BoutonCreerProps) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({
    transform: [{ scale: echelle.get() }],
  }));

  // Visible seulement sur Carte, Mes sessions et Profil (pas sur Messages ni sur Créer)
  // (Le contexte des onglets n'est pas fourni ici : il restait vide et cachait le bouton partout. On lit le chemin.)
  const chemin = usePathname();
  const surUnOngletAutorise = ["/", "/index", "/mes-sessions", "/profil"].includes(chemin);
  if (isFocused || !surUnOngletAutorise) return null;

  return (
    // Bande pleine largeur qui laisse passer les touchers : seul le bouton au milieu les prend
    <View
      pointerEvents="box-none"
      style={[
        styles.bandeCreer,
        {
          bottom:
            Math.max(bottom, Mesures.margeBas) +
            Mesures.hauteur +
            Mesures.ecartCreer,
        },
      ]}
    >
      <PressableAnime
        accessibilityRole="button"
        accessibilityLabel="Créer une session"
        onPressIn={(e) => {
          echelle.set(withSpring(0.96, Ressorts.snappy));
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          echelle.set(withSpring(1, Ressorts.snappy));
          onPressOut?.(e);
        }}
        style={[styles.creer, styleAnime]}
        {...props}
      >
        <IconeCreer couleur={c.surCreer} taille={22} />
        <Text maxFontSizeMultiplier={1.3} style={styles.creerTexte}>
          Créer
        </Text>
      </PressableAnime>
    </View>
  );
}

/** Style de la pilule blanche flottante, à poser sur <TabList> dans src/app/_layout.tsx. */
export function useStyleBarre() {
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  return [styles.barre, { bottom: Math.max(bottom, Mesures.margeBas) }];
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    barre: {
      position: "absolute",
      left: Mesures.margeCotes,
      right: Mesures.margeCotes,
      height: Mesures.hauteur,
      padding: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    onglet: {
      // Chaque onglet part de la largeur de son texte (« Mes sessions » est plus long), puis le reste est partagé
      flexGrow: 1,
      flexBasis: "auto",
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderRadius: Rayons.pilule,
    },
    pastille: {
      position: "absolute",
      top: -5,
      right: -10,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: Rayons.pilule,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.rouge,
      borderWidth: 2,
      borderColor: c.carte,
    },
    pastilleTexte: {
      ...Polices.texteDemi,
      fontSize: Tailles.minuscule,
      lineHeight: 12,
      color: c.surRouge,
    },
    fondActif: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: c.rouge,
      borderRadius: Rayons.pilule,
    },
    titre: { ...Polices.texteMoyen, fontSize: Tailles.micro },
    bandeCreer: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    creer: {
      height: Mesures.hauteurCreer,
      paddingLeft: 22,
      paddingRight: 26,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: Rayons.pilule,
      // Couleur unie si le dégradé n'est pas pris en charge
      backgroundColor: c.creerFin,
      experimental_backgroundImage: `linear-gradient(90deg, ${c.creerDebut}, ${c.creerFin})`,
      boxShadow: c.ombreFlottante,
    },
    creerTexte: {
      ...Polices.texteDemi,
      fontSize: Tailles.accent,
      color: c.surCreer,
    },
  });

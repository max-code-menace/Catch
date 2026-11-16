import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeSession } from '@/components/badge-session';
import { Bouton } from '@/components/bouton';
import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { PictoSport } from '@/components/picto-sport';
import {
  BarreNavigation,
  Durees,
  Espaces,
  Polices,
  Rayons,
  Ressorts,
  Tailles,
} from '@/constants/theme';
import type { Coordonnees, Session } from '@/donnees/sessions';
import {
  distance,
  estEnDirect,
  heure,
  placesLibres,
  quand,
  texteDistance,
  textePlaces,
} from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Filtre = 'toutes' | 'direct' | 'manque';

const FILTRES: { cle: Filtre; titre: string }[] = [
  { cle: 'toutes', titre: 'Toutes' },
  { cle: 'direct', titre: 'En direct' },
  { cle: 'manque', titre: 'Il manque un joueur' },
];

const VIDES: Record<Filtre, string> = {
  toutes: 'Aucune session pour l’instant.',
  direct: 'Aucune session en direct pour l’instant.',
  manque: 'Aucune session ne cherche de joueur pour l’instant.',
};

const PressableAnime = Animated.createAnimatedComponent(Pressable);

/** Troisième ligne d'une carte : qui joue, ce qui reste à prendre. */
function resume(session: Session) {
  if (estEnDirect(session)) return `${session.inscrits.length} jouent · ${textePlaces(session)}`;
  if (placesLibres(session) === 1) return `${session.organisateur} cherche 1 joueur`;
  return textePlaces(session) + (session.debutantsBienvenus ? ' · débutants bienvenus' : '');
}

function CarteSession({
  session,
  origine,
  onPress,
}: {
  session: Session;
  origine: Coordonnees;
  onPress: () => void;
}) {
  const styles = useStyles(creerStyles);
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));
  const enDirect = estEnDirect(session);
  const moment = enDirect ? `Jusqu'à ${heure(session.fin)}` : quand(session.debut);

  return (
    <PressableAnime
      accessibilityRole="button"
      onPressIn={() => echelle.set(withSpring(0.98, Ressorts.snappy))}
      onPressOut={() => echelle.set(withSpring(1, Ressorts.snappy))}
      onPress={onPress}
      style={[styles.carte, styleAnime]}>
      <View style={styles.entete}>
        <BadgeSession session={session} />
        <Text style={styles.moment}>{moment}</Text>
      </View>
      <View style={styles.corps}>
        <View style={styles.picto}>
          <PictoSport sport={session.sport} taille={36} />
        </View>
        <View style={styles.textes}>
          <Text style={styles.titre} numberOfLines={1}>
            {session.titre}
          </Text>
          <Text style={styles.aide} numberOfLines={1}>
            {session.lieu}, {session.commune} · {texteDistance(distance(origine, session.position))}
          </Text>
          <Text style={styles.resume} numberOfLines={1}>
            {resume(session)}
          </Text>
        </View>
      </View>
    </PressableAnime>
  );
}

type Props = {
  sessions: Session[];
  origine: Coordonnees;
  onOuvrir: (session: Session) => void;
  /** Tirer la liste vers le bas relit les sessions */
  onRafraichir: () => Promise<void>;
  /** Rien dans le rayon, mais des sessions un peu plus loin : le bouton pour aller les voir */
  plusLoin?: { titre: string; onPress: () => void };
};

/** Liste des sessions du rayon, posée par-dessus la carte : par date, et à la même heure la plus proche d'abord. */
export function ListeSessions({ sessions, origine, onOuvrir, onRafraichir, plusLoin }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top, bottom } = useSafeAreaInsets();
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [relecture, setRelecture] = useState(false);

  const visibles = sessions
    .filter((s) => {
      if (filtre === 'direct') return estEnDirect(s);
      if (filtre === 'manque') return !estEnDirect(s) && placesLibres(s) === 1;
      return true;
    })
    .sort(
      (a, b) =>
        a.debut.getTime() - b.debut.getTime() ||
        distance(origine, a.position) - distance(origine, b.position),
    );

  return (
    <Animated.View
      entering={FadeIn.duration(Durees.standard)}
      exiting={FadeOut.duration(Durees.standard)}
      style={[StyleSheet.absoluteFill, styles.fond]}>
      <FlatList
        data={visibles}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingTop: top + HAUTEUR_BARRE_HAUT + 8,
          paddingBottom: Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + 24,
          paddingHorizontal: Espaces.marge,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={styles.filtres}>
            {FILTRES.map(({ cle, titre }) => {
              const actif = cle === filtre;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => {
                    if (!actif) vibrer.selection();
                    setFiltre(cle);
                  }}
                  style={[styles.filtre, actif && styles.filtreActif]}>
                  <Text style={[styles.filtreTexte, actif && { color: c.surEncre }]}>
                    {titre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        }
        refreshing={relecture}
        onRefresh={async () => {
          setRelecture(true);
          await onRafraichir();
          setRelecture(false);
        }}
        progressViewOffset={top + HAUTEUR_BARRE_HAUT}
        ListEmptyComponent={
          <View style={styles.videZone}>
            <Text style={styles.vide}>{VIDES[filtre]}</Text>
            {filtre === 'toutes' && plusLoin && (
              <Bouton variante="secondaire" titre={plusLoin.titre} onPress={plusLoin.onPress} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CarteSession session={item} origine={origine} onPress={() => onOuvrir(item)} />
        )}
      />
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fond },
    filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
    filtre: {
      height: 40,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    filtreActif: { backgroundColor: c.encre, borderColor: c.encre },
    filtreTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: c.encre },
    carte: {
      padding: 16,
      gap: 10,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    entete: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 26,
    },
    moment: {
      marginLeft: 'auto',
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
    },
    corps: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    picto: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textes: { flex: 1, gap: 2 },
    titre: { fontFamily: Polices.titreDemi, fontSize: 19, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    resume: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.encre },
    videZone: { gap: 16 },
    vide: {
      paddingTop: 48,
      textAlign: 'center',
      fontFamily: Polices.texte,
      fontSize: Tailles.texte,
      color: c.texteSecondaire,
    },
  });

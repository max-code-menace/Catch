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
import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { PictoSport } from '@/components/picto-sport';
import {
  BarreNavigation,
  Couleurs,
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
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const enDirect = estEnDirect(session);
  const moment = enDirect ? `Jusqu'à ${heure(session.fin)}` : quand(session.debut);

  return (
    <PressableAnime
      accessibilityRole="button"
      onPressIn={() => (echelle.value = withSpring(0.98, Ressorts.snappy))}
      onPressOut={() => (echelle.value = withSpring(1, Ressorts.snappy))}
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
};

/** Liste des sessions, posée par-dessus la carte : en direct d'abord, puis par date. */
export function ListeSessions({ sessions, origine, onOuvrir }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [filtre, setFiltre] = useState<Filtre>('toutes');

  const visibles = sessions
    .filter((s) => {
      if (filtre === 'direct') return estEnDirect(s);
      if (filtre === 'manque') return !estEnDirect(s) && placesLibres(s) === 1;
      return true;
    })
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

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
                  <Text style={[styles.filtreTexte, actif && { color: Couleurs.carte }]}>
                    {titre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        }
        ListEmptyComponent={<Text style={styles.vide}>{VIDES[filtre]}</Text>}
        renderItem={({ item }) => (
          <CarteSession session={item} origine={origine} onPress={() => onOuvrir(item)} />
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: Couleurs.fond },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  filtre: {
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Rayons.pilule,
    backgroundColor: Couleurs.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
  },
  filtreActif: { backgroundColor: Couleurs.encre, borderColor: Couleurs.encre },
  filtreTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: Couleurs.encre },
  carte: {
    padding: 16,
    gap: 10,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
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
    color: Couleurs.texteSecondaire,
  },
  corps: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  picto: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Couleurs.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 2 },
  titre: { fontFamily: Polices.titreDemi, fontSize: 19, color: Couleurs.encre },
  aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: Couleurs.texteSecondaire },
  resume: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: Couleurs.encre },
  vide: {
    paddingTop: 48,
    textAlign: 'center',
    fontFamily: Polices.texte,
    fontSize: Tailles.texte,
    color: Couleurs.texteSecondaire,
  },
});

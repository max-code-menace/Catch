import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { IconeChevron, IconeCreer } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { BarreNavigation, RESERVE_BAS, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import type { Session } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { quand, texteDistance, textePlaces } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { lienDuLieu, texteType, type LieuSport } from '@/lib/lieux-sport';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  lieu: LieuSport;
  /** Distance en mètres depuis l'utilisateur (ou le centre de la zone) */
  distance: number;
  /** Sessions prévues à ce lieu */
  sessions: Session[];
  onOuvrirSession: (session: Session) => void;
  /** Ouvre Créer avec ce sport et ce lieu remplis */
  onLancer: (sport: Sport) => void;
};

/** Fiche d'un lieu touché sur la carte : ce qu'on y joue, gratuit ou payant, où, et ce qui y est prévu. */
export function FicheLieu({ lieu, distance, sessions, onOuvrirSession, onLancer }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const [sport, setSport] = useState<Sport>(lieu.sports[0]);
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;
  const plusieurs = lieu.sports.length > 1;
  const lien = lienDuLieu(lieu, sport);

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <View style={styles.ligne}>
        <View style={[styles.badge, lieu.type === 'payant' && styles.badgePayant]}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={[styles.badgeTexte, lieu.type === 'payant' && { color: c.surEncre }]}>
            {texteType(lieu)}
          </Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
          {texteDistance(distance)}
        </Text>
      </View>

      <View style={styles.titreZone}>
        <View style={styles.picto}>
          <PictoSport sport={sport} taille={30} />
        </View>
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={1.3} style={styles.titre} numberOfLines={2}>
            {lieu.nom}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.aide} numberOfLines={1}>
            {lieu.adresse === lieu.nom ? lieu.commune : `${lieu.adresse}, ${lieu.commune}`}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sports}>
        {lieu.sports.map((cle) => {
          const actif = plusieurs && cle === sport;
          return (
            <Pressable
              key={cle}
              disabled={!plusieurs}
              accessibilityRole={plusieurs ? 'button' : 'text'}
              accessibilityState={plusieurs ? { selected: actif } : undefined}
              onPress={() => {
                if (cle === sport) return;
                vibrer.selection();
                setSport(cle);
              }}
              style={[styles.sport, actif && styles.sportActif]}>
              <PictoSport sport={cle} taille={18} />
              <Text maxFontSizeMultiplier={1.3} style={[styles.sportTexte, actif && { color: c.rougeTexte }]}>
                {ficheSport(cle).nom}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {sessions.length > 0 ? (
        <View style={styles.prevues}>
          <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>
            Prévu ici
          </Text>
          {sessions.slice(0, 3).map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              onPress={() => onOuvrirSession(session)}
              style={({ pressed }) => [styles.prevue, pressed && { opacity: 0.7 }]}>
              <PictoSport sport={session.sport} taille={20} />
              <Text maxFontSizeMultiplier={1.3} style={styles.prevueTexte} numberOfLines={1}>
                {session.titre} · {quand(session.debut).toLowerCase()} · {textePlaces(session)}
              </Text>
              <IconeChevron couleur={c.texteSecondaire} taille={16} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
          Aucune session prévue ici pour l’instant.
        </Text>
      )}

      <View style={styles.actions}>
        <Bouton
          style={styles.action}
          titre="Lancer une session ici"
          accessibilityLabel={`Lancer une session de ${ficheSport(sport).nom} ici`}
          Icone={IconeCreer}
          onPress={() => onLancer(sport)}
        />
        {lien && (
          <Bouton
            titre={lien.titre}
            variante="secondaire"
            accessibilityLabel={
              lien.reservation
                ? `Réserver : ${ficheSport(sport).nom.toLowerCase()} à ${lieu.nom}`
                : `Site de ${lieu.nom}`
            }
            onPress={() => Linking.openURL(lien.url).catch(() => {})}
          />
        )}
      </View>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fiche: {
      position: 'absolute',
      left: 12,
      right: 12,
      padding: 16,
      gap: 10,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
    },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      height: 26,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
    },
    badgePayant: { backgroundColor: c.encre },
    badgeTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.encre },
    aide: { ...Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    titreZone: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    textes: { flex: 1, gap: 2 },
    picto: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
    sports: { gap: 6 },
    sport: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingLeft: 6,
      paddingRight: 10,
      height: 32,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.carte,
    },
    sportActif: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    sportTexte: { ...Polices.texteMoyen, fontSize: Tailles.pastille, color: c.encre },
    prevues: { gap: 4 },
    etiquette: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    prevue: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
    prevueTexte: { flex: 1, ...Polices.texteMoyen, fontSize: Tailles.aide, color: c.encre },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    action: { flex: 1 },
  });

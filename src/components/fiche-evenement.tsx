import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { IconeChevron, IconeDrapeau } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { BarreNavigation, RESERVE_BAS, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import type { Evenement } from '@/lib/evenements';
import { quand, texteDistance, textePlaces } from '@/lib/formats';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  evenement: Evenement;
  /** Distance en mètres depuis l'utilisateur (ou le centre de la zone) jusqu'au départ */
  distance: number;
  /** Sessions qui y vont ensemble */
  sessions: Session[];
  onOuvrirSession: (session: Session) => void;
  /** Ouvre Créer avec une session au départ, rattachée à l'événement */
  onEnsemble: () => void;
};

/** Fiche d'un événement touché sur la carte : quoi, quand, où, le lien pour s'inscrire, et qui y va ensemble. */
export function FicheEvenement({ evenement, distance, sessions, onOuvrirSession, onEnsemble }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <View style={styles.ligne}>
        <View style={styles.badge}>
          <IconeDrapeau couleur={c.surEncre} taille={14} />
          <Text maxFontSizeMultiplier={1.3} style={styles.badgeTexte}>
            Événement
          </Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
          {texteDistance(distance)}
        </Text>
      </View>

      <View style={styles.titreZone}>
        <View style={styles.picto}>
          <PictoSport sport={evenement.sport} taille={30} />
        </View>
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={1.3} style={styles.titre} numberOfLines={2}>
            {evenement.nom}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.quand} numberOfLines={1}>
            {quand(evenement.debut)}
            {evenement.detail ? ` · ${evenement.detail}` : ''}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.aide} numberOfLines={1}>
            Départ : {evenement.depart}, {evenement.commune}
          </Text>
        </View>
      </View>

      {sessions.length > 0 ? (
        <View style={styles.prevues}>
          <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>
            Ils y vont ensemble
          </Text>
          {sessions.slice(0, 3).map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              onPress={() => onOuvrirSession(session)}
              style={({ pressed }) => [styles.prevue, pressed && { opacity: 0.7 }]}>
              <PictoSport sport={session.sport} taille={20} />
              <Text maxFontSizeMultiplier={1.3} style={styles.prevueTexte} numberOfLines={1}>
                Avec {session.organisateur} · {quand(session.debut).toLowerCase()} · {textePlaces(session)}
              </Text>
              <IconeChevron couleur={c.texteSecondaire} taille={16} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text maxFontSizeMultiplier={1.3} style={styles.aide}>
          Personne n’y va encore en groupe. Crée la première session.
        </Text>
      )}

      <View style={styles.actions}>
        <Bouton
          style={styles.action}
          titre="On y va ensemble"
          accessibilityLabel={`Créer une session de ${ficheSport(evenement.sport).nom.toLowerCase()} pour ${evenement.nom}`}
          onPress={onEnsemble}
        />
        <Bouton
          titre="S’inscrire"
          variante="secondaire"
          accessibilityLabel={`S’inscrire à ${evenement.nom} sur le site officiel`}
          onPress={() => Linking.openURL(evenement.lien).catch(() => {})}
        />
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      height: 26,
      borderRadius: Rayons.pilule,
      backgroundColor: c.encre,
    },
    badgeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille, color: c.surEncre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    quand: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.encre },
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
    prevues: { gap: 4 },
    etiquette: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    prevue: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
    prevueTexte: { flex: 1, fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.encre },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    action: { flex: 1 },
  });

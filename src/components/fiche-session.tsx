import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatars } from '@/components/avatars';
import { BadgeSession } from '@/components/badge-session';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import { IconeInviter } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { PointsPlaces } from '@/components/points-places';
import { BarreNavigation, RESERVE_BAS, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, heure, placesLibres, quand, texteDistance, textePlaces } from '@/lib/formats';
import { inviter } from '@/lib/invitation';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Props = {
  session: Session;
  /** Distance en mètres depuis l'utilisateur (ou le centre de la zone) */
  distance: number;
  catchee: boolean;
  /** C'est ma session : « Annuler » l'annule pour tout le monde */
  organisee: boolean;
  /** Toucher la fiche ouvre le détail de la session */
  onOuvrir: () => void;
  /** Renvoie `false` si le Catch ne peut pas partir tout de suite (connexion à faire) */
  onDemande: () => boolean;
  onEnvoi: () => Promise<boolean>;
  onCatch: () => void;
  onAnnuler: () => void;
};

/** Fiche de la session choisie sur la carte, posée au-dessus de la barre de navigation. */
export function FicheSession({ session, distance, catchee, organisee, onOuvrir, onDemande, onEnvoi, onCatch, onAnnuler }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const enDirect = estEnDirect(session);
  const complet = placesLibres(session) === 0;
  const avecBadge = enDirect || placesLibres(session) === 1;
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${session.titre}, voir le détail`}
        onPress={onOuvrir}
        style={styles.resume}>
        <View style={styles.ligne}>
          {avecBadge ? (
            <BadgeSession session={session} />
          ) : (
            <Text style={styles.quand}>{quand(session.debut)}</Text>
          )}
          <Text style={styles.aide}>
            {enDirect ? `Jusqu'à ${heure(session.fin)} · ` : ''}
            {texteDistance(distance)}
          </Text>
        </View>

        <View style={styles.ligne}>
          <View style={styles.titreZone}>
            <View style={styles.picto}>
              <PictoSport sport={session.sport} taille={30} />
            </View>
            <Text style={styles.titre} numberOfLines={1}>
              {session.titre}
            </Text>
          </View>
          <Avatars initiales={session.inscrits} />
        </View>

        <Text style={styles.aide}>
          {session.lieu}, {session.commune} · {textePlaces(session)}
        </Text>
        <PointsPlaces session={session} taille={10} />
      </Pressable>

      {catchee && (
        <View style={styles.confirmation}>
          <Balle taille={18} />
          <Text style={styles.confirmationTexte}>{organisee ? 'C’est ta session' : 'Tu l’as catchée !'}</Text>
        </View>
      )}
      <View style={styles.actions}>
        <View style={styles.action}>
          {catchee ? (
            <Bouton
              titre={organisee ? 'Annuler la session' : 'Annuler ma participation'}
              variante="lien"
              onPress={onAnnuler}
            />
          ) : (
            <BoutonCatch complet={complet} onDemande={onDemande} onEnvoi={onEnvoi} onCatch={onCatch} />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Inviter"
          onPress={() => inviter(session)}
          style={({ pressed }) => [styles.inviter, pressed && styles.inviterPresse]}>
          <IconeInviter couleur={c.encre} taille={22} />
        </Pressable>
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
    quand: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    titreZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    picto: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titre: {
      flex: 1,
      fontFamily: Polices.titre,
      fontSize: Tailles.titreSession,
      color: c.encre,
    },
    resume: { gap: 10 },
    confirmation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingTop: 4,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    action: { flex: 1 },
    inviter: {
      width: 52,
      height: 52,
      borderRadius: Rayons.bouton,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    inviterPresse: { backgroundColor: c.beige },
    confirmationTexte: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.encre },
  });

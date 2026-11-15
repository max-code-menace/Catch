import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatars } from '@/components/avatars';
import { Bouton } from '@/components/bouton';
import { PointEnDirect } from '@/components/pastille-session';
import { PictoSport } from '@/components/picto-sport';
import { BarreNavigation, Couleurs, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, heure, placesLibres, quand, texteDistance, textePlaces } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';

type Props = {
  session: Session;
  /** Distance en mètres depuis l'utilisateur (ou le centre de la zone) */
  distance: number;
  catchee: boolean;
  onCatch: () => void;
};

function Badge({ session }: { session: Session }) {
  if (estEnDirect(session)) {
    return (
      <View style={[styles.badge, { backgroundColor: Couleurs.rougeDoux }]}>
        <PointEnDirect couleur={Couleurs.rouge} />
        <Text style={[styles.badgeTexte, { color: Couleurs.rougeTexte }]}>En direct</Text>
      </View>
    );
  }
  if (placesLibres(session) === 1) {
    return (
      <View style={[styles.badge, { backgroundColor: Couleurs.orangeDoux }]}>
        <Text style={[styles.badgeTexte, { color: Couleurs.orangeTexte }]}>Il manque 1 joueur</Text>
      </View>
    );
  }
  return <Text style={styles.quand}>{quand(session.debut)}</Text>;
}

/** Fiche de la session choisie sur la carte, posée au-dessus de la barre de navigation. */
export function FicheSession({ session, distance, catchee, onCatch }: Props) {
  const { bottom } = useSafeAreaInsets();
  const enDirect = estEnDirect(session);
  const complet = placesLibres(session) === 0;
  const bas = Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + 12;

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <View style={styles.ligne}>
        <Badge session={session} />
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

      {catchee ? (
        <View style={styles.confirmation}>
          <Text style={styles.confirmationTexte}>Tu l’as catchée !</Text>
          <Bouton titre="Annuler ma participation" variante="secondaire" onPress={onCatch} />
        </View>
      ) : (
        <Bouton
          titre={complet ? 'Complet' : 'Catch'}
          disabled={complet}
          variante={complet ? 'secondaire' : 'principal'}
          onPressIn={() => vibrer.appuiCatch()}
          onPress={() => {
            vibrer.succes();
            onCatch();
          }}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fiche: {
    position: 'absolute',
    left: 12,
    right: 12,
    padding: 16,
    gap: 10,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
    boxShadow: '0 8px 24px rgba(28, 20, 18, 0.14)',
  },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: Rayons.pilule,
  },
  badgeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille },
  quand: { fontFamily: Polices.texteDemi, fontSize: 14, color: Couleurs.encre },
  aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: Couleurs.texteSecondaire },
  titreZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  picto: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Couleurs.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    flex: 1,
    fontFamily: Polices.titre,
    fontSize: Tailles.titreSession,
    color: Couleurs.encre,
  },
  confirmation: { gap: 10 },
  confirmationTexte: {
    fontFamily: Polices.titreDemi,
    fontSize: 20,
    color: Couleurs.rougeTexte,
    textAlign: 'center',
  },
});

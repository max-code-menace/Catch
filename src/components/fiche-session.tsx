import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarrePlaces } from '@/components/barre-places';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import { IconeInviter } from '@/components/icones';
import { Mot } from '@/components/marqueur';
import { TerrainSport } from '@/components/terrain-sport';
import { BarreNavigation, RESERVE_BAS, Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, heure, placesLibres, quandFiche, texteDistance } from '@/lib/formats';
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

/**
 * Fiche de la session choisie sur la carte (finition F3, choisie par Maxime le 24 novembre) : un bandeau rouge
 * avec une seule phrase (« Foot à 5 dans 3 h, à 3 km ») et Catch dedans, puis une ligne : lieu et places.
 * Toucher la phrase ou la ligne ouvre le détail.
 */
export function FicheSession({ session, distance, catchee, organisee, onOuvrir, onDemande, onEnvoi, onCatch, onAnnuler }: Props) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const enDirect = estEnDirect(session);
  const complet = placesLibres(session) === 0;
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;
  const quand = quandFiche(session);
  const lieu = `${enDirect ? `Jusqu'à ${heure(session.fin)} · ` : ''}${session.lieu}`;
  const statut = organisee ? 'Ta session' : 'Tu y es';

  return (
    <Animated.View
      entering={SlideInDown.duration(Durees.emphasized)}
      exiting={SlideOutDown.duration(Durees.standard)}
      style={[styles.fiche, { bottom: bas }]}>
      <View style={styles.bandeau}>
        <TerrainSport sport={session.sport} couleur={c.surRouge} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${session.titre}, ${quand}, ${texteDistance(distance)}, voir le détail`}
          onPress={onOuvrir}
          style={styles.phrase}>
          <Text maxFontSizeMultiplier={1.3} style={styles.mots}>
            {session.titre}{' '}
          </Text>
          <Mot texte={quand} couleur={c.marqueurSurRouge} style={styles.mots} />
          <Text maxFontSizeMultiplier={1.3} style={styles.mots}>
            , {texteDistance(distance)}
          </Text>
        </Pressable>
        {catchee ? (
          <View accessibilityLabel={statut} style={styles.statut}>
            <Balle taille={14} />
            <Text maxFontSizeMultiplier={1.3} style={styles.statutTexte}>
              {statut}
            </Text>
          </View>
        ) : complet ? (
          <View accessibilityLabel="Complet" style={styles.statut}>
            <Text maxFontSizeMultiplier={1.3} style={styles.statutTexte}>
              Complet
            </Text>
          </View>
        ) : (
          <BoutonCatch surBandeau onDemande={onDemande} onEnvoi={onEnvoi} onCatch={onCatch} />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${lieu}, voir le détail`}
        onPress={onOuvrir}
        style={styles.ligne}>
        <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.lieu}>
          {lieu}
        </Text>
        <View style={styles.places}>
          <BarrePlaces session={session} />
        </View>
      </Pressable>

      {catchee && (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => inviter(session)}
            style={({ pressed }) => [styles.inviter, pressed && { opacity: 0.6 }]}>
            <IconeInviter couleur={c.rougeTexte} taille={18} />
            <Text maxFontSizeMultiplier={1.3} style={styles.inviterTexte}>
              Inviter
            </Text>
          </Pressable>
          <Bouton titre={organisee ? 'Annuler la session' : 'Annuler ma participation'} variante="lien" onPress={onAnnuler} />
        </View>
      )}
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fiche: {
      position: 'absolute',
      left: 12,
      right: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombreFlottante,
      overflow: 'hidden',
    },
    bandeau: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: c.rouge,
      overflow: 'hidden',
    },
    phrase: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    mots: { fontFamily: Polices.titre, fontSize: Tailles.accent, lineHeight: 24, color: c.surRouge },
    statut: {
      minHeight: 40,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: Rayons.pilule,
      backgroundColor: c.surRouge,
    },
    statutTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.rouge },
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14 },
    lieu: { flex: 1, fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    places: { width: 150 },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingBottom: 4,
      borderTopWidth: 1,
      borderTopColor: c.trait,
    },
    inviter: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
    inviterTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.rougeTexte },
  });

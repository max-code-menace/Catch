import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Bouton } from '@/components/bouton';
import { IconeRecentrer, IconeRetour } from '@/components/icones';
import { themeCarte } from '@/constants/carte';
import { Espaces, Polices, Rayons, Ressorts, Tailles } from '@/constants/theme';
import { vibrer } from '@/lib/haptics';
import { maPosition, nommer, type Lieu } from '@/lib/lieux';
import { useStyles, useTheme, type Palette } from '@/lib/theme';

export type PropsChoixLieu = {
  /** À n'afficher que quand on choisit : chaque ouverture repart du lieu de départ */
  ouvert: boolean;
  depart: Lieu;
  onFermer: () => void;
  onChoisir: (lieu: Lieu) => void;
};

const ZOOM = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

/**
 * Choix du lieu sur la carte : l'épingle reste au milieu, c'est la carte qu'on fait glisser dessous.
 * Le nom de l'endroit se met à jour dès que la carte s'arrête.
 */
export function ChoixLieu({ ouvert, depart, onFermer, onChoisir }: PropsChoixLieu) {
  const { c, theme } = useTheme();
  const styles = useStyles(creerStyles);
  const { top, bottom } = useSafeAreaInsets();
  const carte = useRef<MapView>(null);
  const [lieu, setLieu] = useState(depart);
  const [cherche, setCherche] = useState(false);
  // Numéro de la dernière recherche de nom : une réponse en retard ne remplace pas la plus récente
  const demande = useRef(0);
  const saut = useSharedValue(0);
  const stylePin = useAnimatedStyle(() => ({ transform: [{ translateY: saut.get() }] }));

  async function arreter(region: Region) {
    saut.set(withSpring(0, Ressorts.snappy));
    const numero = ++demande.current;
    setCherche(true);
    const trouve = await nommer({ latitude: region.latitude, longitude: region.longitude });
    if (numero !== demande.current) return;
    setLieu(trouve);
    setCherche(false);
    vibrer.selection();
  }

  async function recentrer() {
    vibrer.selection();
    const point = await maPosition();
    if (point) carte.current?.animateToRegion({ ...point, ...ZOOM }, 400);
  }

  return (
    <Modal visible={ouvert} animationType="slide" onRequestClose={onFermer}>
      <View style={styles.ecran}>
        <MapView
          ref={carte}
          style={StyleSheet.absoluteFill}
          {...themeCarte(theme)}
          initialRegion={{ ...depart.position, ...ZOOM }}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          // L'épingle se soulève pendant qu'on déplace la carte, et se repose à l'arrêt
          onRegionChange={() => {
            if (saut.get() === 0) saut.set(withSpring(-12, Ressorts.snappy));
          }}
          onRegionChangeComplete={arreter}
        />

        {/* L'épingle : sa pointe est exactement au centre de la carte */}
        <View pointerEvents="none" style={styles.centre}>
          <Animated.View style={[styles.pin, stylePin]}>
            <Svg width={44} height={54} viewBox="0 0 36 44">
              <Path d="M18 43S3 29.5 3 17a15 15 0 0 1 30 0c0 12.5-15 26-15 26z" fill={c.rouge} />
              <Circle cx={18} cy={17} r={5} fill={c.surRouge} />
            </Svg>
          </Animated.View>
          <View style={styles.ombre} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onFermer}
          style={[styles.rond, { top: top + 12, left: Espaces.marge }]}>
          <IconeRetour couleur={c.encre} taille={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Me recentrer"
          onPress={recentrer}
          style={[styles.rond, { top: top + 12, right: Espaces.marge }]}>
          <IconeRecentrer couleur={c.encre} taille={22} />
        </Pressable>

        <View style={[styles.fiche, { paddingBottom: Math.max(bottom, 16) + 8 }]}>
          <Text style={styles.aide}>Déplace la carte pour placer l’épingle</Text>
          <Text style={styles.nom} numberOfLines={1}>
            {cherche ? 'Recherche…' : lieu.nom}
          </Text>
          {!!lieu.commune && !cherche && <Text style={styles.aide}>{lieu.commune}</Text>}
          <Bouton
            titre="Choisir ce lieu"
            disabled={cherche}
            style={[styles.bouton, cherche && { opacity: 0.5 }]}
            onPress={() => {
              vibrer.succes();
              onChoisir(lieu);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    centre: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Décalée vers le haut de sa hauteur : la pointe tombe sur le centre
    pin: { marginTop: -54 },
    ombre: {
      width: 14,
      height: 5,
      marginTop: -2,
      borderRadius: 3,
      backgroundColor: c.encre,
      opacity: 0.25,
    },
    rond: {
      position: 'absolute',
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Espaces.cibleTactile / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      boxShadow: '0 2px 10px rgba(28,20,18,0.12)',
    },
    fiche: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 18,
      paddingHorizontal: Espaces.marge,
      gap: 2,
      backgroundColor: c.carte,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      boxShadow: '0 -6px 24px rgba(28,20,18,0.12)',
    },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    nom: { fontFamily: Polices.titre, fontSize: 22, lineHeight: 28, color: c.encre },
    bouton: { marginTop: 14, borderRadius: Rayons.bouton },
  });

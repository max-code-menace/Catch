import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { vibrer } from '@/lib/haptics';
import { useStyles, type Palette } from '@/lib/theme';

type Props<T> = {
  elements: T[];
  /** Position de l'élément choisi */
  index: number;
  onChange: (index: number) => void;
  /** Largeur d'un élément : c'est aussi le cran du défilement */
  largeur: number;
  hauteur: number;
  cle: (element: T) => string;
  /** Dessine un élément ; `actif` est vrai pour celui du milieu */
  rendre: (element: T, actif: boolean) => React.ReactNode;
  /** Ce que lit le lecteur d'écran : « Sport », « Heure » */
  etiquette: string;
  /** Texte lu pour l'élément choisi : « Foot », « 19h30 » */
  valeur: string;
  styleCadre?: StyleProp<ViewStyle>;
};

/**
 * Choix en glissant le doigt : une bande horizontale qui s'arrête cran par cran,
 * l'élément du milieu est celui qui est choisi. Un tick de vibration à chaque cran.
 */
export function Roulette<T>({
  elements,
  index,
  onChange,
  largeur,
  hauteur,
  cle,
  rendre,
  etiquette,
  valeur,
  styleCadre,
}: Props<T>) {
  const styles = useStyles(creerStyles);
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  const [largeurTotale, setLargeurTotale] = useState(0);
  // Dernier cran connu du défilement, pour ne prévenir qu'au changement
  const cran = useRef(index);
  const marge = Math.max(0, (largeurTotale - largeur) / 2);

  // Le choix a changé ailleurs (autre sport, relance) : la bande suit
  useEffect(() => {
    if (!largeurTotale || cran.current === index) return;
    cran.current = index;
    defilement.current?.scrollTo({ x: index * largeur, animated: true });
  }, [index, largeur, largeurTotale]);

  function suivre(evenement: NativeSyntheticEvent<NativeScrollEvent>) {
    const brut = Math.round(evenement.nativeEvent.contentOffset.x / largeur);
    const suivant = Math.min(elements.length - 1, Math.max(0, brut));
    if (suivant === cran.current) return;
    cran.current = suivant;
    vibrer.selection();
    onChange(suivant);
  }

  function aller(vers: number) {
    if (vers < 0 || vers >= elements.length) return;
    defilement.current?.scrollTo({ x: vers * largeur, animated: true });
  }

  return (
    <View
      style={{ height: hauteur }}
      onLayout={(e) => setLargeurTotale(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiquette}
      accessibilityValue={{ text: valeur }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => aller(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>
      {largeurTotale > 0 && (
        <>
          <View
            pointerEvents="none"
            style={[styles.cadre, { left: marge, width: largeur, height: hauteur }, styleCadre]}
          />
          <ScrollView
            ref={defilement}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={largeur}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={suivre}
            contentOffset={{ x: index * largeur, y: 0 }}
            // Android ne suit pas toujours contentOffset : on place la bande une fois affichée
            onLayout={() => defilement.current?.scrollTo({ x: cran.current * largeur, animated: false })}
            contentContainerStyle={{ paddingHorizontal: marge }}>
            {elements.map((element, i) => (
              <Pressable
                key={cle(element)}
                onPress={() => aller(i)}
                style={[styles.element, { width: largeur, height: hauteur }]}>
                {rendre(element, i === index)}
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: {
      position: 'absolute',
      top: 0,
      borderRadius: 18,
      backgroundColor: c.rougeDoux,
      borderWidth: 1.5,
      borderColor: c.rouge,
    },
    element: { alignItems: 'center', justifyContent: 'center' },
  });

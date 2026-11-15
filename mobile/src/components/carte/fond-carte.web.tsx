import { useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-context';

import { Pastille } from './pastille';
import { type FondCarteProps, type Region } from './types';

// Version web : pas de vrai fond de carte (Apple Plans et Google Maps n'existent que sur téléphone).
// Sert à vérifier l'écran dans un navigateur : les pastilles sont placées au bon endroit sur un fond uni.
export function FondCarte({ ref, regionInitiale, sessions, selection, onSelection, margeHaut, margeBas }: FondCarteProps) {
  const { c } = useTheme();
  const [region, setRegion] = useState<Region>(regionInitiale);
  const [taille, setTaille] = useState({ l: 0, h: 0 });

  useImperativeHandle(ref, () => ({ allerA: setRegion }));

  const hauteurUtile = Math.max(1, taille.h - margeHaut - margeBas);
  return (
    <Pressable
      accessible={false}
      onPress={() => onSelection(null)}
      onLayout={(e) => setTaille({ l: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { backgroundColor: c.fondCarte, overflow: 'hidden' }]}>
      {taille.l > 0 &&
        sessions.map((s) => {
          const x = taille.l / 2 + ((s.lng - region.longitude) / region.longitudeDelta) * taille.l;
          const y = margeHaut + hauteurUtile / 2 - ((s.lat - region.latitude) / region.latitudeDelta) * hauteurUtile;
          return (
            <View
              key={s.id}
              pointerEvents="box-none"
              style={{ position: 'absolute', left: x - 150, top: y - 20, width: 300, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: s.id === selection ? 2 : 1 }}>
              <Pressable accessibilityRole="button" onPress={() => onSelection(s.id)}>
                <Pastille session={s} choisie={s.id === selection} />
              </Pressable>
            </View>
          );
        })}
    </Pressable>
  );
}

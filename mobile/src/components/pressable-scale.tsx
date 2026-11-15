import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pression, ressorts } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  echelle?: number;
  children?: ReactNode;
};

// Tout ce qui se presse rétrécit légèrement sous le doigt (ressort « snappy »).
export function PressableScale({ style, echelle = pression.bouton, onPressIn, onPressOut, ...rest }: Props) {
  const s = useSharedValue(1);
  const anime = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        s.set(withSpring(echelle, ressorts.snappy));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, ressorts.snappy));
        onPressOut?.(e);
      }}
      style={[style, anime]}
    />
  );
}

import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-context';
import { mise } from '@/theme/tokens';

// Base d'un écran d'onglet : fond, marges, et place en bas pour la barre flottante.
export function Ecran({ children, defile = true }: { children: ReactNode; defile?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + 16,
    paddingHorizontal: mise.marge,
    paddingBottom: insets.bottom + mise.basBarre + 16,
  };
  if (!defile) return <View style={[{ flex: 1, backgroundColor: c.fond }, padding]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.fond }} contentContainerStyle={[padding, { gap: 16 }]}>
      {children}
    </ScrollView>
  );
}

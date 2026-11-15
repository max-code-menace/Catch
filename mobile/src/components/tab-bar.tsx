import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Map, MessageSquare, Plus, User, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { useTheme } from '@/theme/theme-context';
import { polices, rayons } from '@/theme/tokens';

export const ONGLETS = [
  { name: 'creer', href: '/creer', label: 'Créer', Icone: Plus },
  { name: 'index', href: '/', label: 'Carte', Icone: Map },
  { name: 'messages', href: '/messages', label: 'Messages', Icone: MessageSquare },
  { name: 'profil', href: '/profil', label: 'Profil', Icone: User },
] as const;

type BoutonProps = TabTriggerSlotProps & { label: string; Icone: LucideIcon };

function BoutonOnglet({ isFocused, label, Icone, style: _style, children: _children, ...props }: BoutonProps) {
  const { c } = useTheme();
  const couleur = isFocused ? c.surRouge : c.secondaire;
  return (
    <PressableScale
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={{
        flex: 1,
        height: 52,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        backgroundColor: isFocused ? c.rouge : 'transparent',
      }}>
      <Icone size={22} strokeWidth={1.8} color={couleur} />
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={{ color: couleur, fontFamily: isFocused ? polices.texteDemi : polices.texteMoyen, fontSize: 11 }}>
        {label}
      </Text>
    </PressableScale>
  );
}

// Barre flottante : pilule détachée des bords, 4 onglets, l'onglet actif est rempli en rouge.
export function TabBar() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 10) + 16,
        flexDirection: 'row',
        padding: 6,
        gap: 2,
        borderRadius: rayons.pilule,
        backgroundColor: c.carte,
        borderWidth: 1,
        borderColor: c.trait,
        boxShadow: `0 8px 24px ${c.ombre}`,
      }}>
      {ONGLETS.map(({ name, label, Icone }) => (
        <TabTrigger key={name} name={name} asChild>
          <BoutonOnglet label={label} Icone={Icone} />
        </TabTrigger>
      ))}
    </View>
  );
}

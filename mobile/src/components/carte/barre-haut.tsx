import { Locate } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { useTheme } from '@/theme/theme-context';
import { mise, polices, rayons } from '@/theme/tokens';

// Barre du haut de la carte : logo, zone affichée, bouton pour se recentrer.
export function BarreHaut({ zone, haut, onRecentrer }: { zone: string; haut: number; onRecentrer: () => void }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        top: haut,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 18,
        paddingRight: 4,
        borderRadius: rayons.pilule,
        backgroundColor: c.carte,
        borderWidth: 1,
        borderColor: c.trait,
        boxShadow: `0 4px 14px ${c.ombre}`,
      }}>
      <Text
        accessibilityRole="header"
        accessibilityLabel="Catch"
        maxFontSizeMultiplier={1.2}
        style={{ color: c.rouge, fontFamily: polices.titre, fontSize: 20, letterSpacing: -0.3 }}>
        catch
      </Text>
      <View style={{ width: 1, height: 18, backgroundColor: c.trait }} />
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={{ flex: 1, color: c.encre, fontFamily: polices.texteMoyen, fontSize: 14 }}>
        {zone}
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Me recentrer"
        onPress={onRecentrer}
        style={{ width: mise.cible, height: mise.cible, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
        <Locate size={21} strokeWidth={1.9} color={c.encre} />
      </PressableScale>
    </View>
  );
}

import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { useTheme } from '@/theme/theme-context';
import { durees, polices, rayons } from '@/theme/tokens';

// Panneau posé sur la carte : « Rien près de toi » ou un souci de chargement.
export function Panneau({ haut, entete, titre, texte, children }: { haut: number; entete: ReactNode; titre: string; texte: string; children?: ReactNode }) {
  const { c } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(durees.standard)}
      exiting={FadeOut.duration(durees.fast)}
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        top: haut,
        paddingTop: 28,
        paddingHorizontal: 22,
        paddingBottom: 22,
        gap: 10,
        alignItems: 'center',
        borderRadius: rayons.feuille,
        backgroundColor: c.carte,
        borderWidth: 1,
        borderColor: c.trait,
        boxShadow: `0 10px 30px ${c.ombre}`,
      }}>
      {entete}
      <Text
        accessibilityRole="header"
        style={{ color: c.encre, fontFamily: polices.titre, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, textAlign: 'center' }}>
        {titre}
      </Text>
      <Text style={{ color: c.secondaire, fontFamily: polices.texte, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>
        {texte}
      </Text>
      {children ? <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 8 }}>{children}</View> : null}
    </Animated.View>
  );
}

// La balle orange de Catch, posée sur son ombre.
export function Balle() {
  const { c } = useTheme();
  return (
    <View style={{ height: 52, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.orange }} />
      <View style={{ width: 36, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: c.encre, opacity: 0.2 }} />
    </View>
  );
}

type BoutonProps = { texte: string; onPress: () => void; principal?: boolean; Icone?: LucideIcon };

export function BoutonPanneau({ texte, onPress, principal, Icone }: BoutonProps) {
  const { c } = useTheme();
  const couleur = principal ? c.surRouge : c.encre;
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: principal ? 56 : 50,
        paddingHorizontal: 16,
        borderRadius: rayons.bouton,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: principal ? c.rouge : c.carte,
        borderWidth: principal ? 0 : 1.5,
        borderColor: c.trait,
      }}>
      {Icone ? <Icone size={20} strokeWidth={2.4} color={couleur} /> : null}
      <Text style={{ color: couleur, fontFamily: polices.texteDemi, fontSize: 17, textAlign: 'center' }}>{texte}</Text>
    </PressableScale>
  );
}

import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Ecran } from '@/components/ecran';
import { PressableScale } from '@/components/pressable-scale';
import { Aide, Texte, Titre } from '@/components/texte';
import { reglerVibrations, vibrationsActives, vibrer } from '@/lib/haptics';
import { useTheme, type Apparence } from '@/theme/theme-context';
import { mise, polices, rayons } from '@/theme/tokens';

const CHOIX: { valeur: Apparence; label: string }[] = [
  { valeur: 'auto', label: 'Auto' },
  { valeur: 'light', label: 'Clair' },
  { valeur: 'dark', label: 'Sombre' },
];

export default function Profil() {
  const { c, apparence, setApparence } = useTheme();
  const [vibrations, setVibrations] = useState(vibrationsActives());

  const carte = {
    backgroundColor: c.carte,
    borderRadius: rayons.carte,
    borderWidth: 1,
    borderColor: c.trait,
    padding: 16,
    gap: 12,
  } as const;

  return (
    <Ecran>
      <Titre>Profil</Titre>

      <Aide>Réglages</Aide>

      <View style={carte}>
        <Texte style={{ fontFamily: polices.texteDemi }}>Apparence</Texte>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', backgroundColor: c.beige, borderRadius: rayons.bouton, padding: 4, gap: 4 }}>
          {CHOIX.map(({ valeur, label }) => {
            const actif = apparence === valeur;
            return (
              <PressableScale
                key={valeur}
                accessibilityRole="radio"
                accessibilityState={{ checked: actif }}
                onPress={() => {
                  if (actif) return;
                  vibrer('selection');
                  setApparence(valeur);
                }}
                style={{
                  flex: 1,
                  minHeight: mise.cible,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: actif ? c.carte : 'transparent',
                  borderWidth: 1,
                  borderColor: actif ? c.trait : 'transparent',
                }}>
                <Text
                  style={{
                    color: actif ? c.encre : c.secondaire,
                    fontFamily: actif ? polices.texteDemi : polices.texteMoyen,
                    fontSize: 15,
                  }}>
                  {label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Aide>Auto suit le réglage de ton téléphone.</Aide>
      </View>

      <View style={[carte, { flexDirection: 'row', alignItems: 'center', minHeight: 64 }]}>
        <Texte style={{ flex: 1, fontFamily: polices.texteDemi }}>Vibrations</Texte>
        <Switch
          accessibilityLabel="Vibrations"
          value={vibrations}
          onValueChange={(v) => {
            reglerVibrations(v);
            setVibrations(v);
            if (v) vibrer('selection');
          }}
          trackColor={{ true: c.rouge, false: c.trait }}
          thumbColor="#FFFFFF"
        />
      </View>
    </Ecran>
  );
}

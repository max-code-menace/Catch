import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { Onglet, useStyleBarre } from '@/components/barre-navigation';
import { IconeCarte, IconeCreer, IconeMessages, IconeProfil } from '@/components/icones';
import { useStyles, type Palette } from '@/lib/theme';

export default function Onglets() {
  const styles = useStyles(creerStyles);
  const styleBarre = useStyleBarre();

  return (
    <Tabs style={styles.racine}>
      <TabSlot />
      {/* Ordre des onglets : Créer · Carte · Messages · Profil */}
      <TabList style={styleBarre}>
        <TabTrigger name="creer" href="/creer" asChild>
          <Onglet titre="Créer" Icone={IconeCreer} />
        </TabTrigger>
        <TabTrigger name="index" href="/" asChild>
          <Onglet titre="Carte" Icone={IconeCarte} />
        </TabTrigger>
        <TabTrigger name="messages" href="/messages" asChild>
          <Onglet titre="Messages" Icone={IconeMessages} />
        </TabTrigger>
        <TabTrigger name="profil" href="/profil" asChild>
          <Onglet titre="Profil" Icone={IconeProfil} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    racine: { flex: 1, backgroundColor: c.fond },
  });

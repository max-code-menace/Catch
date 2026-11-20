import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { BoutonCreer, Onglet, useStyleBarre } from '@/components/barre-navigation';
import { IconeCalendrier, IconeCarte, IconeMessages, IconeProfil } from '@/components/icones';
import { useMessages } from '@/lib/messages';
import { useStyles, type Palette } from '@/lib/theme';

export default function Onglets() {
  const styles = useStyles(creerStyles);
  const styleBarre = useStyleBarre();
  const { nonLus } = useMessages();

  return (
    <Tabs style={styles.racine}>
      <TabSlot />
      {/* « Créer » : gros bouton au-dessus de la barre (caché sur l'écran Créer) */}
      <TabTrigger name="creer" asChild>
        <BoutonCreer />
      </TabTrigger>
      {/* Ordre des onglets : Carte · Mes sessions · Messages · Profil */}
      <TabList style={styleBarre}>
        <TabTrigger name="index" href="/" asChild>
          <Onglet titre="Carte" Icone={IconeCarte} />
        </TabTrigger>
        <TabTrigger name="mes-sessions" href="/mes-sessions" asChild>
          <Onglet titre="Mes sessions" Icone={IconeCalendrier} />
        </TabTrigger>
        <TabTrigger name="messages" href="/messages" asChild>
          <Onglet titre="Messages" Icone={IconeMessages} pastille={nonLus} />
        </TabTrigger>
        <TabTrigger name="profil" href="/profil" asChild>
          <Onglet titre="Profil" Icone={IconeProfil} />
        </TabTrigger>
        {/* L'écran Créer reste un onglet, sans place dans la barre */}
        <TabTrigger name="creer" href="/creer" style={styles.cache} />
      </TabList>
    </Tabs>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    racine: { flex: 1, backgroundColor: c.fond },
    cache: { display: 'none' },
  });

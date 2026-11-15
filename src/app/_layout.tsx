import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Onglet, useStyleBarre } from '@/components/barre-navigation';
import { IconeCarte, IconeCreer, IconeMessages, IconeProfil } from '@/components/icones';
import { Couleurs } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function Racine() {
  const [chargees, erreur] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const styleBarre = useStyleBarre();

  useEffect(() => {
    if (chargees || erreur) SplashScreen.hideAsync();
  }, [chargees, erreur]);

  if (!chargees && !erreur) return null;

  return (
    <GestureHandlerRootView style={styles.racine}>
      <StatusBar style="dark" />
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: Couleurs.fond },
});

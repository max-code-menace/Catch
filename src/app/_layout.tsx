import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GestionNotifications } from '@/components/gestion-notifications';
import { ToastAnnulation } from '@/components/toast-annulation';
import { FournisseurCompte } from '@/lib/compte';
import { FournisseurMessages } from '@/lib/messages';
import { FournisseurSessions } from '@/lib/sessions';
import { FournisseurTheme, useStyles, useTheme, type Palette } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Navigation() {
  const styles = useStyles(creerStyles);
  const { c, theme } = useTheme();

  // Le fond derrière les écrans suit le thème (évite un flash blanc en sombre)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.fond).catch(() => {});
  }, [c.fond]);

  return (
    <>
      <StatusBar style={theme === 'sombre' ? 'light' : 'dark'} />
      <FournisseurCompte>
        <FournisseurSessions>
         <FournisseurMessages>
          {/* Les onglets en dessous ; le détail et la confirmation passent par-dessus, sans la barre */}
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.racine }}>
            <Stack.Screen name="(onglets)" />
            <Stack.Screen name="session/[id]" />
            <Stack.Screen name="modifier/[id]" />
            <Stack.Screen name="connexion" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="signaler" options={{ presentation: 'modal' }} />
            <Stack.Screen name="bloques" />
            <Stack.Screen name="supprimer-compte" />
            <Stack.Screen name="confidentialite" />
            <Stack.Screen name="conditions" />
            <Stack.Screen
              name="catchee/[id]"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
          </Stack>
          <ToastAnnulation />
          <GestionNotifications />
         </FournisseurMessages>
        </FournisseurSessions>
      </FournisseurCompte>
    </>
  );
}

export default function Racine() {
  const [chargees, erreur] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (chargees || erreur) SplashScreen.hideAsync();
  }, [chargees, erreur]);

  if (!chargees && !erreur) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FournisseurTheme>
        <Navigation />
      </FournisseurTheme>
    </GestureHandlerRootView>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    racine: { flex: 1, backgroundColor: c.fond },
  });

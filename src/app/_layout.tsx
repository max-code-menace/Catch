import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastAnnulation } from '@/components/toast-annulation';
import { Couleurs } from '@/constants/theme';
import { FournisseurCompte } from '@/lib/compte';
import { FournisseurSessions } from '@/lib/sessions';

SplashScreen.preventAutoHideAsync();

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
    <GestureHandlerRootView style={styles.racine}>
      <StatusBar style="dark" />
      <FournisseurCompte>
        <FournisseurSessions>
          {/* Les onglets en dessous ; le détail et la confirmation passent par-dessus, sans la barre */}
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.racine }}>
            <Stack.Screen name="(onglets)" />
            <Stack.Screen name="session/[id]" />
            <Stack.Screen name="connexion" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="catchee/[id]"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
          </Stack>
          <ToastAnnulation />
        </FournisseurSessions>
      </FournisseurCompte>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: Couleurs.fond },
});

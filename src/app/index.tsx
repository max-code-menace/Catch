import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarreHaut } from '@/components/barre-haut';
import { CarteSessions } from '@/components/carte-sessions';
import { FicheSession } from '@/components/fiche-session';
import { Couleurs } from '@/constants/theme';
import { sessionsFictives, WAVRE, type Coordonnees } from '@/donnees/sessions';
import { distance, estEnDirect } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';

export default function Carte() {
  const sessionsDeBase = useMemo(() => sessionsFictives(), []);
  // Tant qu'on ne connaît pas la position, on mesure depuis le centre de Wavre
  const [position, setPosition] = useState<Coordonnees | null>(null);
  const [cible, setCible] = useState<(Coordonnees & { cle: number }) | null>(null);
  const [catchees, setCatchees] = useState<string[]>([]);
  const origine = position ?? WAVRE;

  // Interface optimiste : une session catchée compte tout de suite un inscrit de plus
  const sessions = sessionsDeBase.map((s) =>
    catchees.includes(s.id) ? { ...s, inscrits: ['Toi', ...s.inscrits] } : s,
  );

  // À l'ouverture : la session en direct la plus proche est déjà choisie
  const [idChoisie, setIdChoisie] = useState<string | null>(() => {
    const enDirect = sessionsDeBase
      .filter((s) => estEnDirect(s))
      .sort((a, b) => distance(WAVRE, a.position) - distance(WAVRE, b.position));
    return enDirect[0]?.id ?? null;
  });
  const choisie = sessions.find((s) => s.id === idChoisie);

  function choisir(id: string | null) {
    if (id && id !== idChoisie) vibrer.selection();
    setIdChoisie(id);
  }

  // La position n'est demandée qu'au moment où on appuie sur « recentrer »
  async function recentrer() {
    let point = WAVRE;
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (granted) {
        const lieu =
          (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
        point = { latitude: lieu.coords.latitude, longitude: lieu.coords.longitude };
        setPosition(point);
      }
    } catch {
      // Position indisponible : on recentre sur la zone
    }
    setCible({ ...point, cle: Date.now() });
  }

  function basculerCatch(id: string) {
    setCatchees((liste) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]));
  }

  return (
    <View style={styles.ecran}>
      <CarteSessions
        sessions={sessions}
        idChoisie={idChoisie}
        onChoisir={choisir}
        cible={cible}
        montrerPosition={position !== null}
      />
      <BarreHaut zone="Wavre · 5 km" onRecentrer={recentrer} />
      {choisie && (
        <FicheSession
          key={choisie.id}
          session={choisie}
          distance={distance(origine, choisie.position)}
          catchee={catchees.includes(choisie.id)}
          onCatch={() => basculerCatch(choisie.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
});

import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarreHaut, type Vue } from '@/components/barre-haut';
import { CarteSessions } from '@/components/carte-sessions';
import { FicheSession } from '@/components/fiche-session';
import { ListeSessions } from '@/components/liste-sessions';
import { Couleurs } from '@/constants/theme';
import { WAVRE, type Coordonnees, type Session } from '@/donnees/sessions';
import { useCatch } from '@/lib/catch';
import { distance, estEnDirect } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { useSessions } from '@/lib/sessions';

export default function Carte() {
  const { sessions, estCatchee, annuler, position, setPosition, origine } = useSessions();
  const { autoriser, confirmer } = useCatch();
  const [cible, setCible] = useState<(Coordonnees & { cle: number }) | null>(null);
  const [vue, setVue] = useState<Vue>('carte');

  // À l'ouverture : la session en direct la plus proche est déjà choisie
  const [idChoisie, setIdChoisie] = useState<string | null>(() => {
    const enDirect = sessions
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

  function ouvrir(session: Session) {
    router.push({ pathname: '/session/[id]', params: { id: session.id } });
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
      {vue === 'liste' && <ListeSessions sessions={sessions} origine={origine} onOuvrir={ouvrir} />}
      <BarreHaut
        zone="Wavre · 5 km"
        vue={vue}
        onBasculer={() => setVue(vue === 'carte' ? 'liste' : 'carte')}
        onRecentrer={() => {
          setVue('carte');
          recentrer();
        }}
      />
      {vue === 'carte' && choisie && (
        <FicheSession
          key={choisie.id}
          session={choisie}
          distance={distance(origine, choisie.position)}
          catchee={estCatchee(choisie.id)}
          onOuvrir={() => ouvrir(choisie)}
          onDemande={() => autoriser(choisie.id)}
          onCatch={() => confirmer(choisie.id)}
          onAnnuler={() => annuler(choisie)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
});

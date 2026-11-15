import { router, useFocusEffect } from 'expo-router';
import { MapPinOff, Plus, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuSession } from '@/components/carte/apercu-session';
import { BarreHaut } from '@/components/carte/barre-haut';
import { FondCarte } from '@/components/carte/fond-carte';
import { Balle, BoutonPanneau, Panneau } from '@/components/carte/panneau';
import { type CommandesCarte } from '@/components/carte/types';
import { PressableScale } from '@/components/pressable-scale';
import { RAYON_KM, RAYON_MAX_KM, ZONE_DEPART } from '@/lib/config';
import { distanceKm, regionAutour, type Point } from '@/lib/geo';
import { vibrer } from '@/lib/haptics';
import { nomCommune, trouverPosition, type ResultatPosition } from '@/lib/position';
import { chargerSessions, type Session } from '@/lib/sessions';
import { useTheme } from '@/theme/theme-context';
import { durees, mise, polices, rayons, tailles } from '@/theme/tokens';

type Etat = 'chargement' | 'ok' | 'erreur';

export default function Carte() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const carte = useRef<CommandesCarte>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [etat, setEtat] = useState<Etat>('chargement');
  const [attenteLongue, setAttenteLongue] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [commune, setCommune] = useState<string | null>(null);
  const [rayon, setRayon] = useState<number>(RAYON_KM);
  const [selection, setSelection] = useState<string | null>(null);
  const [message, setMessage] = useState<'refuse' | 'introuvable' | null>(null);

  const centre: Point = position ?? ZONE_DEPART;
  const zone = `${position ? (commune ?? 'Autour de toi') : ZONE_DEPART.nom} · ${rayon} km`;

  const charger = useCallback(async () => {
    try {
      setSessions(await chargerSessions());
      setEtat('ok');
    } catch {
      // On garde ce qui est déjà affiché ; l'erreur n'est montrée que s'il n'y a rien à voir.
      setEtat((avant) => (avant === 'ok' ? 'ok' : 'erreur'));
    }
  }, []);

  // Les sessions sont rechargées chaque fois qu'on revient sur l'onglet.
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  // Le message « Recherche des sessions » n'apparaît que si ça dure (pas de clignotement).
  useEffect(() => {
    if (etat !== 'chargement') return;
    const t = setTimeout(() => setAttenteLongue(true), 400);
    return () => clearTimeout(t);
  }, [etat]);

  const appliquerPosition = useCallback((r: ResultatPosition, signaler: boolean) => {
    if (r.etat === 'ok') {
      setPosition(r.point);
      setMessage(null);
      setRayon(RAYON_KM);
      carte.current?.allerA(regionAutour(r.point, RAYON_KM));
      nomCommune(r.point).then(setCommune);
    } else if (signaler) {
      setMessage(r.etat === 'refuse' && r.peutRedemander ? null : r.etat);
    }
  }, []);

  // À l'ouverture : on demande la position une fois. En cas de refus, on reste sur la zone de départ, sans insister.
  useEffect(() => {
    trouverPosition(true).then((r) => appliquerPosition(r, false));
  }, [appliquerPosition]);

  const choisie = sessions.find((s) => s.id === selection) ?? null;
  const distances = sessions.map((s) => distanceKm(centre, s));
  const dansLeRayon = distances.filter((d) => d <= rayon).length;
  const plusLoin = distances.filter((d) => d > rayon && d <= RAYON_MAX_KM);
  const rayonElargi = plusLoin.length ? Math.ceil(Math.max(...plusLoin)) : null;
  const rienIci = etat === 'ok' && dansLeRayon === 0;

  const hautBarre = insets.top + 8;
  const basFlottant = Math.max(insets.bottom, 10) + 16 + 66 + 12;

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <FondCarte
        ref={carte}
        regionInitiale={regionAutour(ZONE_DEPART, RAYON_KM)}
        sessions={sessions}
        selection={selection}
        onSelection={(id) => {
          if (id && id !== selection) vibrer('selection');
          setSelection(id);
        }}
        montrerPosition={position !== null}
        margeHaut={hautBarre + 52}
        margeBas={basFlottant}
      />

      {rienIci || etat === 'erreur' ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.voile }} />
      ) : null}

      <BarreHaut
        zone={zone}
        haut={hautBarre}
        onRecentrer={() => {
          setSelection(null);
          if (position) carte.current?.allerA(regionAutour(position, rayon));
          trouverPosition(true).then((r) => appliquerPosition(r, true));
        }}
      />

      {etat === 'chargement' && attenteLongue ? (
        <Animated.View
          entering={FadeIn.duration(durees.fast)}
          exiting={FadeOut.duration(durees.fast)}
          style={{
            position: 'absolute',
            top: hautBarre + 64,
            alignSelf: 'center',
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: rayons.pilule,
            backgroundColor: c.carte,
            borderWidth: 1,
            borderColor: c.trait,
          }}>
          <Text style={{ color: c.secondaire, fontFamily: polices.texteMoyen, fontSize: tailles.aide }}>
            Recherche des sessions…
          </Text>
        </Animated.View>
      ) : null}

      {message ? (
        <Animated.View
          entering={FadeIn.duration(durees.fast)}
          exiting={FadeOut.duration(durees.fast)}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: hautBarre + 64,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 14,
            paddingRight: 6,
            minHeight: 52,
            borderRadius: rayons.carte,
            backgroundColor: c.carte,
            borderWidth: 1,
            borderColor: c.trait,
            boxShadow: `0 4px 14px ${c.ombre}`,
          }}>
          <MapPinOff size={18} strokeWidth={1.9} color={c.encre} />
          <Text style={{ flex: 1, color: c.encre, fontFamily: polices.texte, fontSize: 14, lineHeight: 20 }}>
            {message === 'refuse' ? 'Localisation désactivée pour Catch.' : 'Position introuvable pour l’instant.'}
          </Text>
          <PressableScale
            accessibilityRole="button"
            onPress={() => {
              if (message === 'refuse') Linking.openSettings().catch(() => {});
              setMessage(null);
            }}
            style={{ minHeight: mise.cible, paddingHorizontal: 10, justifyContent: 'center' }}>
            <Text style={{ color: c.rougeTexte, fontFamily: polices.texteDemi, fontSize: 14 }}>
              {message === 'refuse' ? 'Réglages' : 'OK'}
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}

      {etat === 'erreur' ? (
        <Panneau
          haut={hautBarre + 130}
          entete={<WifiOff size={32} strokeWidth={1.9} color={c.encre} />}
          titre="Pas de réseau"
          texte="Impossible de charger les sessions. Vérifie ta connexion.">
          <BoutonPanneau
            principal
            texte="Réessayer"
            onPress={() => {
              setAttenteLongue(false);
              setEtat('chargement');
              charger();
            }}
          />
        </Panneau>
      ) : null}

      {rienIci && !choisie ? (
        <Panneau
          haut={hautBarre + 130}
          entete={<Balle />}
          titre={`Rien à ${rayon} km pour l’instant`}
          texte="Crée la première session ici, pour toi et les joueurs du coin.">
          <BoutonPanneau principal Icone={Plus} texte="Créer une session" onPress={() => router.navigate('/creer')} />
          {rayonElargi ? (
            <BoutonPanneau
              texte={
                plusLoin.length > 1
                  ? `Voir les ${plusLoin.length} sessions à ${rayonElargi} km`
                  : `Voir la session à ${rayonElargi} km`
              }
              onPress={() => {
                vibrer('selection');
                setRayon(rayonElargi);
                carte.current?.allerA(regionAutour(centre, rayonElargi));
              }}
            />
          ) : null}
        </Panneau>
      ) : null}

      {choisie ? (
        <ApercuSession
          key={choisie.id}
          session={choisie}
          distanceKm={position ? distanceKm(position, choisie) : null}
          bas={basFlottant}
        />
      ) : null}
    </View>
  );
}

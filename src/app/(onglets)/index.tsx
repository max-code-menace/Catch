import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Balle } from '@/components/balle';
import { BarreHaut, HAUTEUR_BARRE_HAUT, type Vue } from '@/components/barre-haut';
import { Bouton } from '@/components/bouton';
import { CarteSessions } from '@/components/carte-sessions';
import { FicheSession } from '@/components/fiche-session';
import { IconeCreer, IconeSansReseau } from '@/components/icones';
import { ListeSessions } from '@/components/liste-sessions';
import { PanneauCarte } from '@/components/panneau-carte';
import { CENTRE_ZONE, NOM_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import { useCatch } from '@/lib/catch';
import { distance } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { maPosition } from '@/lib/lieux';
import { useSessions } from '@/lib/sessions';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Rayon affiché par défaut, et distance au-delà de laquelle on ne propose plus d'aller voir */
const RAYON_KM = 5;
const RAYON_MAX_KM = 30;

export default function Carte() {
  const styles = useStyles(creerStyles);
  const { sessions, eclats, etat, recharger, estCatchee, annuler, position, setPosition, origine } = useSessions();
  const { autoriser, envoyer, confirmer } = useCatch();
  const c = useCouleurs();
  const [cible, setCible] = useState<(Coordonnees & { cle: number; rayonKm?: number }) | null>(null);
  const [rayon, setRayon] = useState(RAYON_KM);
  const { top } = useSafeAreaInsets();

  // « Recherche des sessions » n'apparaît que si ça dure, pour ne pas clignoter
  const [attenteLongue, setAttenteLongue] = useState(false);
  useEffect(() => {
    if (etat !== 'chargement') return;
    const minuteur = setTimeout(() => setAttenteLongue(true), 400);
    return () => clearTimeout(minuteur);
  }, [etat]);
  const [vue, setVue] = useState<Vue>('carte');

  const [idChoisie, setIdChoisie] = useState<string | null>(null);
  const choisie = sessions.find((s) => s.id === idChoisie);

  // Position déjà autorisée lors d'une visite précédente : la carte s'ouvre autour de soi, sans rien demander
  useEffect(() => {
    maPosition(false).then((point) => {
      if (!point) return;
      setPosition(point);
      setCible({ ...point, cle: Date.now() });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Les sessions sont relues chaque fois qu'on revient sur l'onglet
  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  // Rien dans le rayon : on propose de créer, ou de voir un peu plus loin s'il y a des sessions
  const distancesKm = sessions.map((s) => distance(origine, s.position) / 1000);
  const rienIci = etat === 'pretes' && !distancesKm.some((d) => d <= rayon);
  const plusLoin = distancesKm.filter((d) => d > rayon && d <= RAYON_MAX_KM);
  const rayonElargi = plusLoin.length ? Math.ceil(Math.max(...plusLoin)) : null;

  function choisir(id: string | null) {
    if (id && id !== idChoisie) vibrer.selection();
    setIdChoisie(id);
  }

  // La question de la position n'est posée qu'au moment où on appuie sur « recentrer »
  async function recentrer() {
    const point = await maPosition();
    if (point) setPosition(point);
    setRayon(RAYON_KM);
    // Position refusée ou indisponible : on recentre sur la zone
    setCible({ ...(point ?? CENTRE_ZONE), cle: Date.now() });
  }

  function voirPlusLoin(km: number) {
    vibrer.selection();
    setRayon(km);
    setCible({ ...origine, cle: Date.now(), rayonKm: km });
  }
  const titrePlusLoin = rayonElargi
    ? plusLoin.length > 1
      ? `Voir les ${plusLoin.length} sessions à ${rayonElargi} km`
      : `Voir la session à ${rayonElargi} km`
    : null;
  // La liste montre les mêmes sessions que la carte : celles du rayon, les plus proches d'abord à heure égale
  const dansLeRayon = sessions.filter((_, i) => distancesKm[i] <= rayon);

  function ouvrir(session: Session) {
    router.push({ pathname: '/session/[id]', params: { id: session.id } });
  }

  return (
    <View style={styles.ecran}>
      <CarteSessions
        sessions={sessions}
        eclats={eclats}
        idChoisie={idChoisie}
        onChoisir={choisir}
        cible={cible}
        montrerPosition={position !== null}
      />
      {vue === 'liste' && (
        <ListeSessions
          sessions={dansLeRayon}
          origine={origine}
          onOuvrir={ouvrir}
          onRafraichir={recharger}
          plusLoin={
            rayonElargi && titrePlusLoin
              ? { titre: titrePlusLoin, onPress: () => voirPlusLoin(rayonElargi) }
              : undefined
          }
        />
      )}
      {etat === 'erreur' && (
        <PanneauCarte
          entete={<IconeSansReseau couleur={c.encre} taille={32} />}
          titre="Pas de réseau"
          texte="Impossible de charger les sessions. Vérifie ta connexion.">
          <Bouton titre="Réessayer" onPress={recharger} />
        </PanneauCarte>
      )}
      {/* On laisse la session finir d'éclater avant d'afficher « Rien à 5 km » */}
      {vue === 'carte' && rienIci && !choisie && eclats.length === 0 && (
        <PanneauCarte
          entete={<Balle taille={32} />}
          titre={`Rien à ${rayon} km pour l’instant`}
          texte="Crée la première session ici, pour toi et les joueurs du coin.">
          <Bouton titre="Créer une session" Icone={IconeCreer} onPress={() => router.navigate('/creer')} />
          {rayonElargi && titrePlusLoin && (
            <Bouton variante="secondaire" titre={titrePlusLoin} onPress={() => voirPlusLoin(rayonElargi)} />
          )}
        </PanneauCarte>
      )}
      {etat === 'chargement' && attenteLongue && (
        <View pointerEvents="none" style={[styles.attente, { top: top + HAUTEUR_BARRE_HAUT + 12 }]}>
          <Text style={styles.attenteTexte}>Recherche des sessions…</Text>
        </View>
      )}
      <BarreHaut
        zone={`${position ? 'Autour de toi' : NOM_ZONE} · ${rayon} km`}
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
          onEnvoi={() => envoyer(choisie.id)}
          onCatch={() => confirmer(choisie.id)}
          onAnnuler={() => annuler(choisie)}
        />
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    attente: {
      position: 'absolute',
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
    },
    attenteTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

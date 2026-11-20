import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Balle } from '@/components/balle';
import { BarreHaut, HAUTEUR_BARRE_HAUT, type Vue } from '@/components/barre-haut';
import { Bouton } from '@/components/bouton';
import { CarteSessions } from '@/components/carte-sessions';
import { FicheEvenement } from '@/components/fiche-evenement';
import { FicheGroupe } from '@/components/fiche-groupe';
import { FicheLieu } from '@/components/fiche-lieu';
import { FiltresCarte, HAUTEUR_FILTRES_CARTE, type FiltreCarte } from '@/components/filtres-carte';
import { FicheSession } from '@/components/fiche-session';
import { IconeCreer, IconeDrapeau, IconeSansReseau } from '@/components/icones';
import { ListeSessions } from '@/components/liste-sessions';
import { PanneauCarte } from '@/components/panneau-carte';
import { CENTRE_ZONE, NOM_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import { useCatch } from '@/lib/catch';
import { sessionsDeLEvenement, useEvenements } from '@/lib/evenements';
import { distance } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { maPosition } from '@/lib/lieux';
import { sessionsDuLieu, useLieuxSport } from '@/lib/lieux-sport';
import { useSessions } from '@/lib/sessions';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Rayon affiché par défaut, et distance au-delà de laquelle on ne propose plus d'aller voir */
const RAYON_KM = 5;
const RAYON_MAX_KM = 30;

export default function Carte() {
  const styles = useStyles(creerStyles);
  const { sessions, eclats, etat, recharger, estCatchee, estOrganisee, annuler, position, setPosition, origine } =
    useSessions();
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

  // Filtre de la carte : tout, ou seulement les sessions, les événements ou les salles et terrains
  const [filtre, setFiltre] = useState<FiltreCarte>('tout');
  const voirSessions = filtre === 'tout' || filtre === 'sessions';
  const lieux = useLieuxSport();
  const evenements = useEvenements();
  const lieuxCarte = filtre === 'tout' || filtre === 'lieux' ? lieux : [];
  const evenementsCarte = filtre === 'tout' || filtre === 'evenements' ? evenements : [];

  const [idChoisie, setIdChoisie] = useState<string | null>(null);
  const choisie = voirSessions ? sessions.find((s) => s.id === idChoisie) : undefined;
  const [idLieuChoisi, setIdLieuChoisi] = useState<string | null>(null);
  const lieuChoisi = choisie ? undefined : lieuxCarte.find((l) => l.id === idLieuChoisi);
  const [idEvenementChoisi, setIdEvenementChoisi] = useState<string | null>(null);
  const evenementChoisi =
    choisie || lieuChoisi ? undefined : evenementsCarte.find((e) => e.id === idEvenementChoisi);
  // Bulle de sessions au même endroit : la liste pour choisir (les sessions encore là)
  const [idsGroupe, setIdsGroupe] = useState<string[] | null>(null);
  const sessionsGroupe =
    voirSessions && idsGroupe && !choisie && !lieuChoisi && !evenementChoisi
      ? sessions.filter((s) => idsGroupe.includes(s.id))
      : [];

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
    setIdLieuChoisi(null);
    setIdEvenementChoisi(null);
    setIdsGroupe(null);
  }

  function choisirLieu(id: string) {
    if (id !== idLieuChoisi) vibrer.selection();
    setIdChoisie(null);
    setIdLieuChoisi(id);
    setIdEvenementChoisi(null);
    setIdsGroupe(null);
  }

  function choisirEvenement(id: string) {
    if (id !== idEvenementChoisi) vibrer.selection();
    setIdChoisie(null);
    setIdLieuChoisi(null);
    setIdEvenementChoisi(id);
    setIdsGroupe(null);
  }

  // La question de la position n'est posée qu'au moment où on appuie sur « recentrer »
  async function recentrer() {
    const point = await maPosition();
    if (point) setPosition(point);
    setRayon(RAYON_KM);
    // Position refusée ou indisponible : on recentre sur la zone
    setCible({ ...(point ?? CENTRE_ZONE), cle: Date.now() });
  }

  // Rien dans le rayon : on peut aussi fermer la fenêtre pour voir les événements, salles et terrains
  const [panneauFerme, setPanneauFerme] = useState(false);
  function voirAutour() {
    vibrer.selection();
    setPanneauFerme(true);
    const plusProche = [...evenements].sort(
      (a, b) => distance(origine, a.position) - distance(origine, b.position),
    )[0];
    // On recule juste assez pour voir l'événement le plus proche
    const km = plusProche ? Math.ceil(distance(origine, plusProche.position) / 1000) : RAYON_KM;
    setCible({ ...origine, cle: Date.now(), rayonKm: Math.max(km, RAYON_KM) });
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
        sessions={voirSessions ? sessions : []}
        eclats={voirSessions ? eclats : []}
        idChoisie={idChoisie}
        onChoisir={choisir}
        onOuvrirGroupe={(ids) => {
          vibrer.selection();
          choisir(null);
          setIdsGroupe(ids);
        }}
        cible={cible}
        montrerPosition={position !== null}
        lieux={lieuxCarte}
        idLieuChoisi={lieuChoisi?.id ?? null}
        onChoisirLieu={choisirLieu}
        evenements={evenementsCarte}
        idEvenementChoisi={evenementChoisi?.id ?? null}
        onChoisirEvenement={choisirEvenement}
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
      {vue === 'carte' && voirSessions && rienIci && !panneauFerme && !choisie && !lieuChoisi && !evenementChoisi && eclats.length === 0 && (
        <PanneauCarte
          entete={<Balle taille={32} />}
          titre={`Rien à ${rayon} km pour l’instant`}
          texte="Crée la première session ici, pour toi et les joueurs du coin.">
          <Bouton titre="Créer une session" Icone={IconeCreer} onPress={() => router.navigate('/creer')} />
          {rayonElargi && titrePlusLoin && (
            <Bouton variante="secondaire" titre={titrePlusLoin} onPress={() => voirPlusLoin(rayonElargi)} />
          )}
          {(evenements.length > 0 || lieux.length > 0) && (
            <Bouton variante="lien" titre="Voir les événements, salles et terrains" onPress={voirAutour} />
          )}
        </PanneauCarte>
      )}
      {vue === 'carte' && filtre === 'evenements' && evenements.length === 0 && etat !== 'erreur' && (
        <PanneauCarte
          entete={<IconeDrapeau couleur={c.encre} taille={32} />}
          titre="Pas d’événement pour l’instant"
          texte="Les courses et autres événements sportifs apparaissent ici 2 semaines avant le départ.">
          <Bouton variante="secondaire" titre="Tout voir" onPress={() => setFiltre('tout')} />
        </PanneauCarte>
      )}
      {etat === 'chargement' && attenteLongue && (
        <View
          pointerEvents="none"
          style={[styles.attente, { top: top + HAUTEUR_BARRE_HAUT + HAUTEUR_FILTRES_CARTE + 8 }]}>
          <Text style={styles.attenteTexte}>Recherche des sessions…</Text>
        </View>
      )}
      {vue === 'carte' && <FiltresCarte filtre={filtre} onChoisir={setFiltre} />}
      <BarreHaut
        zone={`${position ? 'Près de toi' : NOM_ZONE} · ${rayon} km`}
        vue={vue}
        onBasculer={() => setVue(vue === 'carte' ? 'liste' : 'carte')}
        onRecentrer={() => {
          setVue('carte');
          setPanneauFerme(false);
          recentrer();
        }}
      />
      {vue === 'carte' && choisie && (
        <FicheSession
          key={choisie.id}
          session={choisie}
          distance={distance(origine, choisie.position)}
          catchee={estCatchee(choisie.id)}
          organisee={estOrganisee(choisie.id)}
          onOuvrir={() => ouvrir(choisie)}
          onDemande={() => autoriser(choisie.id)}
          onEnvoi={() => envoyer(choisie.id)}
          onCatch={() => confirmer(choisie.id)}
          onAnnuler={() => annuler(choisie)}
        />
      )}
      {vue === 'carte' && sessionsGroupe.length > 1 && (
        <FicheGroupe
          key={sessionsGroupe.map((s) => s.id).join('|')}
          sessions={sessionsGroupe}
          distance={distance(origine, sessionsGroupe[0].position)}
          onChoisir={(session) => choisir(session.id)}
        />
      )}
      {vue === 'carte' && lieuChoisi && (
        <FicheLieu
          key={lieuChoisi.id}
          lieu={lieuChoisi}
          distance={distance(origine, lieuChoisi.position)}
          sessions={sessionsDuLieu(lieuChoisi, sessions)}
          onOuvrirSession={ouvrir}
          onLancer={(sport) => {
            vibrer.selection();
            router.navigate({ pathname: '/creer', params: { lieu: lieuChoisi.id, sport } });
          }}
        />
      )}
      {vue === 'carte' && evenementChoisi && (
        <FicheEvenement
          key={evenementChoisi.id}
          evenement={evenementChoisi}
          distance={distance(origine, evenementChoisi.position)}
          sessions={sessionsDeLEvenement(evenementChoisi, sessions)}
          onOuvrirSession={ouvrir}
          onEnsemble={() => {
            vibrer.selection();
            router.navigate({ pathname: '/creer', params: { evenement: evenementChoisi.id } });
          }}
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

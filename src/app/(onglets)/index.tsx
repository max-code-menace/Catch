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
import { FicheSession } from '@/components/fiche-session';
import { BoutonPresDeMoi, BulleMesSports } from '@/components/boutons-carte';
import { CartePlusProche } from '@/components/carte-plus-proche';
import { FeuilleMesSports, TOUS_LES_TYPES, type TypesCarte } from '@/components/feuille-mes-sports';
import { IconeDrapeau, IconeSansReseau } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { ListeSessions } from '@/components/liste-sessions';
import { PanneauCarte } from '@/components/panneau-carte';
import { CENTRE_ZONE, NOM_ZONE, type Coordonnees, type Session } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { useCatch } from '@/lib/catch';
import { sessionsDeLEvenement, useEvenements } from '@/lib/evenements';
import { filtreActif, listeSports, texteFiltre } from '@/lib/filtre-sports';
import { distance, quand, texteDistance, textePlaces } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { maPosition } from '@/lib/lieux';
import { sessionsDuLieu, useLieuxSport } from '@/lib/lieux-sport';
import { useBulleMesSports, useFiltreMesSports, useMesSports } from '@/lib/mes-sports';
import { useSessions } from '@/lib/sessions';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Rayon affiché par défaut, et distance au-delà de laquelle on ne propose plus d'aller voir */
const RAYON_KM = 5;
const RAYON_MAX_KM = 30;
/** Au-delà, on s'est éloigné de chez soi : « Près de moi » apparaît */
const LOIN_M = 1500;
const ZOOM_DEPART = 0.11;
/** Hauteur de la petite carte « Rien à 5 km » : « Près de moi » se pose au-dessus */
const HAUTEUR_PLUS_PROCHE = 96;
const nomSport = (sport: Session['sport']) => ficheSport(sport).nom;

/** L'élément le plus proche d'un point (événement, lieu), ou rien si la liste est vide */
function plusProcheDe<T extends { position: Coordonnees }>(point: Coordonnees, liste: T[]): T | undefined {
  return [...liste].sort((a, b) => distance(point, a.position) - distance(point, b.position))[0];
}

export default function Carte() {
  const styles = useStyles(creerStyles);
  const { sessions: toutesLesSessions, eclats: tousLesEclats, etat, recharger, estCatchee, estOrganisee, annuler, position, setPosition, origine } =
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

  // Filtre de la carte : « Mes sports » (étoile de la barre du haut), puis sessions, événements, salles et terrains
  const mesSports = useMesSports();
  // Seulement les données (pas les fonctions) pour les calculs de filtre
  const choix = { sports: mesSports.sports, tous: mesSports.tous };
  const filtre = filtreActif(choix);
  const [types, setTypes] = useState<TypesCarte>(TOUS_LES_TYPES);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const bulle = useBulleMesSports(mesSports.pret && mesSports.sports.length === 0);
  const voirSessions = types.sessions;
  const { sessions, eclats, lieux, evenements } = useFiltreMesSports({
    sessions: toutesLesSessions,
    eclats: tousLesEclats,
    lieux: useLieuxSport(),
    evenements: useEvenements(),
  });
  const lieuxCarte = types.lieux ? lieux : [];
  const evenementsCarte = types.evenements ? evenements : [];

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

  // « Près de moi » : seulement quand la carte s'est éloignée, ou que la position n'est pas encore connue
  const [loin, setLoin] = useState(false);
  const [positionRefusee, setPositionRefusee] = useState(false);

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
    else setPositionRefusee(true);
    setLoin(false);
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
  // Rien dans le rayon : une petite carte montre ce qu'il y a de plus proche, plutôt qu'un grand panneau
  const sessionsPlusLoin = sessions
    .map((session, i) => ({ session, km: distancesKm[i] }))
    .filter(({ km }) => km > rayon && km <= RAYON_MAX_KM)
    .sort((a, b) => a.km - b.km);
  const sessionProche = sessionsPlusLoin[0]?.session;
  // Filtre « Mes sports » : les sessions d'autres sports dans le rayon, pour ne jamais laisser une carte vide sans raison
  const autresSports = filtre
    ? toutesLesSessions.filter(
        (s) => !mesSports.sports.includes(s.sport) && distance(origine, s.position) / 1000 <= rayon,
      ).length
    : 0;
  const rien = filtre ? `Rien ${texteFiltre(choix, nomSport)}` : 'Rien';
  function voirTousLesSports() {
    vibrer.selection();
    mesSports.setTous(true);
  }
  const boutonAutres = autresSports
    ? { titre: autresSports > 1 ? `+${autresSports} autres sports` : '+1 autre sport', onPress: voirTousLesSports }
    : undefined;
  const evenementProche = plusProcheDe(origine, evenements);
  const lieuProche = evenementProche ? undefined : plusProcheDe(origine, lieux);

  /** Ferme la petite carte, ouvre la fiche et centre la carte dessus */
  function montrer(point: Coordonnees, ouvrirFiche: () => void) {
    setPanneauFerme(true);
    ouvrirFiche();
    setCible({ ...point, cle: Date.now() });
  }

  const plusProcheAffiche: Omit<React.ComponentProps<typeof CartePlusProche>, 'onFermer'> = sessionProche
    ? {
        picto: <PictoSport sport={sessionProche.sport} taille={30} />,
        surtitre: `${rien} à ${rayon} km · la plus proche`,
        titre: `${sessionProche.titre} · ${quand(sessionProche.debut)}`,
        detail: `${texteDistance(distance(origine, sessionProche.position))} · ${textePlaces(sessionProche)}`,
        onOuvrir: () => ouvrir(sessionProche),
        bouton: boutonAutres ?? (rayonElargi
          ? {
              titre:
                sessionsPlusLoin.length > 2
                  ? `+${sessionsPlusLoin.length - 1} autres`
                  : sessionsPlusLoin.length === 2
                    ? '+1 autre'
                    : 'Sur la carte',
              onPress: () => voirPlusLoin(rayonElargi),
            }
          : undefined),
      }
    : boutonAutres
      ? {
          picto: <Balle taille={28} />,
          surtitre: `${rien} à ${rayon} km`,
          titre: autresSports > 1 ? `${autresSports} autres sessions ici` : '1 autre session ici',
          onOuvrir: voirTousLesSports,
          bouton: { titre: 'Tout voir', onPress: voirTousLesSports },
        }
    : evenementProche
      ? {
          picto: <PictoSport sport={evenementProche.sport} taille={30} />,
          surtitre: `${rien} à ${rayon} km · à faire autour`,
          titre: evenementProche.nom,
          detail: `${quand(evenementProche.debut)} · ${texteDistance(distance(origine, evenementProche.position))}`,
          onOuvrir: () => montrer(evenementProche.position, () => choisirEvenement(evenementProche.id)),
          bouton: { titre: 'Voir autour', onPress: voirAutour },
        }
      : lieuProche
        ? {
            picto: <PictoSport sport={lieuProche.sports[0]} taille={30} />,
            surtitre: `${rien} à ${rayon} km · à faire autour`,
            titre: lieuProche.nom,
            detail: `${lieuProche.type === 'gratuit' ? 'Gratuit' : 'Payant'} · ${texteDistance(distance(origine, lieuProche.position))}`,
            onOuvrir: () => montrer(lieuProche.position, () => choisirLieu(lieuProche.id)),
            bouton: { titre: 'Voir autour', onPress: voirAutour },
          }
        : {
            picto: <Balle taille={28} />,
            surtitre: `${rien} à ${rayon} km pour l’instant`,
            titre: 'Lance la première session du coin',
          };

  // La liste montre les mêmes sessions que la carte : celles du rayon, les plus proches d'abord à heure égale
  const dansLeRayon = sessions.filter((_, i) => distancesKm[i] <= rayon);

  const aucuneFiche = !choisie && !lieuChoisi && !evenementChoisi && sessionsGroupe.length < 2;
  const plusProcheVisible =
    vue === 'carte' && voirSessions && rienIci && !panneauFerme && aucuneFiche && eclats.length === 0;
  const seulementEvenements = types.evenements && !types.sessions && !types.lieux;

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
        onDeplacer={(centre, longitudeDelta) =>
          setLoin(distance(origine, centre) > LOIN_M || longitudeDelta > ZOOM_DEPART * 3)
        }
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
      {plusProcheVisible && <CartePlusProche {...plusProcheAffiche} onFermer={() => setPanneauFerme(true)} />}
      {vue === 'carte' && aucuneFiche && (loin || (position === null && !positionRefusee)) && (
        <BoutonPresDeMoi
          decalage={plusProcheVisible ? HAUTEUR_PLUS_PROCHE : 0}
          onPress={() => {
            vibrer.selection();
            setPanneauFerme(false);
            recentrer();
          }}
        />
      )}
      {vue === 'carte' && seulementEvenements && evenements.length === 0 && etat !== 'erreur' && (
        <PanneauCarte
          entete={<IconeDrapeau couleur={c.encre} taille={32} />}
          titre="Pas d’événement pour l’instant"
          texte="Les courses et autres événements sportifs apparaissent ici 2 semaines avant le départ.">
          <Bouton variante="secondaire" titre="Tout voir" onPress={() => setTypes(TOUS_LES_TYPES)} />
        </PanneauCarte>
      )}
      {etat === 'chargement' && attenteLongue && (
        <View
          pointerEvents="none"
          style={[styles.attente, { top: top + HAUTEUR_BARRE_HAUT + 8 }]}>
          <Text style={styles.attenteTexte}>Recherche des sessions…</Text>
        </View>
      )}
      <BarreHaut
        zone={`${position ? 'Près de toi' : NOM_ZONE} · ${rayon} km`}
        vue={vue}
        onBasculer={() => setVue(vue === 'carte' ? 'liste' : 'carte')}
        nombreSports={filtre ? mesSports.sports.length : 0}
        descriptionSports={
          filtre ? `Mes sports : ${listeSports(mesSports.sports, nomSport)}` : 'Mes sports : tous les sports'
        }
        onMesSports={() => {
          vibrer.selection();
          bulle.cacher();
          setFeuilleOuverte(true);
        }}
      />
      {bulle.afficher && !feuilleOuverte && (
        <BulleMesSports
          onPress={() => {
            bulle.cacher();
            setFeuilleOuverte(true);
          }}
        />
      )}
      <FeuilleMesSports
        visible={feuilleOuverte}
        onFermer={() => {
          setFeuilleOuverte(false);
          setPanneauFerme(false);
        }}
        types={types}
        onTypes={setTypes}
        nombreSessions={dansLeRayon.length}
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
          sessions={sessionsDuLieu(lieuChoisi, toutesLesSessions)}
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
          sessions={sessionsDeLEvenement(evenementChoisi, toutesLesSessions)}
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

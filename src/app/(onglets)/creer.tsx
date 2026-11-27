import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { Bouton } from '@/components/bouton';
import { ChoixDateHeure } from '@/components/choix-date-heure';
import { ChoixJoueurs } from '@/components/choix-joueurs';
import { ChoixLieu } from '@/components/choix-lieu';
import { IconeChevron, IconeCreer, IconeDrapeau, IconeRetour } from '@/components/icones';
import { PhraseCreation } from '@/components/phrase-creation';
import { TuileSport } from '@/components/tuile-sport';
import { ImagesSports } from '@/donnees/images-sports';
import { BarreNavigation, Durees, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { Pictos, type Sport } from '@/donnees/pictos';
import { CENTRE_ZONE } from '@/donnees/sessions';
import { SPORTS, ficheSport } from '@/donnees/sports';
import { prevenir } from '@/lib/alerte';
import { marquerVue } from '@/lib/apparitions';
import { useCompte } from '@/lib/compte';
import { useEvenements } from '@/lib/evenements';
import { heure, quand, quandCreation, texteDistance } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { LIEU_PAR_DEFAUT, nommer, type Lieu } from '@/lib/lieux';
import { lieuA, lieuxDuSport, useLieuxSport, type LieuSport } from '@/lib/lieux-sport';
import {
  ORDRE,
  etapePrecedente,
  etapeSuivante,
  phraseCreation,
  prochainCreneau,
  retenirCreation,
  type Champ,
  type Modele as ModeleGenerique,
} from '@/lib/phrase-creation';
import { etapePublication } from '@/lib/regles-sessions';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const MINUTE = 60_000;
const QUART = 15 * MINUTE;
/** Place prise par le pied (récapitulatif + bouton Publier) au-dessus de la barre */
const HAUTEUR_PIED = 92;
/** Durées proposées, en minutes */
const DUREES = [
  { minutes: 60, titre: '1h' },
  { minutes: 90, titre: '1h30' },
  { minutes: 120, titre: '2h' },
  { minutes: 180, titre: '3h' },
];
/** Le temps de voir la tuile choisie s'allumer avant de passer à l'étape suivante */
const PAUSE_CHOIX = 260;

/** Bornes de « Quand » : de la minute en cours jusqu'à 7 jours (la carte montre les 7 prochains jours) */
function bornes(maintenant: Date) {
  const min = new Date(maintenant);
  min.setSeconds(0, 0);
  const max = new Date(maintenant);
  max.setDate(max.getDate() + 7);
  max.setHours(0, 0, 0, 0);
  return { min, max };
}

/** Ce qu'on retient d'une session publiée depuis ce téléphone : sert à « Relancer » */
type Modele = ModeleGenerique<Omit<Lieu, 'choisi'>>;
/** Les 3 dernières créations différentes */
const CLE_MODELES = 'catch.dernieres-creations';
/** Ancienne clé (une seule création) : relue une fois pour ne rien perdre */
const CLE_MODELE = 'catch.derniere-creation';

const QUESTIONS: Record<Champ, string> = {
  sport: 'Quel sport ?',
  quand: 'Quand ?',
  duree: 'Combien de temps ?',
  joueurs: 'Combien de joueurs, toi compris ?',
  niveau: 'Qui peut venir ?',
  ou: 'Où ?',
};

/** Une tuile de choix, comme dans la maquette : un titre, une petite ligne dessous */
function Tuile({
  titre,
  sous,
  actif,
  onPress,
  largeur,
}: {
  titre: string;
  sous?: string;
  actif: boolean;
  onPress: () => void;
  largeur: number;
}) {
  const styles = useStyles(creerStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      accessibilityLabel={sous ? `${titre}, ${sous}` : titre}
      onPress={onPress}
      style={({ pressed }) => [styles.tuileChoix, { width: largeur }, actif && styles.tuileActive, pressed && styles.presse]}>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={2} style={[styles.tuileTitre, actif && styles.tuileTexteActif]}>
        {titre}
      </Text>
      {!!sous && (
        <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.tuileSous}>
          {sous}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Créer, en trois temps :
 * - `depart` : « Nouvelle session » ou « Relancer » une des 3 dernières (montré dès qu'on a déjà créé) ;
 * - `etapes` : une question à la fois, la phrase se remplit au-dessus ;
 * - `phrase` : la phrase complète et « Publier » ; toucher un mot rouvre seulement ce choix.
 */
type Mode = 'chargement' | 'depart' | 'etapes' | 'phrase';

export default function Creer() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Les sports (en photos) et les autres choix en 3 colonnes (2 pour le niveau), comme la maquette
  const largeur3 = Math.floor((width - 2 * Espaces.marge - 2 * 8) / 3);
  const largeur2 = Math.floor((width - 2 * Espaces.marge - 8) / 2);
  const { compte } = useCompte();
  const { creer, position } = useSessions();

  // L'onglet reste ouvert en arrière-plan : « maintenant » et les créneaux proposés sont recalculés à chaque retour
  const [ouverture, setOuverture] = useState(() => new Date());
  useFocusEffect(useCallback(() => setOuverture(new Date()), []));
  const { min: dateMin, max: maxHabituel } = useMemo(() => bornes(ouverture), [ouverture]);

  const [mode, setMode] = useState<Mode>('chargement');
  /** Étapes de la session en cours (toutes pour une nouvelle ; moins si on vient d'un lieu ou d'un événement) */
  const [aFaire, setAFaire] = useState<Champ[]>(ORDRE);
  const [etape, setEtape] = useState<Champ>('sport');
  /** Étapes déjà validées : les autres restent des trous dans la phrase */
  const [faits, setFaits] = useState<Champ[]>([]);
  /** Mode phrase : le choix rouvert en touchant un mot */
  const [edition, setEdition] = useState<Champ | null>(null);

  const [modeles, setModeles] = useState<Modele[]>([]);
  const [sport, setSport] = useState<Sport | null>(null);
  // Début choisi avec le sélecteur du système. `null` : maintenant, l'heure exacte du téléphone
  const [debutChoisi, setDebutChoisi] = useState<Date | null>(null);
  const [lieu, setLieu] = useState<Lieu>(LIEU_PAR_DEFAUT);
  const [precision, setPrecision] = useState('');
  const [joueurs, setJoueurs] = useState(ficheSport('foot').joueurs);
  const [debutants, setDebutants] = useState(true);
  const [duree, setDuree] = useState(90);
  const [enAttente, setEnAttente] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [carteOuverte, setCarteOuverte] = useState(false);
  const defilement = useRef<ScrollViewInstance>(null);
  const lieux = useLieuxSport();
  // « Lancer une session ici » depuis la fiche d'un lieu, « On y va ensemble » depuis un événement
  const params = useLocalSearchParams<{ lieu?: string; sport?: string; evenement?: string }>();
  const evenements = useEvenements();
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const evenement = evenements.find((e) => e.id === evenementId);
  // Pour un événement (visible 2 semaines avant), « Quand » va jusqu'au jour du départ
  const finJourEvenement = evenement ? new Date(evenement.debut) : null;
  finJourEvenement?.setHours(24, 0, 0, 0);
  const dateMax = finJourEvenement && finJourEvenement > maxHabituel ? finJourEvenement : maxHabituel;

  // Si la position est déjà connue, la carte du lieu s'ouvrira autour de soi.
  // Ce n'est qu'un point de départ : le lieu reste à choisir, on ne publie jamais sa propre position sans le vouloir.
  useEffect(() => {
    if (position && !lieu.choisi) nommer(position).then((proche) => setLieu({ ...proche, choisi: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  /** Repart de zéro sur une nouvelle session, étape par étape */
  function nouvelle(etapes: Champ[] = ORDRE) {
    setAFaire(etapes);
    setEtape(etapes[0]);
    setFaits([]);
    setEdition(null);
    setMode('etapes');
  }

  // On relit les dernières créations au démarrage : s'il y en a, l'écran de départ propose de les relancer
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CLE_MODELES), AsyncStorage.getItem(CLE_MODELE)])
      .then(([liste, ancienne]) => {
        const lus: Modele[] = liste ? JSON.parse(liste) : ancienne ? [JSON.parse(ancienne)] : [];
        setModeles(lus);
        // Ouvert depuis un lieu ou un événement : ce choix-là passe avant (le mode est déjà réglé)
        setMode((avant) => (avant !== 'chargement' ? avant : lus.length ? 'depart' : 'etapes'));
      })
      .catch(() => setMode((avant) => (avant === 'chargement' ? 'etapes' : avant)));
  }, []);

  // À chaque nouvelle étape, on remonte en haut : la question est juste sous la phrase
  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: true });
  }, [mode, etape]);

  function relancer(m: Modele) {
    vibrer.selection();
    setSport(m.sport);
    setJoueurs(m.joueurs);
    setDuree(m.duree);
    setDebutants(m.debutants);
    setPrecision('');
    setEvenementId(null);
    setLieu({ ...m.lieu, choisi: true });
    // Même heure que la dernière fois, au prochain créneau
    setDebutChoisi(m.heure ? prochainCreneau(m.heure.heures, m.heure.minutes, new Date()) : null);
    setEdition(null);
    setMode('phrase');
  }

  /** L'étape (ou le choix rouvert) est faite : on passe à la suivante, ou à la phrase complète */
  function valider(champ: Champ) {
    if (mode === 'phrase') {
      setEdition(null);
      return;
    }
    const nouveauxFaits = faits.includes(champ) ? faits : [...faits, champ];
    setFaits(nouveauxFaits);
    // Une étape revisitée en touchant la phrase : on reprend à la première encore à faire
    const suivante = aFaire.find((e) => !nouveauxFaits.includes(e)) ?? etapeSuivante(champ, aFaire);
    if (suivante && !nouveauxFaits.includes(suivante)) setEtape(suivante);
    else setMode('phrase');
  }

  function choisirSport(cle: Sport) {
    vibrer.selection();
    if (cle !== sport) {
      setSport(cle);
      setJoueurs(ficheSport(cle).joueurs);
    }
    setTimeout(() => valider('sport'), PAUSE_CHOIX);
  }

  function choisirLieuSport(choisi: LieuSport) {
    vibrer.selection();
    setPrecision('');
    setLieu({ position: choisi.position, nom: choisi.nom, commune: choisi.commune, choisi: true });
    setTimeout(() => valider('ou'), PAUSE_CHOIX);
  }

  // Appliquée pendant l'affichage (pas dans un effet) dès que les lieux sont lus ; puis on oublie la demande,
  // pour que revenir sur l'onglet ne remette pas ce lieu par-dessus un autre choix
  const demandeLieu = params.lieu ? `${params.lieu}:${params.sport ?? ''}` : null;
  const [demandeTraitee, setDemandeTraitee] = useState<string | null>(null);
  if (!demandeLieu && demandeTraitee) setDemandeTraitee(null);
  const lieuVenu = demandeLieu && demandeLieu !== demandeTraitee ? lieux.find((l) => l.id === params.lieu) : undefined;
  if (demandeLieu && lieuVenu) {
    const cle = params.sport && params.sport in Pictos ? (params.sport as Sport) : lieuVenu.sports[0];
    setDemandeTraitee(demandeLieu);
    setSport(cle);
    setJoueurs(ficheSport(cle).joueurs);
    setDebutChoisi(null);
    setPrecision('');
    setEvenementId(null);
    setLieu({ position: lieuVenu.position, nom: lieuVenu.nom, commune: lieuVenu.commune, choisi: true });
    // Le sport et le lieu sont donnés : il reste quand et combien
    nouvelle(['quand', 'duree', 'joueurs', 'niveau']);
  }
  useEffect(() => {
    if (demandeTraitee) router.setParams({ lieu: undefined, sport: undefined });
  }, [demandeTraitee]);

  // Même principe pour un événement : sport, heure de départ et lieu de départ remplis, une seule fois
  const [evenementTraite, setEvenementTraite] = useState<string | null>(null);
  if (!params.evenement && evenementTraite) setEvenementTraite(null);
  const evenementVenu =
    params.evenement && params.evenement !== evenementTraite ? evenements.find((e) => e.id === params.evenement) : undefined;
  if (params.evenement && evenementVenu) {
    setEvenementTraite(params.evenement);
    setEvenementId(evenementVenu.id);
    setSport(evenementVenu.sport);
    setJoueurs(ficheSport(evenementVenu.sport).joueurs);
    setDebutChoisi(evenementVenu.debut);
    setPrecision('');
    setLieu({
      position: evenementVenu.position,
      nom: evenementVenu.depart,
      commune: evenementVenu.commune,
      choisi: true,
    });
    nouvelle(['joueurs', 'niveau']);
  }
  useEffect(() => {
    if (evenementTraite) router.setParams({ evenement: undefined });
  }, [evenementTraite]);

  const fiche = ficheSport(sport ?? 'foot');
  // Sport qui se joue à un endroit précis : on met en avant ses lieux, les plus proches d'abord
  const lieuConnu = lieu.choisi ? lieuA(lieux, lieu.position) : null;
  const proches = sport && fiche.ou === 'lieu' ? lieuxDuSport(lieux, sport, position ?? CENTRE_ZONE) : [];
  // Le lieu déjà choisi passe en tête, pour qu'on le voie sélectionné sans faire défiler
  const suggestions = [
    ...proches.filter((p) => p.lieu.id === lieuConnu?.id),
    ...proches.filter((p) => p.lieu.id !== lieuConnu?.id),
  ].slice(0, 8);
  const nomLieu = precision.trim() || lieu.nom;
  // Ce que montre le sélecteur : l'heure choisie, sinon la minute où l'onglet a été ouvert
  // L'heure se choisit au quart d'heure (demande de Maxime : pas de rendez-vous à 20h03) ;
  // sans choix, la roue montre le prochain quart d'heure
  const premierQuart = new Date(Math.ceil(dateMin.getTime() / QUART) * QUART);
  const debutAffiche = debutChoisi && debutChoisi > dateMin ? debutChoisi : premierQuart;
  // À moins de 5 minutes d'ici, c'est « maintenant »
  const maintenant = debutAffiche.getTime() - dateMin.getTime() < 5 * MINUTE;
  const texteDuree = DUREES.find((d) => d.minutes === duree)?.titre ?? '1h30';
  /** Début de la session au moment de publier : jamais dans le passé */
  function debutAPublier() {
    const instant = new Date();
    // Ce que montre la roue, même si on ne l'a pas touchée
    const voulu = debutChoisi ?? premierQuart;
    return voulu > instant ? voulu : instant;
  }

  // Pendant les étapes, un choix pas encore validé reste un trou, même s'il a une valeur par défaut
  const montre = (champ: Champ) => mode !== 'etapes' || faits.includes(champ) || !aFaire.includes(champ);
  const morceaux = phraseCreation({
    sport: sport && montre('sport') ? { cle: sport, nom: fiche.nom } : null,
    quand: montre('quand') ? (maintenant ? 'maintenant' : quandCreation(debutAffiche, ouverture)) : null,
    duree: montre('duree') ? texteDuree : null,
    joueurs: sport && montre('joueurs') ? joueurs : null,
    debutants: montre('niveau') ? debutants : null,
    lieu: lieu.choisi && montre('ou') ? nomLieu : null,
  });

  function toucherPhrase(champ: Champ) {
    vibrer.selection();
    if (mode === 'phrase') {
      setEdition((avant) => (avant === champ ? null : champ));
      return;
    }
    // Pendant les étapes : on revient sur un choix déjà fait, ou on va à l'étape en cours
    if (faits.includes(champ) || champ === etape) setEtape(champ);
  }

  function retour() {
    vibrer.selection();
    if (mode === 'etapes') {
      const avant = etapePrecedente(etape, aFaire);
      if (avant) {
        setEtape(avant);
        return;
      }
    }
    if (modeles.length) setMode('depart');
  }
  const retourPossible =
    (mode === 'etapes' && (!!etapePrecedente(etape, aFaire) || modeles.length > 0)) ||
    (mode === 'phrase' && modeles.length > 0);

  async function envoyer() {
    if (envoi || !sport) return;
    setEnvoi(true);
    const debut = debutAPublier();
    const resultat = await creer({
      sport,
      titre: fiche.nom,
      lieu: nomLieu,
      commune: lieu.commune,
      position: lieu.position,
      debut,
      fin: new Date(debut.getTime() + duree * MINUTE),
      joueurs,
      debutantsBienvenus: debutants,
      evenementId: evenement?.id,
    });
    setEnvoi(false);
    if (!resultat || resultat === 'limite') {
      vibrer.erreur();
      prevenir(
        'Session pas publiée',
        resultat === 'limite'
          ? 'Tu as déjà créé 6 sessions ces dernières 24 heures. Réessaie demain.'
          : 'Pas de réseau. Réessaie.',
      );
      return;
    }
    const { id } = resultat;
    vibrer.succes();
    // On retient cette création pour « Relancer » (pas celles d'un événement : il n'a lieu qu'une fois)
    if (!evenement) {
      const liste = retenirCreation(modeles, {
        sport,
        joueurs,
        duree,
        debutants,
        lieu: { position: lieu.position, nom: nomLieu, commune: lieu.commune },
        heure: { heures: debut.getHours(), minutes: debut.getMinutes() },
      });
      setModeles(liste);
      AsyncStorage.setItem(CLE_MODELES, JSON.stringify(liste)).catch(() => {});
    }
    // Le formulaire repart de zéro : revenir ici ne publie pas la même session une deuxième fois
    setPrecision('');
    setDebutChoisi(null);
    setEvenementId(null);
    setSport(null);
    setLieu((avant) => ({ ...avant, choisi: false }));
    setMode(evenement && !modeles.length ? 'etapes' : 'depart');
    // Retour sur la carte : la session y tombe à sa place
    marquerVue(id);
    router.navigate({ pathname: '/', params: { publiee: id } });
  }

  function publier() {
    const etapeManquante = etapePublication({ sportChoisi: !!sport, lieuChoisi: lieu.choisi, connecte: !!compte?.prenom });
    if (etapeManquante === 'sport') {
      vibrer.avertissement();
      setEdition('sport');
      return;
    }
    // Pas de lieu par défaut publié par mégarde : on ouvre la carte pour le choisir
    if (etapeManquante === 'lieu') {
      vibrer.avertissement();
      setEdition('ou');
      setCarteOuverte(true);
      return;
    }
    if (etapeManquante === 'envoyer') {
      envoyer();
      return;
    }
    // Pas encore connecté : on passe par la connexion, la session est publiée au retour
    setEnAttente(true);
    router.push({ pathname: '/connexion', params: { pour: 'publier' } });
  }

  // Retour de la connexion : on publie si elle a réussi, sinon on ne fait rien
  useFocusEffect(
    useCallback(() => {
      if (!enAttente) return;
      setEnAttente(false);
      if (compte?.prenom) envoyer();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enAttente, compte?.prenom]),
  );

  /** Le choix d'un champ : une étape, ou le choix rouvert depuis la phrase */
  function panneau(champ: Champ) {
    if (champ === 'sport') {
      return (
        <View style={[styles.tuiles, styles.dansMarges]}>
          {SPORTS.map(({ cle, nom, nomTuile }) => (
            <TuileSport
              key={cle}
              sport={cle}
              nom={nomTuile ?? nom}
              choisie={cle === sport && montre('sport')}
              largeur={largeur3}
              onPress={() => choisirSport(cle)}
            />
          ))}
        </View>
      );
    }
    if (champ === 'quand') {
      // La roue du système (jour + heure), calée sur l'heure du téléphone : pour « maintenant », il suffit de valider
      return (
        <View style={[styles.dansMarges, styles.panneau]}>
          <ChoixDateHeure
            valeur={debutAffiche}
            onChange={setDebutChoisi}
            min={dateMin}
            max={dateMax}
            pasMinutes={15}
            affichage="roue"
          />
          <Bouton titre={maintenant ? 'Maintenant, c’est bon' : 'C’est bon'} onPress={() => valider('quand')} />
        </View>
      );
    }
    if (champ === 'duree') {
      const debut = debutAffiche;
      return (
        <View style={[styles.tuiles, styles.dansMarges]}>
          {DUREES.map(({ minutes, titre }) => (
            <Tuile
              key={minutes}
              titre={titre}
              sous={`jusqu’à ${heure(new Date(debut.getTime() + minutes * MINUTE))}`}
              actif={montre('duree') && minutes === duree}
              largeur={largeur3}
              onPress={() => {
                vibrer.selection();
                setDuree(minutes);
                setTimeout(() => valider('duree'), PAUSE_CHOIX);
              }}
            />
          ))}
        </View>
      );
    }
    if (champ === 'joueurs') {
      // La roue du système (iPhone) ou la liste (Android), réglée sur le nombre habituel du sport
      return (
        <View style={[styles.dansMarges, styles.panneau]}>
          <ChoixJoueurs valeur={joueurs} onChange={setJoueurs} />
          <Bouton titre={`${joueurs} joueurs, c’est bon`} onPress={() => valider('joueurs')} />
        </View>
      );
    }
    if (champ === 'niveau') {
      return (
        <View style={[styles.tuiles, styles.dansMarges]}>
          {[
            { valeur: true, titre: 'Débutants bienvenus', sous: 'tout le monde peut venir' },
            { valeur: false, titre: 'Niveau confirmé', sous: 'pour ceux qui jouent déjà' },
          ].map((n) => (
            <Tuile
              key={n.titre}
              titre={n.titre}
              sous={n.sous}
              actif={montre('niveau') && debutants === n.valeur}
              largeur={largeur2}
              onPress={() => {
                vibrer.selection();
                setDebutants(n.valeur);
                setTimeout(() => valider('niveau'), PAUSE_CHOIX);
              }}
            />
          ))}
        </View>
      );
    }
    return (
      <View style={[styles.dansMarges, styles.panneau]}>
        {suggestions.length > 0 ? (
          // Les lieux du sport les plus proches, en tuiles ; « Sur la carte » pour poser son point ailleurs
          <View style={styles.tuiles}>
            {suggestions.slice(0, 5).map(({ lieu: suggestion, distance }) => (
              <Tuile
                key={suggestion.id}
                titre={suggestion.nom}
                sous={texteDistance(distance)}
                actif={montre('ou') && lieuConnu?.id === suggestion.id}
                largeur={largeur3}
                onPress={() => choisirLieuSport(suggestion)}
              />
            ))}
            <Tuile
              titre={lieu.choisi && !lieuConnu ? lieu.nom : 'Sur la carte'}
              sous={lieu.choisi && !lieuConnu ? 'changer' : 'place l’épingle'}
              actif={montre('ou') && lieu.choisi && !lieuConnu}
              largeur={largeur3}
              onPress={() => setCarteOuverte(true)}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lieu.choisi ? `Lieu : ${lieu.nom}. Changer` : 'Choisir le lieu sur la carte'}
            onPress={() => setCarteOuverte(true)}
            style={({ pressed }) => [styles.lieu, pressed && { opacity: 0.85 }]}>
            <View style={styles.apercu}>
              <ApercuCarte key={`${lieu.position.latitude},${lieu.position.longitude}`} position={lieu.position} />
            </View>
            <View style={styles.lieuBas}>
              <View style={styles.textes}>
                <Text maxFontSizeMultiplier={1.3} style={styles.fort} numberOfLines={1}>
                  {lieu.choisi ? lieu.nom : 'Lieu à choisir'}
                </Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.aide} numberOfLines={1}>
                  {lieu.choisi ? lieu.commune || 'Lieu choisi' : 'Place l’épingle là où vous jouez'}
                </Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.changer}>
                {lieu.choisi ? 'Changer' : 'Choisir sur la carte'}
              </Text>
            </View>
          </Pressable>
        )}
        {lieu.choisi && montre('ou') && (
          <TextInput
            value={precision}
            onChangeText={setPrecision}
            placeholder="Nom du lieu (facultatif) : terrain, salle, parc"
            placeholderTextColor={c.texteSecondaire}
            maxLength={40}
            returnKeyType="done"
            style={styles.champ}
          />
        )}
      </View>
    );
  }

  const enPhrase = mode === 'phrase';
  const basPied = Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur;

  return (
    <View style={styles.fond}>
      <ScrollView
        ref={defilement}
        style={StyleSheet.absoluteFill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: top + 16,
          paddingBottom: basPied + (mode === 'etapes' || enPhrase ? HAUTEUR_PIED : 0) + 24,
          gap: 20,
        }}>
        <View style={[styles.haut, styles.dansMarges]}>
          {retourPossible && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={retour}
              hitSlop={8}
              style={({ pressed }) => [styles.retour, pressed && styles.presse]}>
              <IconeRetour couleur={c.encre} taille={20} />
            </Pressable>
          )}
          <Text maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.titre}>
            Créer
          </Text>
        </View>

        {mode === 'depart' && (
          <Animated.View entering={FadeInDown.duration(Durees.standard)} style={[styles.dansMarges, styles.depart]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                vibrer.selection();
                setSport(null);
                setDebutChoisi(null);
                setPrecision('');
                setEvenementId(null);
                setLieu((avant) => ({ ...avant, choisi: false }));
                nouvelle();
              }}
              style={({ pressed }) => [styles.nouvelle, pressed && styles.nouvellePressee]}>
              <View style={styles.nouvellePlus}>
                <IconeCreer couleur={c.surRouge} taille={26} />
              </View>
              <View style={styles.textes}>
                <Text maxFontSizeMultiplier={1.3} style={styles.nouvelleTitre}>
                  Nouvelle session
                </Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.nouvelleTexte}>
                  6 choix, un à la fois
                </Text>
              </View>
              <IconeChevron couleur={c.surRouge} taille={20} />
            </Pressable>

            <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>
              Relancer
            </Text>
            {modeles.map((m) => {
              const ficheM = ficheSport(m.sport);
              const creneau = m.heure ? prochainCreneau(m.heure.heures, m.heure.minutes, ouverture) : null;
              return (
                <Pressable
                  key={`${m.sport}-${m.lieu.nom}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Relancer : ${ficheM.nom}, ${m.lieu.nom}, ${m.joueurs} joueurs${creneau ? `, ${quandCreation(creneau, ouverture)}` : ''}`}
                  onPress={() => relancer(m)}
                  style={({ pressed }) => [styles.relance, pressed && styles.presse]}>
                  <Image source={ImagesSports[m.sport]} style={styles.relancePhoto} accessibilityIgnoresInvertColors />
                  <View style={styles.textes}>
                    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.fort}>
                      {ficheM.nom} · {m.lieu.nom}
                    </Text>
                    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.aide}>
                      {m.joueurs} joueurs{creneau ? ` · ${quandCreation(creneau, ouverture)}` : ''}
                    </Text>
                  </View>
                  <IconeChevron couleur={c.texteSecondaire} taille={18} />
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {(mode === 'etapes' || enPhrase) && (
          <View style={styles.dansMarges}>
            {/* La phrase se remplit à chaque choix (idée de Mathias) ; toucher un mot y revient */}
            {/* TEMPORAIRE : repère de version (à retirer) */}
            <Text style={{ fontSize: 11, color: c.texteSecondaire }}>
              {`Version surligneur B · ${Updates.updateId?.slice(0, 8) ?? 'sans mise à jour'}`}
            </Text>
            <PhraseCreation morceaux={morceaux} onToucher={toucherPhrase} />
          </View>
        )}

        {evenement && (mode === 'etapes' || enPhrase) && (
          <View style={[styles.evenement, styles.dansMarges]}>
            <IconeDrapeau couleur={c.encre} taille={22} />
            <View style={styles.textes}>
              <Text maxFontSizeMultiplier={1.3} style={styles.fort} numberOfLines={1}>
                Pour {evenement.nom}
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.aide} numberOfLines={2}>
                Départ {quand(evenement.debut, ouverture).toLowerCase()}. L’inscription à l’événement se fait sur son site.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ne plus rattacher la session à ${evenement.nom}`}
              hitSlop={8}
              onPress={() => {
                vibrer.selection();
                setEvenementId(null);
              }}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.fort, { color: c.rougeTexte }]}>
                Retirer
              </Text>
            </Pressable>
          </View>
        )}

        {mode === 'etapes' && (
          // Une question à la fois : elle arrive doucement par en dessous
          // La question est déjà au bout de la phrase, en gris : pas besoin de la répéter
          <Animated.View key={etape} entering={FadeInDown.duration(Durees.standard)} style={styles.section}>
            {panneau(etape)}
          </Animated.View>
        )}

        {enPhrase && edition && (
          <Animated.View key={edition} entering={FadeInDown.duration(Durees.standard)} style={styles.section}>
            <View style={[styles.ligne, styles.dansMarges]}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.question, styles.textes]}>
                {QUESTIONS[edition]}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setEdition(null)}>
                <Text maxFontSizeMultiplier={1.3} style={styles.changer}>
                  Fermer
                </Text>
              </Pressable>
            </View>
            {panneau(edition)}
          </Animated.View>
        )}

        {enPhrase && !edition && (
          <Text maxFontSizeMultiplier={1.3} style={[styles.aide, styles.dansMarges]}>
            Touche un mot surligné pour le changer.
          </Text>
        )}
      </ScrollView>

      {/* Comme la maquette : où on en est, et « Publier », qui s'allume quand tout est choisi */}
      {(mode === 'etapes' || enPhrase) && (
        <View style={[styles.pied, { paddingBottom: basPied + 10 }]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.recap} numberOfLines={1}>
            {enPhrase ? 'Prêt à publier' : `${faits.length + ORDRE.length - aFaire.length} sur ${ORDRE.length}`}
          </Text>
          <Bouton
            titre={envoi ? 'Envoi…' : 'Publier la session'}
            disabled={envoi || !enPhrase}
            attente={envoi}
            onPress={publier}
          />
        </View>
      )}
      {carteOuverte && (
        <ChoixLieu
          ouvert
          depart={lieu}
          lieux={suggestions.length ? lieuxDuSport(lieux, sport!, lieu.position).map((s) => s.lieu) : []}
          onFermer={() => setCarteOuverte(false)}
          onChoisir={(choisi) => {
            setLieu(choisi);
            setCarteOuverte(false);
            setTimeout(() => valider('ou'), PAUSE_CHOIX);
          }}
        />
      )}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { flex: 1, backgroundColor: c.fond },
    // Le pied descend jusqu'en bas : la barre flottante passe par-dessus, le contenu défile dessous sans se mélanger
    pied: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 10,
      paddingHorizontal: Espaces.marge,
      gap: 8,
      backgroundColor: c.fond,
      borderTopWidth: 1,
      borderTopColor: c.trait,
    },
    recap: { ...Polices.texteMoyen, fontSize: Tailles.aide, color: c.texteSecondaire, textAlign: 'center' },
    dansMarges: { marginHorizontal: Espaces.marge },
    haut: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: Espaces.cibleTactile },
    retour: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    titre: { flex: 1, fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    section: { gap: 12 },
    panneau: { gap: 12 },
    question: { ...Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    etiquette: { ...Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    textes: { flex: 1, gap: 2 },
    fort: { ...Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    aide: { ...Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
    presse: { backgroundColor: c.beige },
    depart: { gap: 12 },
    nouvelle: {
      minHeight: 76,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: Rayons.carte,
      backgroundColor: c.rouge,
      boxShadow: c.ombre,
    },
    nouvellePressee: { opacity: 0.85 },
    nouvellePlus: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.marqueurSurRouge,
    },
    nouvelleTitre: { fontFamily: Polices.titre, fontSize: Tailles.titreCarte, color: c.surRouge },
    nouvelleTexte: { ...Polices.texte, fontSize: Tailles.aide, color: c.surRouge, opacity: 0.85 },
    relance: {
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    relancePhoto: { width: 66, height: 44, borderRadius: 12, backgroundColor: c.beige },
    evenement: {
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.beige,
      borderRadius: 18,
    },
    tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tuileActive: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    tuileTexteActif: { ...Polices.texteDemi, color: c.rougeTexte },
    tuileChoix: {
      minHeight: 64,
      paddingHorizontal: 8,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: c.carte,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    tuileTitre: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.encre, textAlign: 'center' },
    tuileSous: { ...Polices.texte, fontSize: Tailles.pastille, color: c.texteSecondaire, textAlign: 'center' },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    puce: {
      minHeight: Espaces.cibleTactile,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    puceActive: { backgroundColor: c.encre, borderColor: c.encre },
    puceTexte: { ...Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    lieu: {
      overflow: 'hidden',
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    apercu: { height: 110 },
    lieuBas: {
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    // La rangée de lieux déborde jusqu'aux bords de l'écran
    suggestionsZone: { marginHorizontal: -Espaces.marge },
    suggestions: { gap: 8, paddingHorizontal: Espaces.marge },
    suggestion: {
      maxWidth: 220,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 8,
      justifyContent: 'center',
      gap: 2,
      backgroundColor: c.carte,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    suggestionActive: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    suggestionNom: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    changer: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    champ: {
      height: 52,
      paddingHorizontal: 14,
      backgroundColor: c.carte,
      borderRadius: Rayons.bouton,
      borderWidth: 1.5,
      borderColor: c.trait,
      ...Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
  });

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { Bouton } from '@/components/bouton';
import { ChoixDateHeure } from '@/components/choix-date-heure';
import { ChoixJoueurs } from '@/components/choix-joueurs';
import { ChoixLieu } from '@/components/choix-lieu';
import { IconeDrapeau, IconeRelancer } from '@/components/icones';
import { PhraseCreation } from '@/components/phrase-creation';
import { PictoQuiSaute } from '@/components/picto-sport';
import { BarreNavigation, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { Pictos, type Sport } from '@/donnees/pictos';
import { CENTRE_ZONE } from '@/donnees/sessions';
import { SPORTS, ficheSport } from '@/donnees/sports';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { useEvenements } from '@/lib/evenements';
import { quand, quandCreation, texteDistance } from '@/lib/formats';
import { phraseCreation, type Champ } from '@/lib/phrase-creation';
import { vibrer } from '@/lib/haptics';
import { LIEU_PAR_DEFAUT, nommer, type Lieu } from '@/lib/lieux';
import { lieuA, lieuxDuSport, texteType, useLieuxSport, type LieuSport } from '@/lib/lieux-sport';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';
import { etapePublication } from '@/lib/regles-sessions';
import { marquerVue } from '@/lib/apparitions';

const MINUTE = 60_000;
/** Place prise par le pied (récapitulatif + bouton Publier) au-dessus de la barre */
const HAUTEUR_PIED = 92;
/** Durées proposées, en minutes */
const DUREES = [
  { minutes: 60, titre: '1h' },
  { minutes: 90, titre: '1h30' },
  { minutes: 120, titre: '2h' },
  { minutes: 180, titre: '3h' },
];
/** Bornes de « Quand » : de la minute en cours jusqu'à 7 jours (la carte montre les 7 prochains jours) */
function bornes(maintenant: Date) {
  const min = new Date(maintenant);
  min.setSeconds(0, 0);
  const max = new Date(maintenant);
  max.setDate(max.getDate() + 7);
  max.setHours(0, 0, 0, 0);
  return { min, max };
}

/** Ce qu'on retient de la dernière session publiée depuis ce téléphone : sert à pré-remplir et à « Relancer » */
type Modele = { sport: Sport; joueurs: number; duree: number; debutants: boolean; lieu: Omit<Lieu, 'choisi'> };
const CLE_MODELE = 'catch.derniere-creation';

export default function Creer() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Tous les sports d'un coup d'œil : 5 tuiles par ligne, 8 px entre elles
  // 4 par ligne sur les petits téléphones, pour que « Badminton » ne soit pas coupé
  const parLigne = width < 360 ? 4 : 5;
  const largeurTuile = Math.floor((width - 2 * Espaces.marge - (parLigne - 1) * 8) / parLigne);
  const { compte } = useCompte();
  const { creer, position } = useSessions();

  // L'onglet reste ouvert en arrière-plan : « Aujourd'hui » et les heures proposées sont recalculés à chaque retour
  const [ouverture, setOuverture] = useState(() => new Date());
  useFocusEffect(useCallback(() => setOuverture(new Date()), []));
  const { min: dateMin, max: maxHabituel } = useMemo(() => bornes(ouverture), [ouverture]);

  // Première création : rien n'est pré-rempli, 3 choix seulement (sport, quand, où). Ensuite tout l'est.
  // `undefined` le temps de relire le téléphone.
  const [modele, setModele] = useState<Modele | null | undefined>(undefined);
  const premiereFois = modele === null;
  const [plusDOptions, setPlusDOptions] = useState(false);
  const [sport, setSport] = useState<Sport | null>(null);
  // Début choisi avec le sélecteur du système. `null` : maintenant, l'heure exacte du téléphone,
  // qui suit l'horloge tant qu'on n'y touche pas (il suffit de valider)
  const [debutChoisi, setDebutChoisi] = useState<Date | null>(null);
  const [lieu, setLieu] = useState<Lieu>(LIEU_PAR_DEFAUT);
  const [precision, setPrecision] = useState('');
  const [joueurs, setJoueurs] = useState(ficheSport('foot').joueurs);
  const [debutants, setDebutants] = useState(true);
  const [duree, setDuree] = useState(90);
  // Vrai après un « Publier » sans lieu choisi : on explique pourquoi la carte s'est ouverte
  const [lieuDemande, setLieuDemande] = useState(false);
  const [enAttente, setEnAttente] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [carteOuverte, setCarteOuverte] = useState(false);
  // Toucher un mot de la phrase descend jusqu'au choix correspondant
  const defilement = useRef<ScrollViewInstance>(null);
  const positions = useRef<Partial<Record<Champ, number>>>({});
  const lieux = useLieuxSport();
  // « Lancer une session ici » depuis la fiche d'un lieu : Créer s'ouvre avec ce sport et ce lieu
  const params = useLocalSearchParams<{ lieu?: string; sport?: string; evenement?: string }>();
  // « On y va ensemble » depuis la fiche d'un événement : la session est rattachée à cet événement
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

  // On relit la dernière création au démarrage et on pré-remplit avec : dernier sport, dernier lieu, mêmes réglages
  useEffect(() => {
    AsyncStorage.getItem(CLE_MODELE)
      .then((texte) => {
        const lu: Modele | null = texte ? JSON.parse(texte) : null;
        setModele(lu);
        // Ouvert depuis « Lancer une session ici » : le sport et le lieu demandés passent avant la dernière création
        if (!lu || params.lieu || params.evenement) return;
        setSport(lu.sport);
        setJoueurs(lu.joueurs);
        setDuree(lu.duree);
        setDebutants(lu.debutants);
        setLieu({ ...lu.lieu, choisi: true });
      })
      .catch(() => setModele(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisirSport(cle: Sport) {
    if (cle === sport) return;
    vibrer.selection();
    setSport(cle);
    setJoueurs(ficheSport(cle).joueurs);
  }

  function relancer() {
    if (!modele) return;
    vibrer.selection();
    setSport(modele.sport);
    setJoueurs(modele.joueurs);
    setDuree(modele.duree);
    setDebutants(modele.debutants);
    setPrecision('');
    setLieu({ ...modele.lieu, choisi: true });
  }

  function choisirLieuSport(choisi: LieuSport) {
    vibrer.selection();
    setLieuDemande(false);
    setPrecision('');
    setLieu({ position: choisi.position, nom: choisi.nom, commune: choisi.commune, choisi: true });
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
    if (cle !== sport) setJoueurs(ficheSport(cle).joueurs);
    setPrecision('');
    setLieuDemande(false);
    setLieu({ position: lieuVenu.position, nom: lieuVenu.nom, commune: lieuVenu.commune, choisi: true });
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
    if (evenementVenu.sport !== sport) setJoueurs(ficheSport(evenementVenu.sport).joueurs);
    setDebutChoisi(evenementVenu.debut);
    setPrecision('');
    setLieuDemande(false);
    setLieu({
      position: evenementVenu.position,
      nom: evenementVenu.depart,
      commune: evenementVenu.commune,
      choisi: true,
    });
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
  const debutAffiche = debutChoisi && debutChoisi > dateMin ? debutChoisi : dateMin;
  // À moins de 5 minutes d'ici, c'est « maintenant »
  const maintenant = debutAffiche.getTime() - dateMin.getTime() < 5 * MINUTE;
  const texteQuand = maintenant ? 'maintenant' : quand(debutAffiche, ouverture).toLowerCase();
  /** Le début de la session au moment de publier : jamais dans le passé */
  function debutAPublier() {
    const maintenant = new Date();
    return debutChoisi && debutChoisi > maintenant ? debutChoisi : maintenant;
  }
  const texteDuree = DUREES.find((d) => d.minutes === duree)?.titre ?? '1h30';
  // La phrase du haut : chaque choix y est surligné, ce qui manque est un trou à remplir
  const morceaux = phraseCreation({
    sport: sport ? { cle: sport, nom: fiche.nom } : null,
    quand: maintenant ? 'maintenant' : quandCreation(debutAffiche, ouverture),
    joueurs: sport ? joueurs : null,
    lieu: lieu.choisi ? nomLieu : null,
  });
  function allerA(champ: Champ) {
    vibrer.selection();
    // Le lieu pas encore choisi : la carte s'ouvre directement
    if (champ === 'ou' && !lieu.choisi && !suggestions.length) {
      setCarteOuverte(true);
      return;
    }
    const y = positions.current[champ];
    if (y !== undefined) defilement.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }
  // Ce qu'il reste à choisir avant de pouvoir publier
  const manque = [!sport && 'un sport', !lieu.choisi && 'un lieu'].filter(Boolean) as string[];
  const recap =
    sport
      ? `${fiche.nom} · ${texteQuand} · ${texteDuree} · ${joueurs} joueurs`
      : `Choisis ${manque.join(', ').replace(/, ([^,]*)$/, ' et $1')}`;

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
          : 'Ça n’a pas marché. Vérifie ta connexion et réessaie.',
      );
      return;
    }
    const { id } = resultat;
    vibrer.succes();
    // On retient cette création : la prochaine fois, tout sera pré-rempli avec
    const nouveau: Modele = {
      sport,
      joueurs,
      duree,
      debutants,
      lieu: { position: lieu.position, nom: nomLieu, commune: lieu.commune },
    };
    setModele(nouveau);
    AsyncStorage.setItem(CLE_MODELE, JSON.stringify(nouveau)).catch(() => {});
    // Le formulaire repart de zéro : revenir ici ne publie pas la même session une deuxième fois
    setPrecision('');
    setDebutChoisi(null);
    setEvenementId(null);
    setLieu((avant) => ({ ...avant, choisi: false }));
    setLieuDemande(false);
    // Retour sur la carte : la session y tombe à sa place (sa pastille ne sort pas de terre comme les autres)
    marquerVue(id);
    router.navigate({ pathname: '/', params: { publiee: id } });
  }

  function publier() {
    const etape = etapePublication({ sportChoisi: !!sport, lieuChoisi: lieu.choisi, connecte: !!compte?.prenom });
    // Sport pas encore choisi : la phrase du bas dit ce qui manque
    if (etape === 'sport') {
      vibrer.avertissement();
      return;
    }
    // Pas de lieu par défaut publié par mégarde : on ouvre la carte pour le choisir
    if (etape === 'lieu') {
      vibrer.avertissement();
      setLieuDemande(true);
      setCarteOuverte(true);
      return;
    }
    if (etape === 'envoyer') {
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

  return (
    <View style={styles.fond}>
      <ScrollView
        ref={defilement}
        style={StyleSheet.absoluteFill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: top + 24,
          paddingBottom: Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + HAUTEUR_PIED + 24,
          gap: 20,
        }}>
        <View style={styles.marges}>
          <Text maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.titre}>
            Créer une session
          </Text>
          {/* La phrase se réécrit toute seule pendant qu'on fait ses choix (idée de Mathias) */}
          <PhraseCreation morceaux={morceaux} onToucher={allerA} />
        </View>

        {evenement && (
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

        {modele && !evenement && (
          <Pressable
            accessibilityRole="button"
            onPress={relancer}
            style={({ pressed }) => [styles.relancer, styles.dansMarges, pressed && { opacity: 0.7 }]}>
            <IconeRelancer couleur={c.rouge} taille={22} />
            <View style={styles.textes}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.fort, { color: c.rougeTexte }]}>Relancer ta dernière session</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.aide, { color: c.rougeTexte }]} numberOfLines={1}>
                {ficheSport(modele.sport).nom} · {modele.lieu.nom}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.section} onLayout={(e) => {
          positions.current.sport = e.nativeEvent.layout.y;
        }}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.dansMarges]}>Sport</Text>
          <View style={[styles.tuiles, styles.dansMarges]}>
            {SPORTS.map(({ cle, nom, nomTuile }) => {
              const actif = cle === sport;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => choisirSport(cle)}
                  style={[styles.tuile, { width: largeurTuile }, actif && styles.tuileActive]}>
                  <PictoQuiSaute sport={cle} taille={32} actif={actif} />
                  <Text maxFontSizeMultiplier={1.3}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[styles.tuileTexte, actif && styles.tuileTexteActif]}>
                    {nomTuile ?? nom}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section} onLayout={(e) => {
          positions.current.quand = e.nativeEvent.layout.y;
        }}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.dansMarges]}>Quand</Text>
          {/* L'heure exacte du téléphone par défaut : pour « maintenant », il suffit de valider */}
          <View style={styles.dansMarges}>
            <ChoixDateHeure
              valeur={debutAffiche}
              onChange={setDebutChoisi}
              min={dateMin}
              max={dateMax}
              pasMinutes={1}
            />
          </View>
        </View>

        <View style={styles.section} onLayout={(e) => {
          positions.current.joueurs = e.nativeEvent.layout.y;
        }}>
          <View style={[styles.ligne, styles.dansMarges]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>Joueurs</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.aide}>toi compris</Text>
          </View>
          <View style={styles.dansMarges}>
            <ChoixJoueurs valeur={joueurs} onChange={setJoueurs} />
          </View>
        </View>

        <View style={[styles.section, styles.dansMarges]} onLayout={(e) => {
          positions.current.ou = e.nativeEvent.layout.y;
        }}>
          <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>Où</Text>
          {suggestions.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsZone}
              contentContainerStyle={styles.suggestions}>
              {suggestions.map(({ lieu: suggestion, distance }) => {
                const actif = lieuConnu?.id === suggestion.id;
                return (
                  <Pressable
                    key={suggestion.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actif }}
                    accessibilityLabel={`${suggestion.nom}, ${texteType(suggestion)}, ${texteDistance(distance)}`}
                    onPress={() => !actif && choisirLieuSport(suggestion)}
                    style={[styles.suggestion, actif && styles.suggestionActive]}>
                    <Text
                      maxFontSizeMultiplier={1.3}
                      numberOfLines={1}
                      style={[styles.suggestionNom, actif && { color: c.rougeTexte }]}>
                      {suggestion.nom}
                    </Text>
                    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.aide}>
                      {texteType(suggestion)} · {texteDistance(distance)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lieu.choisi ? `Lieu : ${lieu.nom}. Changer` : 'Choisir le lieu sur la carte'}
            onPress={() => setCarteOuverte(true)}
            style={({ pressed }) => [styles.lieu, pressed && { opacity: 0.85 }]}>
            <View style={styles.apercu}>
              <ApercuCarte
                key={`${lieu.position.latitude},${lieu.position.longitude}`}
                position={lieu.position}
              />
            </View>
            <View style={styles.lieuBas}>
              <View style={styles.textes}>
                <Text maxFontSizeMultiplier={1.3} style={styles.fort} numberOfLines={1}>
                  {lieu.choisi ? lieu.nom : 'Lieu à choisir'}
                </Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.aide, lieuDemande && !lieu.choisi && { color: c.rougeTexte }]} numberOfLines={1}>
                  {lieu.choisi
                    ? lieu.commune || 'Lieu choisi'
                    : suggestions.length
                      ? 'Touche un lieu au-dessus, ou place l’épingle'
                      : 'Place l’épingle là où vous jouez'}
                </Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.changer}>{lieu.choisi ? 'Changer' : 'Choisir sur la carte'}</Text>
            </View>
          </Pressable>
          <TextInput
            value={precision}
            onChangeText={setPrecision}
            placeholder="Nom du lieu (facultatif) : terrain, salle, parc"
            placeholderTextColor={c.texteSecondaire}
            maxLength={40}
            returnKeyType="done"
            style={styles.champ}
          />
        </View>

        {premiereFois && !plusDOptions ? (
          <View style={styles.dansMarges}>
            <Bouton
              titre="Plus d’options : durée, débutants"
              variante="lien"
              onPress={() => {
                vibrer.selection();
                setPlusDOptions(true);
              }}
            />
          </View>
        ) : (
          <>
        <View style={styles.section}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.dansMarges]}>Durée</Text>
          <View accessibilityRole="radiogroup" style={[styles.puces, styles.dansMarges]}>
            {DUREES.map(({ minutes, titre }) => {
              const actif = minutes === duree;
              return (
                <Pressable
                  key={minutes}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: actif }}
                  onPress={() => {
                    if (!actif) vibrer.selection();
                    setDuree(minutes);
                  }}
                  style={[styles.puce, actif && styles.puceActive]}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.puceTexte, actif && { color: c.surEncre }]}>{titre}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.ligne, styles.dansMarges]}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.textes]}>Débutants bienvenus</Text>
          <Switch
            value={debutants}
            onValueChange={(valeur) => {
              vibrer.selection();
              setDebutants(valeur);
            }}
            trackColor={{ true: c.rouge, false: c.trait }}
            thumbColor={c.rondPicto}
          />
        </View>

          </>
        )}
      </ScrollView>
      {/* Toujours visible au-dessus de la barre : ce qui sera publié, et le bouton */}
      <View
        style={[
          styles.pied,
          { paddingBottom: Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + 10 },
        ]}>
        <Text maxFontSizeMultiplier={1.3} style={styles.recap} numberOfLines={1}>
          {recap}
        </Text>
        <Bouton titre={envoi ? 'On la pose sur la carte…' : 'Publier la session'} disabled={envoi} attente={envoi} onPress={publier} />
      </View>
      {carteOuverte && (
        <ChoixLieu
          ouvert
          depart={lieu}
          lieux={suggestions.length ? lieuxDuSport(lieux, sport!, lieu.position).map((s) => s.lieu) : []}
          onFermer={() => setCarteOuverte(false)}
          onChoisir={(choisi) => {
            setLieuDemande(false);
            setLieu(choisi);
            setCarteOuverte(false);
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
    recap: {
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.aide,
      color: c.texteSecondaire,
      textAlign: 'center',
    },
    marges: { paddingHorizontal: Espaces.marge, gap: 10 },
    dansMarges: { marginHorizontal: Espaces.marge },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    section: { gap: 10 },
    etiquette: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    textes: { flex: 1, gap: 2 },
    fort: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    ligne: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minHeight: 24 },
    relancer: {
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.rougeDoux,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.rougeBordure,
    },
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
    tuile: {
      minHeight: 68,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      backgroundColor: c.carte,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    tuileActive: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    tuileTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.encre },
    tuileTexteActif: { fontFamily: Polices.texteDemi, color: c.rougeTexte },
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
    puceTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
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
    suggestionNom: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    changer: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    champ: {
      height: 52,
      paddingHorizontal: 14,
      backgroundColor: c.carte,
      borderRadius: Rayons.bouton,
      borderWidth: 1.5,
      borderColor: c.trait,
      fontFamily: Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
  });

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { Bouton } from '@/components/bouton';
import { ChoixLieu } from '@/components/choix-lieu';
import { IconeRelancer } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Roulette } from '@/components/roulette';
import { BarreNavigation, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { SPORTS, ficheSport } from '@/donnees/sports';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { heure, quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { LIEU_PAR_DEFAUT, nommer, type Lieu } from '@/lib/lieux';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const MINUTE = 60_000;
/** Durées proposées, en minutes */
const DUREES = [
  { minutes: 60, titre: '1h' },
  { minutes: 90, titre: '1h30' },
  { minutes: 120, titre: '2h' },
  { minutes: 180, titre: '3h' },
];
const NOMBRES = Array.from({ length: 29 }, (_, i) => i + 2); // de 2 à 30 joueurs
const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
/** « Maintenant », ou une heure de la journée en minutes depuis minuit */
type Creneau = 'maintenant' | number;

/** Les 7 prochains jours : « Aujourd'hui », « Demain », « Mer. 18 » */
function jours(maintenant: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + i);
    const titre = i === 0 ? 'Aujourd’hui' : i === 1 ? 'Demain' : `${JOURS[date.getDay()]} ${date.getDate()}`;
    return { ecart: i, titre };
  });
}

/** Les heures proposées, de demi-heure en demi-heure. Aujourd'hui : « Maintenant », puis ce qui reste. */
function creneaux(ecartJour: number, maintenant: Date): Creneau[] {
  const liste: number[] = [];
  for (let minutes = 6 * 60; minutes <= 23 * 60 + 30; minutes += 30) liste.push(minutes);
  if (ecartJour > 0) return liste;
  const passe = maintenant.getHours() * 60 + maintenant.getMinutes();
  return ['maintenant', ...liste.filter((minutes) => minutes > passe + 10)];
}

function dateDe(ecartJour: number, creneau: Creneau) {
  const date = new Date();
  if (creneau === 'maintenant') return date;
  date.setDate(date.getDate() + ecartJour);
  date.setHours(Math.floor(creneau / 60), creneau % 60, 0, 0);
  return date;
}

function texteCreneau(creneau: Creneau) {
  return creneau === 'maintenant' ? 'Maintenant' : heure(dateDe(0, creneau));
}

/** Les raccourcis de « Quand » : un appui suffit dans la plupart des cas */
type Raccourci = 'maintenant' | 'soir' | 'demain' | 'autre';

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
  const { creer, derniereCreee, position } = useSessions();

  // L'onglet reste ouvert en arrière-plan : « Aujourd'hui » et les heures proposées sont recalculés à chaque retour
  const [ouverture, setOuverture] = useState(() => new Date());
  useFocusEffect(useCallback(() => setOuverture(new Date()), []));
  const listeJours = useMemo(() => jours(ouverture), [ouverture]);
  // Par défaut : ce soir 19h s'il reste du temps, sinon demain 19h
  const encoreCeSoir = ouverture.getHours() * 60 + ouverture.getMinutes() < 18 * 60 + 30;

  const [sport, setSport] = useState<Sport>('foot');
  const [raccourci, setRaccourci] = useState<Raccourci>(encoreCeSoir ? 'soir' : 'demain');
  const [jour, setJour] = useState(encoreCeSoir ? 0 : 1);
  const [creneau, setCreneau] = useState<Creneau>(19 * 60);
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

  const listeCreneaux = useMemo(() => creneaux(jour, ouverture), [jour, ouverture]);
  // L'heure choisie n'existe plus ce jour-là (déjà passée) : on prend la première proposée
  const indexCreneau = Math.max(0, listeCreneaux.indexOf(creneau));
  const creneauChoisi = listeCreneaux[indexCreneau];

  // Si la position est déjà connue, la carte du lieu s'ouvrira autour de soi.
  // Ce n'est qu'un point de départ : le lieu reste à choisir, on ne publie jamais sa propre position sans le vouloir.
  useEffect(() => {
    if (position && !lieu.choisi) nommer(position).then((proche) => setLieu({ ...proche, choisi: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  function choisirSport(cle: Sport) {
    if (cle === sport) return;
    vibrer.selection();
    setSport(cle);
    setJoueurs(ficheSport(cle).joueurs);
  }

  function relancer() {
    if (!derniereCreee) return;
    vibrer.selection();
    setSport(derniereCreee.sport);
    setJoueurs(derniereCreee.joueurs);
    setDebutants(derniereCreee.debutantsBienvenus);
    setPrecision('');
    setLieu({
      position: derniereCreee.position,
      nom: derniereCreee.lieu,
      commune: derniereCreee.commune,
      choisi: true,
    });
  }

  const fiche = ficheSport(sport);
  const nomLieu = precision.trim() || lieu.nom;
  /** Le début de la session, d'après le raccourci ou le jour et l'heure choisis */
  function debutChoisi() {
    if (raccourci === 'maintenant') return new Date();
    if (raccourci === 'soir') return dateDe(0, 19 * 60);
    if (raccourci === 'demain') return dateDe(1, 19 * 60);
    return dateDe(jour, creneauChoisi);
  }
  const maintenant =
    raccourci === 'maintenant' || (raccourci === 'autre' && creneauChoisi === 'maintenant');
  const texteQuand = maintenant ? 'maintenant' : quand(debutChoisi(), ouverture).toLowerCase();
  const texteDuree = DUREES.find((d) => d.minutes === duree)?.titre ?? '1h30';
  const raccourcis: { cle: Raccourci; titre: string }[] = [
    { cle: 'maintenant', titre: 'Maintenant' },
    ...(encoreCeSoir ? [{ cle: 'soir' as const, titre: 'Ce soir 19h' }] : []),
    { cle: 'demain', titre: 'Demain 19h' },
    { cle: 'autre', titre: 'Autre' },
  ];

  async function envoyer() {
    if (envoi) return;
    setEnvoi(true);
    const debut = debutChoisi();
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
    // Le formulaire repart de zéro : revenir ici ne publie pas la même session une deuxième fois
    setPrecision('');
    setLieu((avant) => ({ ...avant, choisi: false }));
    setLieuDemande(false);
    router.push({ pathname: '/session/[id]', params: { id } });
  }

  function publier() {
    // Pas de lieu par défaut publié par mégarde : on ouvre la carte pour le choisir
    if (!lieu.choisi) {
      vibrer.avertissement();
      setLieuDemande(true);
      setCarteOuverte(true);
      return;
    }
    if (compte?.prenom) {
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
        style={StyleSheet.absoluteFill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: top + 24,
          paddingBottom: Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + 24,
          gap: 20,
        }}>
        <View style={styles.marges}>
          <Text accessibilityRole="header" style={styles.titre}>
            Créer une session
          </Text>
          {/* La phrase se réécrit toute seule pendant qu'on fait glisser les choix */}
          <Text style={styles.phrase}>
            {fiche.nom} · {texteQuand} · {texteDuree} · {joueurs} joueurs
          </Text>
        </View>

        {derniereCreee && (
          <Pressable
            accessibilityRole="button"
            onPress={relancer}
            style={({ pressed }) => [styles.relancer, styles.dansMarges, pressed && { opacity: 0.7 }]}>
            <IconeRelancer couleur={c.rouge} taille={22} />
            <View style={styles.textes}>
              <Text style={[styles.fort, { color: c.rougeTexte }]}>Relancer ta dernière session</Text>
              <Text style={[styles.aide, { color: c.rougeTexte }]} numberOfLines={1}>
                {derniereCreee.titre} · {derniereCreee.lieu}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={[styles.etiquette, styles.dansMarges]}>Sport</Text>
          <View style={[styles.tuiles, styles.dansMarges]}>
            {SPORTS.map(({ cle, nom }) => {
              const actif = cle === sport;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => choisirSport(cle)}
                  style={[styles.tuile, { width: largeurTuile }, actif && styles.tuileActive]}>
                  <PictoSport sport={cle} taille={32} />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[styles.tuileTexte, actif && styles.tuileTexteActif]}>
                    {nom}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.etiquette, styles.dansMarges]}>Quand</Text>
          <View style={[styles.puces, styles.dansMarges]}>
            {raccourcis.map(({ cle, titre }) => {
              const actif = cle === raccourci;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => {
                    if (!actif) vibrer.selection();
                    setRaccourci(cle);
                  }}
                  style={[styles.puce, actif && styles.puceActive]}>
                  <Text style={[styles.puceTexte, actif && { color: c.surEncre }]}>{titre}</Text>
                </Pressable>
              );
            })}
          </View>
          {raccourci === 'autre' && (
            <>
              {/* Peu de jours : des pastilles à toucher. Beaucoup d'heures qui se suivent : une bande à glisser. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jours}>
                {listeJours.map((j) => {
                  const actif = j.ecart === jour;
                  return (
                    <Pressable
                      key={j.ecart}
                      accessibilityRole="button"
                      accessibilityState={{ selected: actif }}
                      onPress={() => {
                        if (!actif) vibrer.selection();
                        setJour(j.ecart);
                      }}
                      style={[styles.jour, actif && styles.jourActif]}>
                      <Text style={[styles.puceTexte, actif && { color: c.rougeTexte }]}>
                        {j.titre}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Roulette
                // Les heures proposées changent avec le jour : la bande repart au bon endroit
                key={jour}
                elements={listeCreneaux}
                index={indexCreneau}
                onChange={(i) => setCreneau(listeCreneaux[i])}
                largeur={creneauChoisi === 'maintenant' ? 124 : 84}
                hauteur={56}
                cle={(c) => String(c)}
                etiquette="Heure"
                valeur={texteCreneau(creneauChoisi)}
                rendre={(c, actif) => (
                  <Text style={[styles.heure, actif ? styles.heureActive : styles.efface]}>
                    {texteCreneau(c)}
                  </Text>
                )}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.etiquette, styles.dansMarges]}>Durée</Text>
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
                  <Text style={[styles.puceTexte, actif && { color: c.surEncre }]}>{titre}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.ligne, styles.dansMarges]}>
            <Text style={styles.etiquette}>Joueurs</Text>
            <Text style={styles.aide}>toi compris</Text>
          </View>
          <Roulette
            elements={NOMBRES}
            index={NOMBRES.indexOf(joueurs)}
            onChange={(i) => setJoueurs(NOMBRES[i])}
            largeur={64}
            hauteur={64}
            cle={String}
            etiquette="Nombre de joueurs"
            valeur={`${joueurs} joueurs`}
            rendre={(n, actif) => (
              <Text style={[styles.nombre, actif ? styles.nombreActif : styles.efface]}>{n}</Text>
            )}
          />
        </View>

        <View style={[styles.section, styles.dansMarges]}>
          <Text style={styles.etiquette}>Où</Text>
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
                <Text style={styles.fort} numberOfLines={1}>
                  {lieu.choisi ? lieu.nom : 'Lieu à choisir'}
                </Text>
                <Text style={[styles.aide, lieuDemande && !lieu.choisi && { color: c.rougeTexte }]} numberOfLines={1}>
                  {lieu.choisi ? lieu.commune || 'Lieu choisi' : 'Place l’épingle là où vous jouez'}
                </Text>
              </View>
              <Text style={styles.changer}>{lieu.choisi ? 'Changer' : 'Choisir sur la carte'}</Text>
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

        <View style={[styles.ligne, styles.dansMarges]}>
          <Text style={[styles.etiquette, styles.textes]}>Débutants bienvenus</Text>
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

        <View style={styles.dansMarges}>
          <Bouton titre={envoi ? 'Publication…' : 'Publier la session'} disabled={envoi} onPress={publier} />
        </View>
      </ScrollView>
      {carteOuverte && (
        <ChoixLieu
          ouvert
          depart={lieu}
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
    marges: { paddingHorizontal: Espaces.marge, gap: 4 },
    dansMarges: { marginHorizontal: Espaces.marge },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre },
    phrase: { fontFamily: Polices.texteMoyen, fontSize: Tailles.courant, color: c.texteSecondaire },
    section: { gap: 10 },
    etiquette: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    textes: { flex: 1, gap: 2 },
    fort: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    ligne: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minHeight: 24 },
    efface: { opacity: 0.45 },
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
    tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tuile: {
      height: 68,
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
      height: Espaces.cibleTactile,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    puceActive: { backgroundColor: c.encre, borderColor: c.encre },
    puceTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    jours: { paddingHorizontal: Espaces.marge, gap: 8 },
    jour: {
      height: 40,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
      borderWidth: 1.5,
      borderColor: c.beige,
    },
    jourActif: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    heure: {
      fontFamily: Polices.titreDemi,
      fontSize: Tailles.sousTitre,
      color: c.encre,
      fontVariant: ['tabular-nums'],
    },
    heureActive: { fontFamily: Polices.titre, color: c.rougeTexte },
    nombre: {
      fontFamily: Polices.titreDemi,
      fontSize: Tailles.titreSession,
      color: c.encre,
      fontVariant: ['tabular-nums'],
    },
    nombreActif: { fontFamily: Polices.titre, fontSize: Tailles.grandNombre, color: c.rougeTexte },
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

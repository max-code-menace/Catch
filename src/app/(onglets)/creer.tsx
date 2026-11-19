import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ChoixDateHeure } from '@/components/choix-date-heure';
import { ChoixJoueurs } from '@/components/choix-joueurs';
import { ChoixLieu } from '@/components/choix-lieu';
import { IconeRelancer } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { BarreNavigation, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { SPORTS, ficheSport } from '@/donnees/sports';
import { prevenir } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { LIEU_PAR_DEFAUT, nommer, type Lieu } from '@/lib/lieux';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

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
/** Un jour à partir d'aujourd'hui (0 = aujourd'hui) et une heure en minutes depuis minuit */
function dateDe(ecartJour: number, minutes: number) {
  const date = new Date();
  date.setDate(date.getDate() + ecartJour);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

/** Bornes de « Autre » : du prochain quart d'heure jusqu'à 7 jours (la carte montre les 7 prochains jours) */
function bornes(maintenant: Date) {
  const min = new Date(maintenant);
  min.setSeconds(0, 0);
  min.setMinutes(Math.ceil((min.getMinutes() + 1) / 15) * 15);
  const max = new Date(maintenant);
  max.setDate(max.getDate() + 7);
  max.setHours(0, 0, 0, 0);
  return { min, max };
}

/** Les raccourcis de « Quand » : un appui suffit dans la plupart des cas */
type Raccourci = 'maintenant' | 'soir' | 'demain' | 'autre';

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
  const { min: dateMin, max: dateMax } = useMemo(() => bornes(ouverture), [ouverture]);
  // Par défaut : ce soir 19h s'il reste du temps, sinon demain 19h
  const encoreCeSoir = ouverture.getHours() * 60 + ouverture.getMinutes() < 18 * 60 + 30;

  // Première création : rien n'est pré-rempli, 3 choix seulement (sport, quand, où). Ensuite tout l'est.
  // `undefined` le temps de relire le téléphone.
  const [modele, setModele] = useState<Modele | null | undefined>(undefined);
  const premiereFois = modele === null;
  const [plusDOptions, setPlusDOptions] = useState(false);
  const [sport, setSport] = useState<Sport | null>(null);
  const [raccourci, setRaccourci] = useState<Raccourci | null>(null);
  // « Autre » : après-demain 19h pour commencer, puis le sélecteur du système
  const [dateAutre, setDateAutre] = useState(() => dateDe(2, 19 * 60));
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
        if (!lu) return;
        setSport(lu.sport);
        setJoueurs(lu.joueurs);
        setDuree(lu.duree);
        setDebutants(lu.debutants);
        setRaccourci(encoreCeSoir ? 'soir' : 'demain');
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

  const fiche = ficheSport(sport ?? 'foot');
  const nomLieu = precision.trim() || lieu.nom;
  /** Le début de la session, d'après le raccourci ou la date choisie dans « Autre » */
  function debutChoisi() {
    if (raccourci === 'maintenant') return new Date();
    if (raccourci === 'soir') return dateDe(0, 19 * 60);
    if (raccourci === 'demain') return dateDe(1, 19 * 60);
    return dateAutre;
  }
  const maintenant = raccourci === 'maintenant';
  const texteQuand = maintenant ? 'maintenant' : quand(debutChoisi(), ouverture).toLowerCase();
  const texteDuree = DUREES.find((d) => d.minutes === duree)?.titre ?? '1h30';
  // Ce qu'il reste à choisir avant de pouvoir publier
  const manque = [!sport && 'un sport', !raccourci && 'un moment', !lieu.choisi && 'un lieu'].filter(Boolean) as string[];
  const recap =
    sport && raccourci
      ? `${fiche.nom} · ${texteQuand} · ${texteDuree} · ${joueurs} joueurs`
      : `Choisis ${manque.join(', ').replace(/, ([^,]*)$/, ' et $1')}`;
  const raccourcis: { cle: Raccourci; titre: string }[] = [
    { cle: 'maintenant', titre: 'Maintenant' },
    ...(encoreCeSoir ? [{ cle: 'soir' as const, titre: 'Ce soir 19h' }] : []),
    { cle: 'demain', titre: 'Demain 19h' },
    { cle: 'autre', titre: 'Autre' },
  ];

  async function envoyer() {
    if (envoi || !sport) return;
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
    setLieu((avant) => ({ ...avant, choisi: false }));
    setLieuDemande(false);
    router.push({ pathname: '/session/[id]', params: { id } });
  }

  function publier() {
    // Sport ou moment pas encore choisi : la phrase du bas dit ce qui manque
    if (!sport || !raccourci) {
      vibrer.avertissement();
      return;
    }
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
          paddingBottom: Math.max(bottom, BarreNavigation.margeBas) + BarreNavigation.hauteur + HAUTEUR_PIED + 24,
          gap: 20,
        }}>
        <View style={styles.marges}>
          <Text maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.titre}>
            Créer une session
          </Text>
          {/* La phrase se réécrit toute seule pendant qu'on fait glisser les choix */}
          <Text maxFontSizeMultiplier={1.3} style={styles.phrase}>{premiereFois ? 'Quatre choix et c’est publié.' : recap}</Text>
        </View>

        {modele && (
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

        <View style={styles.section}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.dansMarges]}>Sport</Text>
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
                  <Text maxFontSizeMultiplier={1.3}
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
          <Text maxFontSizeMultiplier={1.3} style={[styles.etiquette, styles.dansMarges]}>Quand</Text>
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
                  <Text maxFontSizeMultiplier={1.3} style={[styles.puceTexte, actif && { color: c.surEncre }]}>{titre}</Text>
                </Pressable>
              );
            })}
          </View>
          {raccourci === 'autre' && (
            <View style={styles.dansMarges}>
              <ChoixDateHeure valeur={dateAutre} onChange={setDateAutre} min={dateMin} max={dateMax} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.ligne, styles.dansMarges]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>Joueurs</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.aide}>toi compris</Text>
          </View>
          <View style={styles.dansMarges}>
            <ChoixJoueurs valeur={joueurs} onChange={setJoueurs} />
          </View>
        </View>

        <View style={[styles.section, styles.dansMarges]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.etiquette}>Où</Text>
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
                  {lieu.choisi ? lieu.commune || 'Lieu choisi' : 'Place l’épingle là où vous jouez'}
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
        <Bouton titre={envoi ? 'Publication…' : 'Publier la session'} disabled={envoi} onPress={publier} />
      </View>
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

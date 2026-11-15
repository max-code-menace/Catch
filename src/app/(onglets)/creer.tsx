import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { IconeLieu, IconeRecentrer, IconeRelancer } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Roulette } from '@/components/roulette';
import { BarreNavigation, Couleurs, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { WAVRE, type Coordonnees } from '@/donnees/sessions';
import { SPORTS, ficheSport } from '@/donnees/sports';
import { useCompte } from '@/lib/compte';
import { heure, quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { useSessions } from '@/lib/sessions';

const MINUTE = 60_000;
const DUREE = 90;
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

type Lieu = { position: Coordonnees; nom: string; commune: string; estMaPosition: boolean };

const LIEU_PAR_DEFAUT: Lieu = {
  position: WAVRE,
  nom: 'Centre de Wavre',
  commune: 'Wavre',
  estMaPosition: false,
};

/** Retrouve le nom de l'endroit (rue ou lieu connu) et la commune d'une position. */
async function nommer(position: Coordonnees): Promise<Lieu> {
  try {
    const [adresse] = await Location.reverseGeocodeAsync(position);
    return {
      position,
      nom: adresse?.name ?? adresse?.street ?? 'Près de toi',
      commune: adresse?.city ?? adresse?.subregion ?? '',
      estMaPosition: true,
    };
  } catch {
    return { position, nom: 'Près de toi', commune: '', estMaPosition: true };
  }
}

export default function Creer() {
  const { top, bottom } = useSafeAreaInsets();
  const { compte } = useCompte();
  const { creer, derniereCreee, position, setPosition } = useSessions();

  const ouverture = useMemo(() => new Date(), []);
  const listeJours = useMemo(() => jours(ouverture), [ouverture]);
  // Par défaut : ce soir 19h s'il reste du temps, sinon demain 19h
  const encoreCeSoir = ouverture.getHours() * 60 + ouverture.getMinutes() < 18 * 60 + 30;

  const [sport, setSport] = useState<Sport>('foot');
  const [jour, setJour] = useState(encoreCeSoir ? 0 : 1);
  const [creneau, setCreneau] = useState<Creneau>(19 * 60);
  const [lieu, setLieu] = useState<Lieu>(LIEU_PAR_DEFAUT);
  const [precision, setPrecision] = useState('');
  const [joueurs, setJoueurs] = useState(ficheSport('foot').joueurs);
  const [debutants, setDebutants] = useState(true);
  const [enAttente, setEnAttente] = useState(false);

  const listeCreneaux = useMemo(() => creneaux(jour, ouverture), [jour, ouverture]);
  // L'heure choisie n'existe plus ce jour-là (déjà passée) : on prend la première proposée
  const indexCreneau = Math.max(0, listeCreneaux.indexOf(creneau));
  const creneauChoisi = listeCreneaux[indexCreneau];

  // Si la position est déjà connue (bouton « recentrer » de la carte), elle sert de lieu par défaut
  useEffect(() => {
    if (position && !lieu.estMaPosition) nommer(position).then(setLieu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  function choisirSport(cle: Sport) {
    setSport(cle);
    setJoueurs(ficheSport(cle).joueurs);
  }

  // La position n'est demandée que si on appuie sur « Ma position »
  async function utiliserMaPosition() {
    vibrer.selection();
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;
      const trouve =
        (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync());
      const point = { latitude: trouve.coords.latitude, longitude: trouve.coords.longitude };
      setPosition(point);
      setLieu(await nommer(point));
    } catch {
      // Position indisponible : on garde le lieu affiché
    }
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
      estMaPosition: true,
    });
  }

  const fiche = ficheSport(sport);
  const nomLieu = precision.trim() || lieu.nom;
  const debutPrevu = dateDe(jour, creneauChoisi);
  const texteQuand =
    creneauChoisi === 'maintenant' ? 'maintenant' : quand(debutPrevu, ouverture).toLowerCase();

  function envoyer(prenom: string) {
    const debut = dateDe(jour, creneauChoisi);
    const id = creer({
      sport,
      nomSport: fiche.nom,
      titre: fiche.nom,
      lieu: nomLieu,
      commune: lieu.commune,
      position: lieu.position,
      debut,
      fin: new Date(debut.getTime() + DUREE * MINUTE),
      joueurs,
      organisateur: prenom,
      debutantsBienvenus: debutants,
    });
    vibrer.succes();
    router.push({ pathname: '/session/[id]', params: { id } });
  }

  function publier() {
    if (compte?.prenom) {
      envoyer(compte.prenom);
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
      if (compte?.prenom) envoyer(compte.prenom);
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
            {fiche.nom} · {texteQuand} · {joueurs} joueurs
          </Text>
        </View>

        {derniereCreee && (
          <Pressable
            accessibilityRole="button"
            onPress={relancer}
            style={({ pressed }) => [styles.relancer, styles.dansMarges, pressed && { opacity: 0.7 }]}>
            <IconeRelancer couleur={Couleurs.rouge} taille={22} />
            <View style={styles.textes}>
              <Text style={[styles.fort, { color: Couleurs.rougeTexte }]}>Relancer ta dernière session</Text>
              <Text style={[styles.aide, { color: Couleurs.rougeTexte }]} numberOfLines={1}>
                {derniereCreee.titre} · {derniereCreee.lieu}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={[styles.etiquette, styles.dansMarges]}>Sport</Text>
          <Roulette
            elements={SPORTS}
            index={SPORTS.findIndex((s) => s.cle === sport)}
            onChange={(i) => choisirSport(SPORTS[i].cle)}
            largeur={92}
            hauteur={92}
            cle={(s) => s.cle}
            etiquette="Sport"
            valeur={fiche.nom}
            rendre={(s, actif) => (
              <View style={[styles.sport, !actif && styles.efface]}>
                <PictoSport sport={s.cle} taille={actif ? 44 : 36} />
                <Text numberOfLines={1} style={[styles.sportNom, actif && styles.sportNomActif]}>
                  {s.nom}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.etiquette, styles.dansMarges]}>Quand</Text>
          <Roulette
            elements={listeJours}
            index={jour}
            onChange={setJour}
            largeur={116}
            hauteur={44}
            cle={(j) => String(j.ecart)}
            etiquette="Jour"
            valeur={listeJours[jour].titre}
            styleCadre={styles.cadreSombre}
            rendre={(j, actif) => (
              <Text style={[styles.choix, actif ? styles.choixSombre : styles.efface]}>{j.titre}</Text>
            )}
          />
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
          <View style={styles.lieu}>
            <IconeLieu couleur={Couleurs.rouge} taille={22} />
            <View style={styles.textes}>
              <Text style={styles.fort} numberOfLines={1}>
                {lieu.nom}
              </Text>
              <Text style={styles.aide} numberOfLines={1}>
                {lieu.estMaPosition
                  ? ['Près de toi', lieu.commune].filter(Boolean).join(' · ')
                  : 'Lieu par défaut'}
              </Text>
            </View>
            {!lieu.estMaPosition && (
              <Pressable
                accessibilityRole="button"
                onPress={utiliserMaPosition}
                hitSlop={6}
                style={({ pressed }) => [styles.maPosition, pressed && { opacity: 0.7 }]}>
                <IconeRecentrer couleur={Couleurs.encre} taille={18} />
                <Text style={styles.maPositionTexte}>Ma position</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            value={precision}
            onChangeText={setPrecision}
            placeholder="Nom du lieu (facultatif) : terrain, salle, parc"
            placeholderTextColor={Couleurs.texteSecondaire}
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
            trackColor={{ true: Couleurs.rouge, false: Couleurs.trait }}
            thumbColor={Couleurs.carte}
          />
        </View>

        <View style={styles.dansMarges}>
          <Bouton titre="Publier la session" onPress={publier} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: Couleurs.fond },
  marges: { paddingHorizontal: Espaces.marge, gap: 4 },
  dansMarges: { marginHorizontal: Espaces.marge },
  titre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: Couleurs.encre },
  phrase: { fontFamily: Polices.texteMoyen, fontSize: 15, color: Couleurs.texteSecondaire },
  section: { gap: 10 },
  etiquette: { fontFamily: Polices.texteDemi, fontSize: 15, color: Couleurs.encre },
  textes: { flex: 1, gap: 2 },
  fort: { fontFamily: Polices.texteDemi, fontSize: 15, color: Couleurs.encre },
  aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: Couleurs.texteSecondaire },
  ligne: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minHeight: 24 },
  efface: { opacity: 0.45 },
  relancer: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Couleurs.rougeDoux,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E9A58F',
  },
  sport: { alignItems: 'center', gap: 4 },
  sportNom: { fontFamily: Polices.texteMoyen, fontSize: 13, color: Couleurs.encre },
  sportNomActif: { fontFamily: Polices.texteDemi, color: Couleurs.rougeTexte },
  cadreSombre: { backgroundColor: Couleurs.encre, borderColor: Couleurs.encre, borderRadius: 22 },
  choix: { fontFamily: Polices.texteMoyen, fontSize: 14, color: Couleurs.encre },
  choixSombre: { fontFamily: Polices.texteDemi, color: Couleurs.carte },
  heure: {
    fontFamily: Polices.titreDemi,
    fontSize: 20,
    color: Couleurs.encre,
    fontVariant: ['tabular-nums'],
  },
  heureActive: { fontFamily: Polices.titre, color: Couleurs.rougeTexte },
  nombre: {
    fontFamily: Polices.titreDemi,
    fontSize: 24,
    color: Couleurs.encre,
    fontVariant: ['tabular-nums'],
  },
  nombreActif: { fontFamily: Polices.titre, fontSize: 30, color: Couleurs.rougeTexte },
  lieu: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.bouton,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
  },
  maPosition: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Couleurs.fond,
    borderRadius: Rayons.pilule,
  },
  maPositionTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: Couleurs.encre },
  champ: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.bouton,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
    fontFamily: Polices.texte,
    fontSize: 15,
    color: Couleurs.encre,
  },
});

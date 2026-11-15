import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "@/components/bouton";
import {
  IconeCreer,
  IconeLieu,
  IconeMoins,
  IconeRecentrer,
  IconeRelancer,
} from "@/components/icones";
import { PictoSport } from "@/components/picto-sport";
import {
  BarreNavigation,
  Couleurs,
  Espaces,
  Polices,
  Rayons,
  Tailles,
} from "@/constants/theme";
import type { Sport } from "@/donnees/pictos";
import { WAVRE, type Coordonnees } from "@/donnees/sessions";
import { SPORTS, ficheSport } from "@/donnees/sports";
import { useCompte } from "@/lib/compte";
import { quand } from "@/lib/formats";
import { vibrer } from "@/lib/haptics";
import { useSessions } from "@/lib/sessions";

const MINUTE = 60_000;
const DUREE = 90;
const JOUEURS_MIN = 2;
const JOUEURS_MAX = 30;

type Moment = { cle: string; titre: string; debut: () => Date };

/** Les créneaux proposés : toujours valables au moment où on ouvre l'écran. */
function moments(maintenant: Date): Moment[] {
  const aHeure = (dansJours: number, heure: number) => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + dansJours);
    date.setHours(heure, 0, 0, 0);
    return date;
  };
  const liste: Moment[] = [
    { cle: "maintenant", titre: "Maintenant", debut: () => new Date() },
    {
      cle: "1h",
      titre: "Dans 1h",
      debut: () => new Date(Date.now() + 60 * MINUTE),
    },
  ];
  // « Ce soir » n'est proposé que s'il reste au moins une demi-heure avant 19h
  if (
    maintenant.getHours() < 18 ||
    (maintenant.getHours() === 18 && maintenant.getMinutes() < 30)
  ) {
    liste.push({
      cle: "soir",
      titre: quand(aHeure(0, 19), maintenant),
      debut: () => aHeure(0, 19),
    });
  }
  liste.push({
    cle: "demain",
    titre: quand(aHeure(1, 19), maintenant),
    debut: () => aHeure(1, 19),
  });
  return liste;
}

type Lieu = {
  position: Coordonnees;
  nom: string;
  commune: string;
  estMaPosition: boolean;
};

const LIEU_PAR_DEFAUT: Lieu = {
  position: WAVRE,
  nom: "Centre de Wavre",
  commune: "Wavre",
  estMaPosition: false,
};

/** Retrouve le nom de l'endroit (rue ou lieu connu) et la commune d'une position. */
async function nommer(position: Coordonnees): Promise<Lieu> {
  try {
    const [adresse] = await Location.reverseGeocodeAsync(position);
    return {
      position,
      nom: adresse?.name ?? adresse?.street ?? "Près de toi",
      commune: adresse?.city ?? adresse?.subregion ?? "",
      estMaPosition: true,
    };
  } catch {
    return { position, nom: "Près de toi", commune: "", estMaPosition: true };
  }
}

export default function Creer() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // 4 tuiles par ligne, 8 px entre elles
  const largeurTuile = Math.floor((width - 2 * Espaces.marge - 3 * 8) / 4);
  const { compte } = useCompte();
  const { creer, derniereCreee, position, setPosition } = useSessions();

  const creneaux = useMemo(() => moments(new Date()), []);
  const [sport, setSport] = useState<Sport>("foot");
  const [moment, setMoment] = useState(
    creneaux.some((m) => m.cle === "soir") ? "soir" : "demain",
  );
  const [lieu, setLieu] = useState<Lieu>(LIEU_PAR_DEFAUT);
  const [precision, setPrecision] = useState("");
  const [joueurs, setJoueurs] = useState(ficheSport("foot").joueurs);
  const [debutants, setDebutants] = useState(true);
  const [enAttente, setEnAttente] = useState(false);

  // Si la position est déjà connue (bouton « recentrer » de la carte), elle sert de lieu par défaut
  useEffect(() => {
    if (position && !lieu.estMaPosition) nommer(position).then(setLieu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  function choisirSport(cle: Sport) {
    if (cle === sport) return;
    vibrer.selection();
    setSport(cle);
    setJoueurs(ficheSport(cle).joueurs);
  }

  function changerJoueurs(ecart: number) {
    const suivant = joueurs + ecart;
    if (suivant < JOUEURS_MIN || suivant > JOUEURS_MAX) {
      vibrer.avertissement();
      return;
    }
    vibrer.selection();
    setJoueurs(suivant);
  }

  // La position n'est demandée que si on appuie sur « Utiliser ma position »
  async function utiliserMaPosition() {
    vibrer.selection();
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;
      const trouve =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync());
      const point = {
        latitude: trouve.coords.latitude,
        longitude: trouve.coords.longitude,
      };
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
    setPrecision("");
    setLieu({
      position: derniereCreee.position,
      nom: derniereCreee.lieu,
      commune: derniereCreee.commune,
      estMaPosition: true,
    });
  }

  const fiche = ficheSport(sport);
  const creneau = creneaux.find((m) => m.cle === moment) ?? creneaux[0];
  const nomLieu = precision.trim() || lieu.nom;

  function envoyer(prenom: string) {
    const debut = creneau.debut();
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
    router.push({ pathname: "/session/[id]", params: { id } });
  }

  function publier() {
    if (compte?.prenom) {
      envoyer(compte.prenom);
      return;
    }
    // Pas encore connecté : on passe par la connexion, la session est publiée au retour
    setEnAttente(true);
    router.push({ pathname: "/connexion", params: { pour: "publier" } });
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
          paddingHorizontal: Espaces.marge,
          paddingBottom:
            Math.max(bottom, BarreNavigation.margeBas) +
            BarreNavigation.hauteur +
            24,
          gap: 22,
        }}
      >
        <Text accessibilityRole="header" style={styles.titre}>
          Créer une session
        </Text>

        {derniereCreee && (
          <Pressable
            accessibilityRole="button"
            onPress={relancer}
            style={({ pressed }) => [
              styles.relancer,
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconeRelancer couleur={Couleurs.rouge} taille={22} />
            <View style={styles.textes}>
              <Text style={[styles.fort, { color: Couleurs.rougeTexte }]}>
                Relancer ta dernière session
              </Text>
              <Text
                style={[styles.aide, { color: Couleurs.rougeTexte }]}
                numberOfLines={1}
              >
                {derniereCreee.titre} · {derniereCreee.lieu}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.etiquette}>Sport</Text>
          <View style={styles.tuiles}>
            {SPORTS.map(({ cle, nom }) => {
              const actif = cle === sport;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => choisirSport(cle)}
                  style={[
                    styles.tuile,
                    { width: largeurTuile },
                    actif && styles.tuileActive,
                  ]}
                >
                  <PictoSport sport={cle} taille={34} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tuileTexte,
                      actif && {
                        color: Couleurs.rougeTexte,
                        fontFamily: Polices.texteDemi,
                      },
                    ]}
                  >
                    {nom}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.etiquette}>Quand</Text>
          <View style={styles.puces}>
            {creneaux.map(({ cle, titre }) => {
              const actif = cle === moment;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => {
                    if (!actif) vibrer.selection();
                    setMoment(cle);
                  }}
                  style={[styles.puce, actif && styles.puceActive]}
                >
                  <Text
                    style={[
                      styles.puceTexte,
                      actif && { color: Couleurs.carte },
                    ]}
                  >
                    {titre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.etiquette}>Où</Text>
          <View style={styles.lieu}>
            <IconeLieu couleur={Couleurs.rouge} taille={22} />
            <View style={styles.textes}>
              <Text style={styles.fort} numberOfLines={1}>
                {lieu.nom}
              </Text>
              <Text style={styles.aide} numberOfLines={1}>
                {lieu.estMaPosition
                  ? ["Près de toi", lieu.commune].filter(Boolean).join(" · ")
                  : "Lieu par défaut"}
              </Text>
            </View>
          </View>
          {!lieu.estMaPosition && (
            <Bouton
              titre="Utiliser ma position"
              variante="secondaire"
              Icone={IconeRecentrer}
              onPress={utiliserMaPosition}
            />
          )}
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

        <View style={styles.ligne}>
          <View style={styles.textes}>
            <Text style={styles.etiquette}>Joueurs</Text>
            <Text style={styles.aide}>Toi compris</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Un joueur de moins"
            onPress={() => changerJoueurs(-1)}
            style={({ pressed }) => [
              styles.rond,
              pressed && { backgroundColor: Couleurs.beige },
            ]}
          >
            <IconeMoins couleur={Couleurs.encre} taille={20} />
          </Pressable>
          <Text style={styles.nombre} accessibilityLabel={`${joueurs} joueurs`}>
            {joueurs}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Un joueur de plus"
            onPress={() => changerJoueurs(1)}
            style={({ pressed }) => [
              styles.rond,
              pressed && { backgroundColor: Couleurs.beige },
            ]}
          >
            <IconeCreer couleur={Couleurs.encre} taille={20} />
          </Pressable>
        </View>

        <View style={styles.ligne}>
          <Text style={[styles.etiquette, styles.textes]}>
            Débutants bienvenus
          </Text>
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

        <View style={styles.fin}>
          <Text style={styles.resume}>
            {fiche.nom} · {creneau.titre.toLowerCase()} · {nomLieu} · {joueurs}{" "}
            joueurs
          </Text>
          <Bouton titre="Publier la session" onPress={publier} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: Couleurs.fond },
  titre: {
    fontFamily: Polices.titre,
    fontSize: Tailles.titreEcran,
    color: Couleurs.encre,
  },
  section: { gap: 10 },
  etiquette: {
    fontFamily: Polices.texteDemi,
    fontSize: 15,
    color: Couleurs.encre,
  },
  textes: { flex: 1, gap: 2 },
  fort: { fontFamily: Polices.texteDemi, fontSize: 15, color: Couleurs.encre },
  aide: {
    fontFamily: Polices.texte,
    fontSize: Tailles.aide,
    color: Couleurs.texteSecondaire,
  },
  relancer: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Couleurs.rougeDoux,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E9A58F",
  },
  tuiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tuile: {
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.bouton,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
  },
  tuileActive: {
    backgroundColor: Couleurs.rougeDoux,
    borderColor: Couleurs.rouge,
  },
  tuileTexte: {
    fontFamily: Polices.texteMoyen,
    fontSize: 13,
    color: Couleurs.encre,
  },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  puce: {
    height: Espaces.cibleTactile,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.pilule,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
  },
  puceActive: { backgroundColor: Couleurs.encre, borderColor: Couleurs.encre },
  puceTexte: {
    fontFamily: Polices.texteMoyen,
    fontSize: 14,
    color: Couleurs.encre,
  },
  lieu: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.bouton,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
  },
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
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: Espaces.cibleTactile,
  },
  rond: {
    width: Espaces.cibleTactile,
    height: Espaces.cibleTactile,
    borderRadius: Espaces.cibleTactile / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Couleurs.carte,
    borderWidth: 1.5,
    borderColor: Couleurs.trait,
  },
  nombre: {
    minWidth: 30,
    textAlign: "center",
    fontFamily: Polices.titre,
    fontSize: 24,
    color: Couleurs.encre,
    fontVariant: ["tabular-nums"],
  },
  fin: { gap: 8 },
  resume: {
    textAlign: "center",
    fontFamily: Polices.texteMoyen,
    fontSize: Tailles.aide,
    color: Couleurs.texteSecondaire,
  },
});

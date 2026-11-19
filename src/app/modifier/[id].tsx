import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { ChoixLieu } from '@/components/choix-lieu';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Roulette } from '@/components/roulette';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { heure, quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import type { Lieu } from '@/lib/lieux';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
/** Heures proposées, de demi-heure en demi-heure, en minutes depuis minuit */
const HEURES = Array.from({ length: 36 }, (_, i) => 6 * 60 + i * 30);

function minuit(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function texteHeure(minutes: number) {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return heure(date);
}

/**
 * L'organisateur change l'horaire, le lieu ou le nombre de joueurs de sa session.
 * Les inscrits sont prévenus si l'heure ou le lieu change.
 */
export default function ModifierSession() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, estOrganisee, modifier } = useSessions();
  const session = sessions.find((s) => s.id === id);

  const [ouvertLe] = useState(() => new Date());
  const aujourdhui = minuit(ouvertLe);
  // Tant qu'on ne touche ni au jour ni à l'heure, l'horaire d'origine est gardé à la minute près
  const [jour, setJour] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [joueurs, setJoueurs] = useState<number | null>(null);
  const [lieu, setLieu] = useState<Lieu | null>(null);
  const [carteOuverte, setCarteOuverte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!session || !estOrganisee(session.id)) {
    return (
      <EcranSecondaire titre="Modifier">
        <Text style={styles.texte}>Cette session n’est plus disponible, ou ce n’est pas la tienne.</Text>
        <Bouton titre="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </EcranSecondaire>
    );
  }

  const inscrits = session.inscrits.length;
  const nombres = Array.from({ length: 31 - Math.max(2, inscrits) }, (_, i) => i + Math.max(2, inscrits));
  const joueursChoisis = joueurs ?? Math.min(30, Math.max(session.joueurs, inscrits));

  // Le jour et l'heure d'origine, ramenés aux choix proposés
  const jourOrigine = Math.max(
    0,
    Math.round((minuit(session.debut).getTime() - aujourdhui.getTime()) / 86_400_000),
  );
  const minutesOrigine = session.debut.getHours() * 60 + session.debut.getMinutes();
  const jourChoisi = jour ?? jourOrigine;
  const minutesChoisies = minutes ?? minutesOrigine;
  const indexHeure = HEURES.reduce(
    (proche, h, i) => (Math.abs(h - minutesChoisies) < Math.abs(HEURES[proche] - minutesChoisies) ? i : proche),
    0,
  );
  const listeJours = Array.from({ length: Math.max(7, jourOrigine + 1) }, (_, i) => {
    const date = new Date(aujourdhui);
    date.setDate(date.getDate() + i);
    return i === 0 ? 'Aujourd’hui' : i === 1 ? 'Demain' : `${JOURS[date.getDay()]} ${date.getDate()}`;
  });

  const horaireChange = jour !== null || minutes !== null;
  function debutChoisi() {
    if (!horaireChange) return session!.debut;
    const date = new Date(aujourdhui);
    date.setDate(date.getDate() + jourChoisi);
    date.setHours(Math.floor(minutesChoisies / 60), minutesChoisies % 60, 0, 0);
    return date;
  }
  const debut = debutChoisi();
  const duree = session.fin.getTime() - session.debut.getTime();
  const fin = new Date(debut.getTime() + duree);
  const dansLePasse = horaireChange && fin.getTime() <= ouvertLe.getTime();
  const change = horaireChange || lieu !== null || joueursChoisis !== session.joueurs;
  const autres = inscrits - 1;

  async function enregistrer() {
    if (envoi || !change || dansLePasse) return;
    setEnvoi(true);
    setErreur(null);
    const resultat = await modifier(session!.id, {
      debut,
      fin,
      lieu: lieu?.nom ?? session!.lieu,
      commune: lieu?.commune ?? session!.commune,
      position: lieu?.position ?? session!.position,
      joueurs: joueursChoisis,
    });
    setEnvoi(false);
    if (resultat === 'ok') {
      vibrer.succes();
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/session/[id]', params: { id: session!.id } });
      return;
    }
    vibrer.erreur();
    setErreur(
      resultat === 'trop_petit'
        ? 'Il y a déjà plus d’inscrits que ce nombre de joueurs.'
        : 'Ça n’a pas marché. Vérifie ta connexion et réessaie.',
    );
  }

  return (
    <EcranSecondaire titre="Modifier">
      <Text style={styles.texte}>
        {session.titre} · {quand(debut).toLowerCase()}
        {autres > 0
          ? ` · ${autres === 1 ? 'la personne inscrite sera prévenue' : `les ${autres} inscrits seront prévenus`} si l’heure ou le lieu change`
          : ''}
      </Text>

      <View style={styles.section}>
        <Text style={styles.etiquette}>Quand</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jours}>
          {listeJours.map((titre, i) => {
            const actif = i === jourChoisi;
            return (
              <Pressable
                key={titre}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                onPress={() => {
                  if (!actif) vibrer.selection();
                  setJour(i);
                  // Changer de jour fige aussi l'heure sur un cran proposé
                  setMinutes(HEURES[indexHeure]);
                }}
                style={[styles.jour, actif && styles.jourActif]}>
                <Text style={[styles.jourTexte, actif && { color: c.rougeTexte }]}>{titre}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Roulette
          elements={HEURES}
          index={indexHeure}
          onChange={(i) => {
            setMinutes(HEURES[i]);
            setJour(jourChoisi);
          }}
          largeur={84}
          hauteur={56}
          cle={String}
          etiquette="Heure"
          valeur={texteHeure(HEURES[indexHeure])}
          rendre={(h, actif) => (
            <Text style={[styles.heure, actif ? styles.heureActive : styles.efface]}>{texteHeure(h)}</Text>
          )}
        />
        {dansLePasse && <Text style={styles.erreur}>Cet horaire est déjà passé.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.etiquette}>Joueurs</Text>
        <Roulette
          elements={nombres}
          index={Math.max(0, nombres.indexOf(joueursChoisis))}
          onChange={(i) => setJoueurs(nombres[i])}
          largeur={64}
          hauteur={64}
          cle={String}
          etiquette="Nombre de joueurs"
          valeur={`${joueursChoisis} joueurs`}
          rendre={(n, actif) => (
            <Text style={[styles.heure, actif ? styles.nombreActif : styles.efface]}>{n}</Text>
          )}
        />
        {inscrits > 2 && <Text style={styles.aide}>Au moins {inscrits} : c’est le nombre d’inscrits.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.etiquette}>Où</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lieu : ${lieu?.nom ?? session.lieu}. Changer`}
          onPress={() => setCarteOuverte(true)}
          style={({ pressed }) => [styles.lieu, pressed && { backgroundColor: c.beige }]}>
          <View style={styles.textes}>
            <Text style={styles.fort} numberOfLines={1}>
              {lieu?.nom ?? session.lieu}
            </Text>
            <Text style={styles.aide} numberOfLines={1}>
              {(lieu?.commune ?? session.commune) || 'Lieu choisi sur la carte'}
            </Text>
          </View>
          <Text style={styles.changer}>Changer</Text>
        </Pressable>
      </View>

      {erreur && (
        <Text accessibilityLiveRegion="polite" style={styles.erreur}>
          {erreur}
        </Text>
      )}
      <Bouton
        titre={envoi ? 'Enregistrement…' : 'Enregistrer'}
        disabled={!change || dansLePasse || envoi}
        style={(!change || dansLePasse || envoi) && styles.inactif}
        onPress={enregistrer}
      />

      {carteOuverte && (
        <ChoixLieu
          ouvert
          depart={
            lieu ?? { position: session.position, nom: session.lieu, commune: session.commune, choisi: true }
          }
          onFermer={() => setCarteOuverte(false)}
          onChoisir={(choisi) => {
            setLieu(choisi);
            setCarteOuverte(false);
          }}
        />
      )}
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    texte: { fontFamily: Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
    section: { gap: 10 },
    etiquette: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    fort: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    textes: { flex: 1, gap: 2 },
    efface: { opacity: 0.45 },
    jours: { gap: 8 },
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
    jourTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
    heure: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre, fontVariant: ['tabular-nums'] },
    heureActive: { fontFamily: Polices.titre, color: c.rougeTexte },
    nombreActif: { fontFamily: Polices.titre, fontSize: Tailles.titreSession, color: c.rougeTexte },
    lieu: {
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    changer: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    erreur: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, lineHeight: 20, color: c.rougeTexte },
    inactif: { opacity: 0.45 },
  });

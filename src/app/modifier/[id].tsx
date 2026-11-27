import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { ChoixDateHeure } from '@/components/choix-date-heure';
import { ChoixJoueurs } from '@/components/choix-joueurs';
import { ChoixLieu } from '@/components/choix-lieu';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { quand } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import type { Lieu } from '@/lib/lieux';
import { useLieuxSport } from '@/lib/lieux-sport';
import { ficheSport } from '@/donnees/sports';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Jusqu'où on peut déplacer une session : 7 jours, comme ce que montre la carte */
function bornes(maintenant: Date, origine: Date) {
  const min = new Date(maintenant);
  min.setSeconds(0, 0);
  min.setMinutes(Math.ceil((min.getMinutes() + 1) / 15) * 15);
  const max = new Date(maintenant);
  max.setDate(max.getDate() + 7);
  max.setHours(0, 0, 0, 0);
  return { min, max: origine > max ? origine : max };
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
  const tousLesLieux = useLieuxSport();

  const [ouvertLe] = useState(() => new Date());
  // Tant qu'on ne touche pas à l'horaire, celui d'origine est gardé à la minute près
  const [debutModifie, setDebutModifie] = useState<Date | null>(null);
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
  const joueursChoisis = joueurs ?? Math.min(30, Math.max(session.joueurs, inscrits));

  const horaireChange = debutModifie !== null;
  const { min: dateMin, max: dateMax } = bornes(ouvertLe, session.debut);
  const debut = debutModifie ?? session.debut;
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
        : 'Pas de réseau. Réessaie.',
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
        <ChoixDateHeure
          valeur={debut}
          onChange={(date) => {
            vibrer.selection();
            setDebutModifie(date);
          }}
          min={dateMin}
          max={dateMax}
        />
        {dansLePasse && <Text style={styles.erreur}>Cet horaire est déjà passé.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.etiquette}>Joueurs</Text>
        <ChoixJoueurs valeur={joueursChoisis} onChange={setJoueurs} min={Math.max(2, inscrits)} />
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
          lieux={
            ficheSport(session.sport).ou === 'lieu'
              ? tousLesLieux.filter((l) => l.sports.includes(session.sport))
              : []
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

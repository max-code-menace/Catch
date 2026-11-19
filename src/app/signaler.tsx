import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { vibrer } from '@/lib/haptics';
import { bloquer, MOTIFS, signaler, type Cible, type Motif } from '@/lib/moderation';
import { useSessions } from '@/lib/sessions';
import { useMessages } from '@/lib/messages';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const TITRES: Record<Cible, string> = {
  session: 'Signaler cette session',
  joueur: 'Signaler cette personne',
  message: 'Signaler ce message',
};

/**
 * Signalement d'une session, d'une personne ou d'un message.
 * Paramètres : `cible`, `id` (ce qu'on signale), `nom` (ce qu'on affiche), et si une personne
 * est derrière, `auteur` (son identifiant) et `prenom` pour proposer de la bloquer.
 */
export default function Signaler() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { cible, id, nom, auteur, prenom } = useLocalSearchParams<{
    cible: Cible;
    id: string;
    nom?: string;
    auteur?: string;
    prenom?: string;
  }>();
  const { compte } = useCompte();
  const { recharger: rechargerSessions } = useSessions();
  const { recharger: rechargerMessages } = useMessages();
  const [motif, setMotif] = useState<Motif | null>(null);
  const [details, setDetails] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [bloque, setBloque] = useState(false);

  const peutBloquer = !!auteur && auteur !== compte?.id;
  const quiBloquer = prenom || 'cette personne';

  if (!compte) {
    return (
      <EcranSecondaire titre="Signaler" modale>
        <Text style={styles.texte}>Connecte-toi pour envoyer un signalement.</Text>
        <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
      </EcranSecondaire>
    );
  }

  async function envoyer() {
    if (!motif || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const echec = await signaler(cible, id, motif, details);
    setEnvoi(false);
    if (echec) {
      setErreur(echec);
      vibrer.erreur();
      return;
    }
    vibrer.succes();
    setFait(true);
  }

  async function bloquerAussi() {
    if (!auteur || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const echec = await bloquer(auteur);
    setEnvoi(false);
    if (echec) {
      setErreur(echec);
      vibrer.erreur();
      return;
    }
    // Ses sessions et ses messages disparaissent tout de suite
    rechargerSessions();
    rechargerMessages();
    setBloque(true);
  }

  if (fait) {
    return (
      <EcranSecondaire titre="Merci" modale>
        <Text style={styles.texte}>
          C’est transmis à l’équipe de Catch. On regarde ça dès que possible. Si tu es en danger, appelle le 112.
        </Text>
        {peutBloquer && !bloque && (
          <View style={styles.carte}>
            <Text style={styles.libelle}>Bloquer {quiBloquer} ?</Text>
            <Text style={styles.aide}>
              Tu ne verras plus ses sessions ni ses messages. Tu peux débloquer depuis Profil.
            </Text>
            <Bouton titre={`Bloquer ${quiBloquer}`} variante="secondaire" onPress={bloquerAussi} disabled={envoi} />
          </View>
        )}
        {bloque && <Text style={styles.libelle}>{prenom ? `Tu ne verras plus ${prenom}.` : 'C’est fait.'}</Text>}
        {erreur && (
          <Text accessibilityLiveRegion="polite" style={styles.erreur}>
            {erreur}
          </Text>
        )}
        <Bouton
          titre="Fermer"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </EcranSecondaire>
    );
  }

  return (
    <EcranSecondaire titre={TITRES[cible] ?? 'Signaler'} modale>
      {nom ? <Text style={styles.texte}>{nom}</Text> : null}
      <Text style={styles.libelle}>Qu’est-ce qui ne va pas ?</Text>
      <View accessibilityRole="radiogroup" style={styles.motifs}>
        {MOTIFS.map((m) => {
          const actif = motif === m.valeur;
          return (
            <Pressable
              key={m.valeur}
              accessibilityRole="radio"
              accessibilityState={{ checked: actif }}
              onPress={() => {
                vibrer.selection();
                setMotif(m.valeur);
              }}
              style={[styles.motif, actif && styles.motifActif]}>
              <Text style={styles.libelle}>{m.titre}</Text>
              <Text style={styles.aide}>{m.detail}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="Un détail à ajouter ? (facultatif)"
        placeholderTextColor={c.texteSecondaire}
        multiline
        maxLength={500}
        style={styles.champ}
      />
      {erreur && (
        <Text accessibilityLiveRegion="polite" style={styles.erreur}>
          {erreur}
        </Text>
      )}
      <Bouton
        titre={envoi ? 'Envoi…' : 'Envoyer le signalement'}
        onPress={envoyer}
        disabled={!motif || envoi}
        style={(!motif || envoi) && styles.inactif}
      />
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    texte: { fontFamily: Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, lineHeight: 18, color: c.texteSecondaire },
    erreur: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.encre },
    carte: {
      padding: 16,
      gap: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    motifs: { gap: 8 },
    motif: {
      minHeight: Espaces.cibleTactile,
      padding: 14,
      gap: 2,
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    motifActif: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    champ: {
      minHeight: 96,
      padding: 14,
      textAlignVertical: 'top',
      borderRadius: Rayons.carte,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      fontFamily: Polices.texte,
      fontSize: Tailles.courant,
      color: c.encre,
    },
    inactif: { opacity: 0.4 },
  });

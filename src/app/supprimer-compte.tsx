import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Bouton } from '@/components/bouton';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Polices, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { vibrer } from '@/lib/haptics';
import { demander } from '@/lib/moderation';
import { useStyles, type Palette } from '@/lib/theme';

/**
 * Suppression du compte. Aussi disponible sans l'app, à l'adresse /supprimer-compte du site
 * (exigé par Google Play) : on se connecte puis on supprime.
 */
export default function SupprimerCompte() {
  const styles = useStyles(creerStyles);
  const { compte, pret, supprimerCompte } = useCompte();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  function confirmer() {
    demander({
      titre: 'Supprimer ton compte ?',
      texte: 'Tes sessions à venir seront annulées et tes messages effacés. C’est définitif.',
      confirmer: 'Supprimer mon compte',
      destructif: true,
      onConfirmer: async () => {
        setEnCours(true);
        setErreur(null);
        const echec = await supprimerCompte();
        setEnCours(false);
        if (echec) {
          setErreur(echec);
          vibrer.erreur();
          return;
        }
        vibrer.succes();
        setFait(true);
      },
    });
  }

  if (fait) {
    return (
      <EcranSecondaire titre="Compte supprimé">
        <Text style={styles.texte}>Ton compte et tes données ont été supprimés. À une prochaine fois sur le terrain.</Text>
        <Bouton titre="Voir les sessions" onPress={() => router.replace('/')} />
      </EcranSecondaire>
    );
  }

  return (
    <EcranSecondaire titre="Supprimer mon compte">
      <Text style={styles.texte}>
        Ton compte, ton prénom, tes participations, tes messages et tes réglages seront effacés. Les sessions que tu
        organises et qui ne sont pas encore passées seront annulées. Tu ne pourras pas revenir en arrière.
      </Text>
      {!pret ? null : !compte ? (
        <>
          <Text style={styles.texte}>Connecte-toi d’abord pour confirmer que ce compte est bien le tien.</Text>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </>
      ) : (
        <>
          {erreur && (
            <Text accessibilityLiveRegion="polite" style={styles.libelle}>
              {erreur}
            </Text>
          )}
          <Bouton
            titre={enCours ? 'Suppression…' : 'Supprimer mon compte'}
            onPress={confirmer}
            disabled={enCours}
          />
        </>
      )}
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    texte: { ...Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
    libelle: { ...Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
  });

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { vibrer } from '@/lib/haptics';
import { useMessages } from '@/lib/messages';
import { debloquer, lireBloques, type Bloque } from '@/lib/moderation';
import { useSessions } from '@/lib/sessions';
import { useStyles, type Palette } from '@/lib/theme';

/** Les personnes bloquées, avec le moyen de les débloquer. Ouvert depuis Profil. */
export default function PersonnesBloquees() {
  const styles = useStyles(creerStyles);
  const { compte } = useCompte();
  const { recharger: rechargerSessions } = useSessions();
  const { recharger: rechargerMessages } = useMessages();
  const [bloques, setBloques] = useState<Bloque[] | null>(null);
  const [echec, setEchec] = useState(false);
  const idCompte = compte?.id;

  useFocusEffect(
    useCallback(() => {
      if (!idCompte) return;
      let actif = true;
      lireBloques().then((lus) => {
        if (!actif) return;
        setBloques(lus);
        setEchec(!lus);
      });
      return () => {
        actif = false;
      };
    }, [idCompte]),
  );

  async function liberer(personne: Bloque) {
    setEchec(false);
    const erreur = await debloquer(personne.id);
    if (erreur) {
      setEchec(true);
      vibrer.erreur();
      return;
    }
    vibrer.selection();
    setBloques((avant) => (avant ?? []).filter((b) => b.id !== personne.id));
    // Ses sessions et ses messages réapparaissent
    rechargerSessions();
    rechargerMessages();
  }

  return (
    <EcranSecondaire titre="Personnes bloquées">
      {!compte ? (
        <>
          <Text style={styles.texte}>Connecte-toi pour voir les personnes que tu as bloquées.</Text>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </>
      ) : (
        <>
          <Text style={styles.texte}>
            Tu ne vois plus leurs sessions ni leurs messages, et elles ne peuvent pas rejoindre tes sessions.
          </Text>
          {echec && (
            <Text accessibilityLiveRegion="polite" style={styles.libelle}>
              Ça n’a pas marché. Vérifie ta connexion et réessaie.
            </Text>
          )}
          {bloques?.length === 0 && <Text style={styles.texte}>Tu n’as bloqué personne.</Text>}
          {bloques?.map((personne) => (
            <View key={personne.id} style={styles.ligne}>
              <Text style={[styles.libelle, styles.prenom]} numberOfLines={1}>
                {personne.prenom}
              </Text>
              <Bouton titre="Débloquer" variante="secondaire" onPress={() => liberer(personne)} />
            </View>
          ))}
        </>
      )}
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    texte: { fontFamily: Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    prenom: { flex: 1 },
    ligne: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
  });

import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { useOptionsEntete } from '@/components/ecran-secondaire';
import { PictoSport } from '@/components/picto-sport';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { NOM_ZONE } from '@/donnees/sessions';
import { SPORTS } from '@/donnees/sports';
import { useCompte } from '@/lib/compte';
import { vibrer } from '@/lib/haptics';
import {
  activerNotifications,
  enregistrerReglages,
  lireReglages,
  permissionNotifications,
  type Permission,
  type Reglages,
} from '@/lib/notifications';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Une ligne avec un interrupteur : titre, précision, et le réglage à droite. */
function Ligne({
  titre,
  detail,
  valeur,
  onChange,
}: {
  titre: string;
  detail: string;
  valeur: boolean;
  onChange: (valeur: boolean) => void;
}) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.ligne}>
      <View style={styles.textes}>
        <Text style={styles.libelle}>{titre}</Text>
        <Text style={styles.aide}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={titre}
        value={valeur}
        onValueChange={(suivante) => {
          vibrer.selection();
          onChange(suivante);
        }}
        trackColor={{ true: c.rouge, false: c.trait }}
        thumbColor={c.rondPicto}
      />
    </View>
  );
}

/** Réglages des notifications, type par type. Ouvert depuis Profil. */
export default function ReglagesNotifications() {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const optionsEntete = useOptionsEntete('Notifications');
  const { compte } = useCompte();
  const { origine, position } = useSessions();
  const idCompte = compte?.id;
  const [permission, setPermission] = useState<Permission | null>(null);
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [echec, setEchec] = useState(false);

  // Relu à chaque retour sur l'écran : la permission a pu changer dans les réglages du téléphone
  useFocusEffect(
    useCallback(() => {
      let actif = true;
      permissionNotifications().then((p) => actif && setPermission(p));
      if (idCompte) {
        lireReglages().then((lus) => {
          if (!actif) return;
          setReglages(lus);
          setEchec(!lus);
        });
      }
      return () => {
        actif = false;
      };
    }, [idCompte]),
  );

  // Le réglage change tout de suite à l'écran, et revient en arrière si l'enregistrement échoue
  async function changer(suivants: Reglages) {
    if (!idCompte || !reglages) return;
    const avant = reglages;
    setReglages(suivants);
    setEchec(false);
    if (!(await enregistrerReglages(idCompte, suivants, origine))) {
      setReglages(avant);
      setEchec(true);
      vibrer.erreur();
    }
  }

  function basculerSport(sport: Sport) {
    if (!reglages) return;
    vibrer.selection();
    const sports = reglages.sports.includes(sport)
      ? reglages.sports.filter((s) => s !== sport)
      : [...reglages.sports, sport];
    changer({ ...reglages, sports });
  }

  return (
    <>
      <Stack.Screen options={optionsEntete} />
      <ScrollView
        style={styles.ecran}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.contenu, { paddingBottom: bottom + 24 }]}>
        {!compte ? (
          <>
            <Text style={styles.texte}>Connecte-toi pour régler tes notifications.</Text>
            <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
          </>
        ) : (
          <>
            {permission === 'a-demander' && (
              <View style={styles.carte}>
                <Text style={styles.libelle}>Les notifications ne sont pas encore activées</Text>
                <Text style={styles.aide}>Peu nombreuses, et tu choisis lesquelles juste en dessous.</Text>
                <Bouton
                  titre="Activer les notifications"
                  onPress={async () => setPermission(await activerNotifications(true))}
                />
              </View>
            )}
            {permission === 'refusee' && (
              <View style={styles.carte}>
                <Text style={styles.libelle}>Notifications coupées</Text>
                <Text style={styles.aide}>
                  Elles sont désactivées pour Catch dans les réglages de ton téléphone.
                </Text>
                <Bouton
                  titre="Ouvrir les réglages"
                  variante="secondaire"
                  onPress={() => Linking.openSettings().catch(() => {})}
                />
              </View>
            )}
            {permission === 'indisponible' && (
              <View style={styles.carte}>
                <Text style={styles.libelle}>Notifications indisponibles ici</Text>
                <Text style={styles.aide}>Cet appareil ne peut pas en recevoir pour l’instant.</Text>
              </View>
            )}

            {reglages && (
              <View style={styles.carte}>
                <Ligne
                  titre="Rappel 3h avant"
                  detail="Tu réponds « Je viens » ou « Je ne peux plus » en un appui."
                  valeur={reglages.rappel}
                  onChange={(rappel) => changer({ ...reglages, rappel })}
                />
                <View style={styles.trait} />
                <Ligne
                  titre="Nouveaux messages"
                  detail="Quand quelqu’un écrit dans une de tes sessions. Une seule fois tant que tu n’as pas lu, pas de rafale."
                  valeur={reglages.message}
                  onChange={(message) => changer({ ...reglages, message })}
                />
                <View style={styles.trait} />
                <Ligne
                  titre="Changements de mes sessions"
                  detail="Nouvel horaire, nouveau lieu ou session annulée."
                  valeur={reglages.changement}
                  onChange={(changement) => changer({ ...reglages, changement })}
                />
                <View style={styles.trait} />
                <Ligne
                  titre="Nouvelles sessions de mes sports"
                  detail={`Une par jour au maximum, à moins de 15 km ${position ? 'de toi' : `du centre de ${NOM_ZONE}`}.`}
                  valeur={reglages.nouvelleSession}
                  onChange={(nouvelleSession) => changer({ ...reglages, nouvelleSession })}
                />
                {reglages.nouvelleSession && (
                  <View style={styles.sports}>
                    {SPORTS.map(({ cle, nom }) => {
                      const actif = reglages.sports.includes(cle);
                      return (
                        <Pressable
                          key={cle}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: actif }}
                          onPress={() => basculerSport(cle)}
                          style={[styles.sport, actif && styles.sportActif]}>
                          <View style={styles.rond}>
                            <PictoSport sport={cle} taille={20} />
                          </View>
                          <Text style={[styles.sportTexte, actif && { color: c.rougeTexte }]}>{nom}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {reglages.nouvelleSession && reglages.sports.length === 0 && (
                  <Text style={styles.aide}>Choisis au moins un sport pour être prévenu.</Text>
                )}
              </View>
            )}
            {echec && (
              <Text accessibilityLiveRegion="polite" style={styles.texte}>
                Ça n’a pas marché. Vérifie ta connexion et réessaie.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ecran: { flex: 1, backgroundColor: c.fond },
    contenu: { padding: Espaces.marge, gap: 16 },
    texte: { fontFamily: Polices.texte, fontSize: Tailles.texte, lineHeight: 24, color: c.texteSecondaire },
    carte: {
      padding: 16,
      gap: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    textes: { flex: 1, gap: 2 },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, lineHeight: 18, color: c.texteSecondaire },
    trait: { height: 1, backgroundColor: c.trait },
    sports: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sport: {
      minHeight: Espaces.cibleTactile,
      paddingLeft: 8,
      paddingRight: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1.5,
      borderColor: c.trait,
    },
    sportActif: { backgroundColor: c.rougeDoux, borderColor: c.rouge },
    rond: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
    },
    sportTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.petit, color: c.encre },
  });

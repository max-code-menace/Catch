import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron } from '@/components/icones';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useCompte } from '@/lib/compte';
import { reglerVibrations, vibrationsActives, vibrer } from '@/lib/haptics';
import { useStyles, useTheme, type Apparence, type Palette } from '@/lib/theme';

const APPARENCES: { valeur: Apparence; titre: string }[] = [
  { valeur: 'auto', titre: 'Auto' },
  { valeur: 'clair', titre: 'Clair' },
  { valeur: 'sombre', titre: 'Sombre' },
];

/** Réglages disponibles avec ou sans compte : apparence et vibrations. */
function Reglages() {
  const styles = useStyles(creerStyles);
  const { c, apparence, setApparence } = useTheme();
  const [vibrations, setVibrations] = useState(vibrationsActives());

  return (
    <View style={styles.reglages}>
      <Text style={styles.section}>Réglages</Text>
      <View style={styles.carte}>
        <Text style={styles.libelle}>Apparence</Text>
        <View accessibilityRole="radiogroup" style={styles.choix}>
          {APPARENCES.map(({ valeur, titre }) => {
            const actif = apparence === valeur;
            return (
              <Pressable
                key={valeur}
                accessibilityRole="radio"
                accessibilityState={{ checked: actif }}
                onPress={() => {
                  if (actif) return;
                  vibrer.selection();
                  setApparence(valeur);
                }}
                style={[styles.option, actif && styles.optionActive]}>
                <Text style={[styles.optionTexte, actif && { color: c.encre }]}>{titre}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.aide}>Auto suit le réglage de ton téléphone.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/notifications')}
        style={({ pressed }) => [styles.carte, styles.ligne, pressed && { backgroundColor: c.beige }]}>
        <Text style={styles.libelle}>Notifications</Text>
        <IconeChevron couleur={c.texteSecondaire} taille={20} />
      </Pressable>
      <View style={[styles.carte, styles.ligne]}>
        <Text style={styles.libelle}>Vibrations</Text>
        <Switch
          accessibilityLabel="Vibrations"
          value={vibrations}
          onValueChange={(valeur) => {
            reglerVibrations(valeur);
            setVibrations(valeur);
            vibrer.selection();
          }}
          trackColor={{ true: c.rouge, false: c.trait }}
          thumbColor={c.rondPicto}
        />
      </View>
    </View>
  );
}

export default function Profil() {
  const { compte, pret, deconnecter } = useCompte();

  if (!pret) return <Ecran titre="Profil" />;

  if (!compte) {
    return (
      <Ecran titre="Profil">
        <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
        <Reglages />
      </Ecran>
    );
  }

  return (
    <Ecran titre={compte.prenom ?? 'Profil'}>
      <Aide>Tes sessions à venir s’afficheront ici.</Aide>
      <Reglages />
      <View>
        <Bouton titre="Me déconnecter" variante="secondaire" onPress={() => deconnecter()} />
      </View>
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    reglages: { gap: 12, marginTop: 12 },
    section: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },
    carte: {
      padding: 16,
      gap: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    choix: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: c.beige, borderRadius: Rayons.bouton },
    option: {
      flex: 1,
      minHeight: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    optionActive: { backgroundColor: c.carte, borderColor: c.trait },
    optionTexte: { fontFamily: Polices.texteMoyen, fontSize: 15, color: c.texteSecondaire },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Polices, Tailles } from '@/constants/theme';
import type { Champ, Morceau } from '@/lib/phrase-creation';
import { useStyles, type Palette } from '@/lib/theme';

/** Découpe en mots en gardant l'espace qui suit chaque mot (sauf le dernier) : la phrase peut passer à la ligne entre deux mots. */
function motsDe(texte: string) {
  const mots = texte.split(' ').filter(Boolean);
  return mots.map((mot, i) => (i < mots.length - 1 ? `${mot} ` : mot));
}

type Props = {
  morceaux: Morceau[];
  /** Toucher un mot choisi : on revient sur ce choix */
  onToucher: (champ: Champ) => void;
};

/**
 * La phrase de Créer, qui s'écrit au fur et à mesure (version D choisie par Maxime le 24 novembre) :
 * chaque choix est écrit en rouge (plus de surligneur ni de curseur depuis l'audit du 27 novembre) ;
 * la phrase s'arrête à la question en cours, en gris pâle. Rien n'est montré de la suite.
 */
/** La phrase s'arrête après le premier trou : la suite n'est pas encore écrite */
function finPhrase(morceaux: Morceau[]) {
  const trou = morceaux.findIndex((m) => m.type === 'trou');
  return trou === -1 ? morceaux.length : trou + 1;
}

export function PhraseCreation({ morceaux, onToucher }: Props) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.phrase}>
      {morceaux.slice(0, finPhrase(morceaux)).map((morceau, i) => {
        if (morceau.type === 'trou') {
          return (
            <View key={`trou-${morceau.champ}`} accessible accessibilityLabel={`À choisir : ${morceau.texte}`} style={styles.mot}>
              <Text maxFontSizeMultiplier={1.3} style={styles.question}>
                {morceau.texte.replace(' ?', '\u00a0?')}
              </Text>
            </View>
          );
        }
        const mots = motsDe(morceau.texte);
        if (morceau.type === 'texte') {
          return mots.map((mot, j) => (
            <Text key={`${i}-${j}`} maxFontSizeMultiplier={1.3} style={styles.texte}>
              {j === mots.length - 1 ? `${mot} ` : mot}
            </Text>
          ));
        }
        // Un choix : chaque mot peut passer à la ligne ; le premier porte ce que lit VoiceOver
        return mots.map((mot, j) => (
          <Pressable
            key={`${i}-${j}`}
            accessible={j === 0}
            accessibilityRole="button"
            accessibilityLabel={j === 0 ? `${morceau.texte}. Changer` : undefined}
            onPress={() => onToucher(morceau.champ)}
            style={({ pressed }) => [styles.mot, pressed && styles.presse]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.choix}>
              {mot}
            </Text>
            {j === mots.length - 1 && (
              <Text maxFontSizeMultiplier={1.3} style={styles.texte}>{`${morceau.ponctuation ?? ''} `}</Text>
            )}
          </Pressable>
        ));
      })}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    phrase: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 4 },
    // Plus grand que la maquette, à la demande de Maxime : c'est le cœur de l'écran
    texte: { fontFamily: Polices.titreDemi, fontSize: Tailles.grandNombre, lineHeight: 44, color: c.encre },
    choix: { fontFamily: Polices.titre, fontSize: Tailles.grandNombre, lineHeight: 44, color: c.rougeTexte },
    question: { fontFamily: Polices.titreDemi, fontSize: Tailles.grandNombre, lineHeight: 44, color: c.pointVide },
    mot: { flexDirection: 'row', alignItems: 'center' },
    presse: { opacity: 0.6 },
  });

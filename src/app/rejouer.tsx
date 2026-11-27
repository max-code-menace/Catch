// « Tu rejouerais avec qui ? » : après une session, on choisit les joueurs avec qui on rejouerait.
// Si c'est réciproque, on devient potes. Personne ne voit qui ne l'a pas choisi.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Chargement } from '@/components/chargement';
import { EcranSecondaire } from '@/components/ecran-secondaire';
import { IconeCoche } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { prevenir } from '@/lib/alerte';
import { vibrer } from '@/lib/haptics';
import { lireQuestion, repondre, type QuestionRejouer } from '@/lib/potes';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** « Lucas », « Lucas et Sarah », « Lucas, Sarah et Théo » */
function liste(prenoms: string[]) {
  if (prenoms.length <= 1) return prenoms[0] ?? '';
  return `${prenoms.slice(0, -1).join(', ')} et ${prenoms[prenoms.length - 1]}`;
}

function deuxLettres(prenom: string) {
  const net = prenom.trim();
  return net ? net.charAt(0).toUpperCase() + net.slice(1, 2).toLowerCase() : '?';
}

export default function Rejouer() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const [question, setQuestion] = useState<QuestionRejouer | null | 'chargement' | 'erreur'>('chargement');
  const [choix, setChoix] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [nouveaux, setNouveaux] = useState<{ id: string; prenom: string }[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      lireQuestion().then((q) => actif && setQuestion((avant) => (avant === 'chargement' ? q : avant)));
      return () => {
        actif = false;
      };
    }, []),
  );

  async function valider(q: QuestionRejouer) {
    setEnvoi(true);
    const resultat = await repondre(q.sessionId, choix);
    setEnvoi(false);
    if (resultat === null) {
      vibrer.erreur();
      prevenir('Pas de réseau', 'Ta réponse n’est pas partie.');
      return;
    }
    if (resultat.length) vibrer.succes();
    setNouveaux(resultat);
  }

  const fonds = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];

  if (nouveaux) {
    return (
      <EcranSecondaire titre={nouveaux.length ? 'Nouveaux potes' : 'C’est noté'}>
        <View style={styles.resultat}>
          {nouveaux.length > 0 && (
            <View style={styles.ronds}>
              {nouveaux.slice(0, 4).map((p, i) => (
                <View key={p.id} style={[styles.grandRond, { backgroundColor: fonds[i % 4] }, i > 0 && styles.rondSuivant]}>
                  <Text style={styles.grandRondTexte}>{deuxLettres(p.prenom)}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.titre}>
            {nouveaux.length
              ? `${liste(nouveaux.map((p) => p.prenom))} et toi, potes !`
              : 'Merci, c’est noté.'}
          </Text>
          <Text style={styles.aide}>
            {nouveaux.length
              ? 'Vous voyez maintenant la semaine l’un de l’autre, et quand vous êtes dispo.'
              : 'Si quelqu’un te choisit aussi, vous deviendrez potes.'}
          </Text>
          <Bouton titre="Voir mes potes" onPress={() => router.navigate({ pathname: '/profil', params: { onglet: 'potes' } })} />
        </View>
      </EcranSecondaire>
    );
  }

  if (question === 'chargement') {
    return (
      <EcranSecondaire titre="Tu rejouerais avec qui ?">
        <Chargement />
      </EcranSecondaire>
    );
  }

  if (question === 'erreur' || question === null) {
    return (
      <EcranSecondaire titre="Tu rejouerais avec qui ?">
        <Text style={styles.aide}>
          {question === 'erreur'
            ? 'Pas de réseau. Réessaie dans un instant.'
            : 'Rien à répondre pour l’instant. La question revient après ta prochaine session.'}
        </Text>
        <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} />
      </EcranSecondaire>
    );
  }

  const q = question;
  return (
    <EcranSecondaire titre="Tu rejouerais avec qui ?">
      <View style={styles.session}>
        <PictoSport sport={q.sport} taille={30} />
        <Text style={styles.sessionTexte} numberOfLines={1}>
          {q.titre} · {q.lieu}
        </Text>
      </View>
      <Text style={styles.aide}>Si c’est réciproque, vous devenez potes. Ça reste entre vous.</Text>
      <View style={styles.liste}>
        {q.joueurs.map((j, i) => {
          const oui = choix.includes(j.id);
          return (
            <Pressable
              key={j.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: oui }}
              accessibilityLabel={j.prenom}
              onPress={() => {
                vibrer.selection();
                setChoix(oui ? choix.filter((x) => x !== j.id) : [...choix, j.id]);
              }}
              style={[styles.joueur, oui && styles.joueurChoisi]}>
              <View style={[styles.rond, { backgroundColor: fonds[i % 4] }]}>
                <Text style={styles.rondTexte}>{deuxLettres(j.prenom)}</Text>
              </View>
              <Text style={styles.prenom} numberOfLines={1}>
                {j.prenom}
              </Text>
              <View style={[styles.coche, oui && styles.cocheOui]}>
                {oui && <IconeCoche couleur={c.surRouge} taille={16} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Bouton
        titre={choix.length ? 'Valider' : 'Personne cette fois'}
        variante={choix.length ? 'principal' : 'secondaire'}
        disabled={envoi}
        onPress={() => valider(q)}
      />
    </EcranSecondaire>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    aide: { fontFamily: Polices.texte, fontSize: Tailles.courant, lineHeight: 22, color: c.texteSecondaire },
    session: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sessionTexte: { flex: 1, fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    liste: { gap: 10 },
    joueur: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: c.trait,
      backgroundColor: c.carte,
    },
    joueurChoisi: { borderColor: c.rouge, backgroundColor: c.rougeDoux },
    rond: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    rondTexte: { fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.surAvatar },
    prenom: { flex: 1, fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    coche: {
      width: 28,
      height: 28,
      borderRadius: Rayons.pilule,
      borderWidth: 2,
      borderColor: c.trait,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cocheOui: { borderColor: c.rouge, backgroundColor: c.rouge },
    resultat: { alignItems: 'center', gap: 16, paddingTop: 24 },
    ronds: { flexDirection: 'row' },
    grandRond: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: c.fond,
    },
    rondSuivant: { marginLeft: -14 },
    grandRondTexte: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.surAvatar },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.encre, textAlign: 'center' },
  });

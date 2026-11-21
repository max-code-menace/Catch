import { StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { IconeInviter } from '@/components/icones';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { estEnDirect, placesLibres } from '@/lib/formats';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Au-delà, la dernière case affiche « +N » : la grille reste sur 3 lignes. */
const CASES_MAX = 15;

/**
 * L'équipe d'une session : un rond par joueur inscrit (« Toi » en rouge) et un rond en pointillés
 * par place libre, pour voir d'un coup d'œil qui vient et ce qui reste à remplir.
 */
export function EquipeSession({ session, onInviter }: { session: Session; onInviter?: () => void }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const teintes = [c.avatar1, c.avatar2, c.avatar3, c.avatar4];
  const libres = placesLibres(session);
  const nombre = session.inscrits.length;

  // Les cases : les inscrits puis les places libres, coupées à CASES_MAX avec un « +N » à la fin
  const cases: ({ type: 'joueur'; nom: string } | { type: 'libre' })[] = [
    ...session.inscrits.map((nom) => ({ type: 'joueur' as const, nom })),
    ...Array.from({ length: libres }, () => ({ type: 'libre' as const })),
  ];
  const coupees = cases.length > CASES_MAX ? cases.slice(0, CASES_MAX - 1) : cases;
  const reste = cases.length - coupees.length;

  const resume = libres === 0 ? 'Complet' : libres === 1 ? '1 place à remplir' : `${libres} places à remplir`;

  return (
    <View style={styles.carte}>
      <View style={styles.entete}>
        <Text accessibilityRole="header" style={styles.titre}>
          L’équipe
        </Text>
        <Text style={styles.compte}>
          {nombre} {estEnDirect(session) ? 'jouent' : nombre === 1 ? 'inscrit' : 'inscrits'} sur {session.joueurs}
        </Text>
      </View>

      <View
        style={styles.grille}
        accessible
        accessibilityLabel={`${session.inscrits.join(', ')}. ${resume}.`}>
        {coupees.map((une, i) =>
          une.type === 'joueur' ? (
            <View
              key={i}
              style={[
                styles.rond,
                { backgroundColor: une.nom === 'Toi' ? c.rouge : teintes[i % teintes.length] },
              ]}>
              <Text
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                style={[styles.initiales, une.nom === 'Toi' && { color: c.surRouge }]}>
                {une.nom}
              </Text>
            </View>
          ) : (
            <View key={i} style={[styles.rond, styles.libre]} />
          ),
        )}
        {reste > 0 && (
          <View style={[styles.rond, { backgroundColor: c.beige }]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.initiales, { color: c.encre }]}>
              +{reste}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.pied}>
        <Text style={[styles.resume, libres === 0 && { color: c.texteSecondaire }]}>{resume}</Text>
        {libres > 0 && onInviter && (
          <Bouton titre="Inviter" variante="secondaire" Icone={IconeInviter} onPress={onInviter} style={styles.inviter} />
        )}
      </View>
    </View>
  );
}

const TAILLE_ROND = 48;

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    carte: {
      gap: 14,
      padding: 16,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    entete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    titre: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.encre },
    compte: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    rond: {
      width: TAILLE_ROND,
      height: TAILLE_ROND,
      borderRadius: TAILLE_ROND / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    libre: { borderWidth: 2, borderStyle: 'dashed', borderColor: c.rougeBordure },
    initiales: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.surAvatar },
    pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
    resume: { flex: 1, fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.rougeTexte },
    inviter: { paddingHorizontal: 16 },
  });

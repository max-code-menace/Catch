import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { CartesFantomes } from '@/components/chargement';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { BandeauxSports } from '@/donnees/images-sports';
import { useCompte } from '@/lib/compte';
import { quand, quandPhrase } from '@/lib/formats';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Une session où je suis inscrit : la photo du sport en bandeau, touche pour ouvrir son détail. */
function LigneSession({ session, moi }: { session: Session; moi: string }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const organise = session.organisateurId === moi;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${session.titre}, ${quandPhrase(session)}, ${session.lieu}${organise ? ', tu organises' : ''}`}
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
      style={({ pressed }) => [styles.carte, pressed && { opacity: 0.85 }]}>
      <View>
        <Image source={BandeauxSports[session.sport]} style={styles.terrain} resizeMode="cover" accessibilityIgnoresInvertColors />
        {organise && (
          <View style={styles.badge}>
            <Text maxFontSizeMultiplier={1.3} style={styles.badgeTexte}>
              Tu organises
            </Text>
          </View>
        )}
      </View>
      <View style={styles.bas}>
        <View style={styles.picto}>
          <PictoSport sport={session.sport} taille={26} />
        </View>
        <View style={styles.textes}>
          <Text style={styles.libelle} numberOfLines={1}>
            {session.titre} · {quand(session.debut)}
          </Text>
          <Text style={styles.aide} numberOfLines={1}>
            {session.lieu}
            {session.commune ? `, ${session.commune}` : ''}
          </Text>
        </View>
        <IconeChevron couleur={c.texteSecondaire} taille={20} />
      </View>
    </Pressable>
  );
}

/** Onglet « Mes sessions » : les sessions à venir où je suis inscrit, la prochaine en premier. */
export default function MesSessions() {
  const styles = useStyles(creerStyles);
  const { compte, pret } = useCompte();
  const { sessions, etat } = useSessions();

  if (!pret) return <Ecran titre="Mes sessions" />;

  if (!compte) {
    return (
      <Ecran titre="Mes sessions">
        <Aide>Connecte-toi pour retrouver ici les sessions où tu es inscrit.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
      </Ecran>
    );
  }

  const miennes = sessions
    .filter((s) => s.idsInscrits.includes(compte.id))
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  return (
    <Ecran titre="Mes sessions" defile>
      {miennes.length === 0 && etat === 'chargement' ? (
        <CartesFantomes accessibilityLabel="Recherche de tes sessions" />
      ) : miennes.length === 0 ? (
        <View style={styles.vide}>
          <Aide>
            {etat === 'erreur'
                ? 'Impossible de charger tes sessions. Vérifie ta connexion.'
                : 'Aucune session prévue. Catches-en une sur la carte, ou crée la tienne.'}
          </Aide>
          {etat === 'pretes' && (
            <View>
              <Bouton titre="Voir la carte" variante="secondaire" onPress={() => router.navigate('/')} />
            </View>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.section}>
            {miennes.length === 1 ? '1 session à venir' : `${miennes.length} sessions à venir`}
          </Text>
          {miennes.map((session) => (
            <LigneSession key={session.id} session={session} moi={compte.id} />
          ))}
        </>
      )}
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    section: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire },
    vide: { gap: 16 },
    carte: {
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
      overflow: 'hidden',
    },
    terrain: { width: '100%', height: 140, backgroundColor: c.beige },
    bas: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    picto: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
    textes: { flex: 1, gap: 2 },
    libelle: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    badge: {
      position: 'absolute',
      top: 12,
      left: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      boxShadow: c.ombrePetite,
    },
    badgeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.micro, color: c.orangeTexte },
  });

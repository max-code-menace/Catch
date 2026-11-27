import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Bouton } from '@/components/bouton';
import { BalleRebond, CartesFantomes } from '@/components/chargement';
import { Aide, Ecran } from '@/components/ecran';
import { IconeMessages } from '@/components/icones';
import { PointEnDirect } from '@/components/pastille-session';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Session } from '@/donnees/sessions';
import { BandeauxSports } from '@/donnees/images-sports';
import { useCompte } from '@/lib/compte';
import { estEnDirect, jourSection, placesLibres, pointsDesPlaces, quandPhrase, textesBandeau } from '@/lib/formats';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Hauteur d'une carte ; la toute prochaine session est un peu plus haute */
const HAUTEUR = 112;
const HAUTEUR_PROCHAINE = 136;

/** Voile foncé de gauche à droite : le texte se lit sur le fond orange, la photo reste nette à droite */
function Voile() {
  const c = useCouleurs();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="voile" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={c.voilePhoto} stopOpacity={0.55} />
          <Stop offset="0.5" stopColor={c.voilePhoto} stopOpacity={0.25} />
          <Stop offset="1" stopColor={c.voilePhoto} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#voile)" />
    </Svg>
  );
}

/** En haut à droite : ce qui compte le plus (en direct, j'organise, presque plein), sinon les places « 7/10 » */
function Statut({ session, organise }: { session: Session; organise: boolean }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const libres = placesLibres(session);
  if (estEnDirect(session)) {
    return (
      <View style={[styles.pastille, { backgroundColor: c.rouge }]}>
        <PointEnDirect couleur={c.surRouge} />
        <Text maxFontSizeMultiplier={1.3} style={[styles.pastilleTexte, { color: c.surRouge }]}>
          En direct
        </Text>
      </View>
    );
  }
  const texte = organise
    ? 'Tu organises'
    : libres === 1
      ? 'Il manque 1 joueur'
      : libres === 2
        ? 'Presque plein'
        : `${Math.min(session.inscrits.length, session.joueurs)}/${session.joueurs}`;
  return (
    <View style={styles.pastille}>
      <Text maxFontSizeMultiplier={1.3} style={[styles.pastilleTexte, organise || libres <= 2 ? { color: c.orangeSurBlanc } : null]}>
        {texte}
      </Text>
    </View>
  );
}

/**
 * Une session où je suis inscrit (mélange D2 + D3 choisi par Maxime le 26 novembre) : tout est écrit sur
 * la photo du sport, la barre des places est collée en bas, une bulle ouvre la conversation du groupe.
 */
function CarteSession({ session, moi, prochaine }: { session: Session; moi: string; prochaine: boolean }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const organise = session.organisateurId === moi;
  const { petit, grand } = textesBandeau(session);
  const { points } = pointsDesPlaces(session);
  const presquePlein = placesLibres(session) > 0 && placesLibres(session) <= 2;

  const hauteur = prochaine ? HAUTEUR_PROCHAINE : HAUTEUR;
  return (
    <View style={[styles.carte, { height: hauteur }]}>
      {/* La photo (5:2) calée à droite : le texte reste sur le fond orange à gauche, l'objet entier à droite */}
      <Image
        source={BandeauxSports[session.sport]}
        style={[styles.photo, { width: hauteur * 2.5, height: hauteur }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <Voile />
      {/* Toute la carte ouvre le détail ; la bulle, posée par-dessus, ouvre la conversation */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${session.titre}, ${quandPhrase(session)}, ${session.lieu}${organise ? ', tu organises' : ''}`}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}
        style={({ pressed }) => [styles.contenu, pressed && { backgroundColor: c.traitPhoto }]}>
        <View style={styles.ligne}>
          <View style={styles.quand}>
            <Text maxFontSizeMultiplier={1.3} style={styles.petit}>
              {petit}
            </Text>
            <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.grand, prochaine && styles.grandProchaine]}>
              {grand}
            </Text>
          </View>
          <Statut session={session} organise={organise} />
        </View>
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.titre}>
            {session.titre}
          </Text>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.lieu}>
            {session.lieu}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Écrire au groupe : ${session.titre}`}
        hitSlop={6}
        onPress={() => router.push({ pathname: '/messages/[id]', params: { id: session.id } })}
        style={({ pressed }) => [styles.bulle, pressed && { opacity: 0.7 }]}>
        <IconeMessages couleur={c.surRond} taille={18} />
      </Pressable>
      {/* Les places, collées en bas de la carte : une case par joueur, la sienne en clair */}
      <View style={styles.barre} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {points.map((point, i) => (
          <View
            key={i}
            style={[
              styles.case,
              point === 'joueur' && { backgroundColor: c.surPhoto },
              point === 'toi' && { backgroundColor: c.moiPhoto },
              point === 'libre' && presquePlein && { backgroundColor: c.moiPhoto, opacity: 0.45 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/** Onglet « Mes sessions » : les sessions à venir où je suis inscrit, rangées par jour, la prochaine en premier. */
export default function MesSessions() {
  const styles = useStyles(creerStyles);
  const { compte, pret } = useCompte();
  const { sessions, etat } = useSessions();

  if (!pret) return <Ecran titre="Mes sessions" />;

  if (!compte) {
    return (
      <Ecran titre="Mes sessions">
        <View style={styles.vide}>
          <Image source={BandeauxSports.foot} style={styles.photoVide} resizeMode="cover" accessibilityIgnoresInvertColors />
          <Text style={styles.videTitre}>Tes sessions arrivent ici</Text>
          <Aide>Connecte-toi pour retrouver les sessions où tu es inscrit.</Aide>
          <View style={styles.videBouton}>
            <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
          </View>
        </View>
      </Ecran>
    );
  }

  const miennes = sessions
    .filter((s) => s.idsInscrits.includes(compte.id))
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  // Rangées par jour : « Aujourd’hui », « Demain », « Samedi 28 »
  const jours: { titre: string; sessions: Session[] }[] = [];
  for (const session of miennes) {
    const titre = jourSection(session.debut);
    const dernier = jours[jours.length - 1];
    if (dernier?.titre === titre) dernier.sessions.push(session);
    else jours.push({ titre, sessions: [session] });
  }

  return (
    <Ecran titre="Mes sessions" defile>
      {miennes.length === 0 && etat === 'chargement' ? (
        <CartesFantomes accessibilityLabel="Recherche de tes sessions" />
      ) : miennes.length === 0 ? (
        <View style={styles.vide}>
          {etat === 'erreur' ? (
            <Aide>Pas de réseau.</Aide>
          ) : (
            <>
              <BalleRebond taille={48} hauteur={40} />
              <Text style={styles.videTitre}>Rien de prévu pour l’instant</Text>
              <Aide>Catche une session sur la carte, ou lance la tienne.</Aide>
              <View style={styles.videBouton}>
                <Bouton titre="Voir la carte" onPress={() => router.navigate('/')} />
              </View>
            </>
          )}
        </View>
      ) : (
        jours.map((jour, j) => (
          <View key={jour.titre} style={styles.jour}>
            <View style={styles.jourEntete}>
              <Text accessibilityRole="header" style={styles.jourTitre}>
                {jour.titre}
              </Text>
              <Text style={styles.jourNombre}>
                {jour.sessions.length} {jour.sessions.length > 1 ? 'sessions' : 'session'}
              </Text>
            </View>
            {jour.sessions.map((session, i) => (
              <CarteSession key={session.id} session={session} moi={compte.id} prochaine={j === 0 && i === 0} />
            ))}
          </View>
        ))
      )}
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    jour: { gap: 10 },
    jourEntete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
    jourTitre: { fontFamily: Polices.titre, fontSize: Tailles.accent, color: c.encre },
    jourNombre: { ...Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    carte: { borderRadius: Rayons.carte, overflow: 'hidden', backgroundColor: c.fondPhoto },
    photo: { position: 'absolute', top: 0, bottom: 0, right: -24 },
    contenu: { flex: 1, justifyContent: 'space-between', paddingTop: 11, paddingHorizontal: 12, paddingBottom: 16 },
    ligne: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    quand: { flexShrink: 1 },
    petit: { ...Polices.texteDemi, fontSize: Tailles.micro, color: c.surPhoto, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.6 },
    grand: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.surPhoto },
    grandProchaine: { fontSize: Tailles.titreSession },
    textes: { paddingRight: 54 },
    titre: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.surPhoto },
    lieu: { ...Polices.texteMoyen, fontSize: Tailles.pastille, color: c.surPhoto, opacity: 0.85 },
    pastille: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: Rayons.pilule,
      backgroundColor: c.rondPicto,
    },
    pastilleTexte: { ...Polices.texteDemi, fontSize: Tailles.pastille, color: c.surRond },
    bulle: {
      position: 'absolute',
      right: 12,
      bottom: 16,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
    },
    barre: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 7, flexDirection: 'row', gap: 2 },
    case: { flex: 1, backgroundColor: c.traitPhoto },
    vide: { alignItems: 'center', gap: 12, paddingTop: 24 },
    videTitre: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.encre, textAlign: 'center' },
    videBouton: { alignSelf: 'stretch' },
    photoVide: { width: '100%', height: 120, borderRadius: Rayons.carte, opacity: 0.7 },
  });

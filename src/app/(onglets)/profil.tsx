import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { IconeCreer, IconeMenu, IconeProfil, IconeVerifie } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { TerrainSport } from '@/components/terrain-sport';
import { Chargement } from '@/components/chargement';
import { SITE } from '@/constants/liens';
import { Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { NOM_ZONE } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { useCompte } from '@/lib/compte';
import { quand } from '@/lib/formats';
import { useHistorique } from '@/lib/historique';
import { useMesSports } from '@/lib/mes-sports';
import {
  accorder,
  dateCourte,
  initiale,
  separerTraces,
  statsProfil,
  texteMembreDepuis,
  type Trace,
} from '@/lib/profil';
import { vibrer } from '@/lib/haptics';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Écart entre les tuiles de la grille, comme sur Instagram : très fin */
const ECART_GRILLE = 4;

/** Les trois traits en haut à droite : réglages, aide, compte */
function BoutonMenu() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Réglages"
      onPress={() => router.push('/reglages')}
      hitSlop={8}
      style={({ pressed }) => [styles.menu, pressed && { backgroundColor: c.beige }]}>
      <IconeMenu couleur={c.encre} taille={26} />
    </Pressable>
  );
}

/** Le grand rond : l'initiale du prénom sur le dégradé de « + Créer » */
function Avatar({ prenom }: { prenom: string | null }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const lettre = initiale(prenom);
  return (
    <View style={styles.anneau} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.avatar, !lettre && styles.avatarVide]}>
        {lettre ? (
          <Text style={styles.avatarLettre} maxFontSizeMultiplier={1}>
            {lettre}
          </Text>
        ) : (
          <IconeProfil couleur={c.texteSecondaire} taille={40} />
        )}
      </View>
    </View>
  );
}

function Compteur({ nombre, libelle, lu }: { nombre: number; libelle: string; lu: string }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.compteur} accessible accessibilityLabel={lu}>
      <Text style={styles.compteurNombre} maxFontSizeMultiplier={1.3}>
        {nombre}
      </Text>
      <Text style={styles.compteurLibelle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
        {libelle}
      </Text>
    </View>
  );
}

/** Petit bouton gris sous l'en-tête, comme « Modifier le profil » d'Instagram */
function PetitBouton({ titre, onPress }: { titre: string; onPress: () => void }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.petitBouton, pressed && { backgroundColor: c.trait }]}>
      <Text style={styles.petitBoutonTexte} maxFontSizeMultiplier={1.3} numberOfLines={1}>
        {titre}
      </Text>
    </Pressable>
  );
}

/** Mes sports en ronds, comme les « stories à la une » : toucher ouvre le choix des sports */
function RondsMesSports() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { sports } = useMesSports();
  const ouvrir = () => router.push('/mes-sports');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.ronds}
      style={styles.rondsCadre}>
      {sports.map((sport) => (
        <Pressable
          key={sport}
          accessibilityRole="button"
          accessibilityLabel={`${ficheSport(sport).nom}, dans mes sports`}
          accessibilityHint="Modifier mes sports"
          onPress={ouvrir}
          style={styles.rondSport}>
          <View style={styles.rondAnneau}>
            <View style={styles.rondInterieur}>
              <PictoSport sport={sport} taille={44} />
            </View>
          </View>
          <Text style={styles.rondNom} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {ficheSport(sport).nomTuile ?? ficheSport(sport).nom}
          </Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sports.length ? 'Modifier mes sports' : 'Choisir mes sports'}
        onPress={ouvrir}
        style={styles.rondSport}>
        <View style={[styles.rondAnneau, styles.rondAjout]}>
          <IconeCreer couleur={c.encre} taille={26} />
        </View>
        <Text style={styles.rondNom} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {sports.length ? 'Modifier' : 'Mes sports'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/** Une tuile carrée de la grille : le terrain du sport, son picto, la date */
function Tuile({ trace, taille, passee }: { trace: Trace; taille: number; passee: boolean }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const lu = `${trace.titre}, ${passee ? dateCourte(trace.debut) : quand(trace.debut)}, ${trace.lieu}${
    trace.organise ? ', tu organisais' : ''
  }`;
  const contenu = (
    <>
      <TerrainSport sport={trace.sport} couleur={passee ? c.texteSecondaire : c.surRouge} />
      {trace.organise && (
        <View style={[styles.badge, passee && styles.badgePasse]}>
          <Text style={[styles.badgeTexte, passee && styles.badgeTextePasse]} maxFontSizeMultiplier={1}>
            {passee ? 'Organisée' : 'Tu organises'}
          </Text>
        </View>
      )}
      <View style={styles.tuileRond}>
        <PictoSport sport={trace.sport} taille={Math.round(taille * 0.3)} />
      </View>
      <Text style={[styles.tuileDate, passee && styles.tuileDatePassee]} numberOfLines={1} maxFontSizeMultiplier={1}>
        {passee ? dateCourte(trace.debut) : quand(trace.debut)}
      </Text>
    </>
  );
  const style = [styles.tuile, { width: taille, height: taille }, passee && styles.tuilePassee];
  // Une session terminée n'a plus de page : la tuile se regarde seulement
  if (passee) {
    return (
      <View style={style} accessible accessibilityLabel={lu}>
        {contenu}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: trace.id } })}
      style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}>
      {contenu}
    </Pressable>
  );
}

type Onglet = 'aVenir' | 'jouees';

/** Les deux onglets au-dessus de la grille, soulignés comme sur Instagram */
function Onglets({
  actif,
  onChoisir,
  nombres,
}: {
  actif: Onglet;
  onChoisir: (o: Onglet) => void;
  nombres: Record<Onglet, number>;
}) {
  const styles = useStyles(creerStyles);
  const titres: Record<Onglet, string> = { aVenir: 'À venir', jouees: 'Jouées' };
  return (
    <View style={styles.onglets} accessibilityRole="tablist">
      {(['aVenir', 'jouees'] as const).map((o) => (
        <Pressable
          key={o}
          accessibilityRole="tab"
          accessibilityState={{ selected: actif === o }}
          onPress={() => {
            if (o === actif) return;
            vibrer.selection();
            onChoisir(o);
          }}
          style={[styles.onglet, actif === o && styles.ongletActif]}>
          <Text style={[styles.ongletTexte, actif === o && styles.ongletTexteActif]} maxFontSizeMultiplier={1.3}>
            {titres[o]} · {nombres[o]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function inviterDesAmis() {
  const texte = 'Viens faire du sport avec moi sur Catch :';
  Share.share(Platform.OS === 'ios' ? { message: texte, url: SITE } : { message: `${texte} ${SITE}` }).catch(
    () => {},
  );
}

export default function Profil() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { compte, pret } = useCompte();
  const { traces, etat } = useHistorique();
  const [onglet, setOnglet] = useState<Onglet>('aVenir');
  const { width } = useWindowDimensions();

  if (!pret) return <Ecran titre="Profil" action={<BoutonMenu />} />;

  if (!compte) {
    return (
      <Ecran titre="Profil" defile action={<BoutonMenu />}>
        <View style={styles.entete}>
          <Avatar prenom={null} />
          <View style={styles.enteteTextes}>
            <Text style={styles.nom}>Ton profil</Text>
            <Text style={styles.aide}>Tes sessions, tes sports, ton historique.</Text>
          </View>
        </View>
        <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
        <Text style={styles.section}>Mes sports</Text>
        <RondsMesSports />
      </Ecran>
    );
  }

  const stats = statsProfil(traces);
  const { aVenir, jouees } = separerTraces(traces);
  const liste = onglet === 'aVenir' ? aVenir : jouees;
  // Trois tuiles par ligne, sur toute la largeur moins les marges
  const largeur = Math.min(width, 640) - Espaces.marge * 2;
  const taille = Math.floor((largeur - ECART_GRILLE * 2) / 3);
  const sportPrefere: Sport | undefined = stats.sports[0];

  return (
    <Ecran titre={compte.prenom ?? 'Profil'} defile action={<BoutonMenu />}>
      <View style={styles.entete}>
        <Avatar prenom={compte.prenom} />
        <View style={styles.compteurs}>
          <Compteur
            nombre={stats.jouees}
            libelle={stats.jouees > 1 ? 'jouées' : 'jouée'}
            lu={accorder(stats.jouees, 'session jouée', 'sessions jouées')}
          />
          <Compteur
            nombre={stats.organisees}
            libelle={stats.organisees > 1 ? 'organisées' : 'organisée'}
            lu={accorder(stats.organisees, 'session organisée', 'sessions organisées')}
          />
          <Compteur
            nombre={stats.sports.length}
            libelle={stats.sports.length > 1 ? 'sports' : 'sport'}
            lu={accorder(stats.sports.length, 'sport joué', 'sports joués')}
          />
        </View>
      </View>

      {/* Ce qui inspire confiance, à la BlaBlaCar : depuis quand, et ce qui est vérifié */}
      <View style={styles.confiance}>
        <Text style={styles.aide}>
          {compte.inscritLe ? `${texteMembreDepuis(compte.inscritLe)} · ` : ''}
          {NOM_ZONE}
          {sportPrefere ? ` · surtout ${ficheSport(sportPrefere).nom.toLowerCase()}` : ''}
        </Text>
        {compte.verifiePar && (
          <View style={styles.verifie}>
            <IconeVerifie couleur={c.rougeTexte} taille={18} />
            <Text style={styles.verifieTexte}>
              {compte.verifiePar === 'apple' ? 'Compte Apple vérifié' : 'Adresse e-mail vérifiée'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.boutons}>
        <PetitBouton titre="Inviter des amis" onPress={inviterDesAmis} />
      </View>

      <RondsMesSports />

      <Onglets actif={onglet} onChoisir={setOnglet} nombres={{ aVenir: aVenir.length, jouees: jouees.length }} />

      {liste.length === 0 && etat === 'chargement' ? (
        <Chargement phrases={['On retrouve tes sessions…', 'On compte tes matchs…']} />
      ) : liste.length > 0 ? (
        <View style={styles.grille}>
          {liste.map((t) => (
            <Tuile key={t.id} trace={t} taille={taille} passee={onglet === 'jouees'} />
          ))}
        </View>
      ) : (
        <View style={styles.vide}>
          <Aide>
            {etat === 'erreur'
                ? 'Pas de réseau : tes sessions s’afficheront dès que ça revient.'
                : onglet === 'aVenir'
                  ? 'Rien de prévu pour l’instant.'
                  : 'Pas encore de session jouée.'}
          </Aide>
          {etat === 'pret' && (
            <View>
              <Bouton titre="Trouver une session" variante="secondaire" onPress={() => router.navigate('/')} />
            </View>
          )}
        </View>
      )}
      {onglet === 'jouees' && jouees.length > 0 && (
        <Text style={styles.aide}>Les sessions s’effacent 30 jours après la fin.</Text>
      )}
    </Ecran>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    menu: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
    },
    entete: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
    enteteTextes: { flex: 1, gap: 4 },
    nom: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre },
    anneau: {
      width: 96,
      height: 96,
      borderRadius: 48,
      padding: 3,
      backgroundColor: c.creerFin,
      experimental_backgroundImage: `linear-gradient(135deg, ${c.creerDebut}, ${c.creerFin})`,
    },
    avatar: {
      flex: 1,
      borderRadius: 45,
      borderWidth: 3,
      borderColor: c.fond,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.creerFin,
      experimental_backgroundImage: `linear-gradient(135deg, ${c.creerDebut}, ${c.creerFin})`,
    },
    avatarVide: { backgroundColor: c.beige, experimental_backgroundImage: 'none' },
    avatarLettre: { fontFamily: Polices.titre, fontSize: Tailles.celebration, color: c.surCreer },
    compteurs: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
    compteur: { alignItems: 'center', gap: 2, minWidth: 60 },
    compteurNombre: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
    compteurLibelle: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
    confiance: { gap: 6 },
    verifie: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    verifieTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    boutons: { flexDirection: 'row', gap: 8 },
    petitBouton: {
      flex: 1,
      minHeight: 38,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: c.beige,
    },
    petitBoutonTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.encre },
    section: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.texteSecondaire, marginTop: 12 },
    rondsCadre: { marginHorizontal: -Espaces.marge },
    ronds: { paddingHorizontal: Espaces.marge, gap: 14, paddingVertical: 4 },
    rondSport: { width: 72, alignItems: 'center', gap: 6 },
    rondAnneau: {
      width: 68,
      height: 68,
      borderRadius: 34,
      padding: 2,
      borderWidth: 2,
      borderColor: c.rouge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rondInterieur: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.carte,
    },
    rondAjout: { borderColor: c.trait, borderStyle: 'dashed', backgroundColor: c.carte },
    rondNom: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.encre },
    onglets: {
      flexDirection: 'row',
      marginTop: 4,
      marginHorizontal: -Espaces.marge,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.trait,
    },
    onglet: {
      flex: 1,
      minHeight: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    ongletActif: { borderBottomColor: c.encre },
    ongletTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.courant, color: c.texteSecondaire },
    ongletTexteActif: { fontFamily: Polices.texteDemi, color: c.encre },
    grille: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART_GRILLE },
    tuile: {
      overflow: 'hidden',
      borderRadius: 6,
      backgroundColor: c.rouge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tuilePassee: { backgroundColor: c.beige },
    tuileRond: {
      width: '46%',
      aspectRatio: 1,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
      boxShadow: c.ombrePetite,
    },
    tuileDate: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 6,
      fontFamily: Polices.texteDemi,
      fontSize: Tailles.pastille,
      color: c.surRouge,
    },
    tuileDatePassee: { color: c.encre },
    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Rayons.pilule,
      backgroundColor: c.rondPicto,
    },
    badgePasse: { backgroundColor: c.carte },
    badgeTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surAvatar },
    badgeTextePasse: { color: c.texteSecondaire },
    vide: { gap: 12, paddingVertical: 16 },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.texteSecondaire },
  });

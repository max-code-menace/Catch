// Profil (maquette K choisie par Maxime le 22 novembre) : un en-tête blanc qui flotte en haut,
// avec son rond, son prénom et 4 compteurs qui servent de navigation : Semaine, Catchs, Potes, Sports.
// En défilant, l'en-tête se replie (petit rond + compteurs). Code de la semaine : case pleine avec
// un drapeau = j'organise, case avec un contour = j'y vais, pointillés = libre.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/bouton';
import { Chargement } from '@/components/chargement';
import { Aide, Ecran } from '@/components/ecran';
import { IconeChevron, IconeCreer, IconeDrapeau, IconeMenu, IconePhoto, IconeProfil, IconeVerifie } from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { SITE } from '@/constants/liens';
import { BarreNavigation, Espaces, Polices, RESERVE_BAS, Rayons, Tailles } from '@/constants/theme';
import type { Sport } from '@/donnees/pictos';
import { NOM_ZONE } from '@/donnees/sessions';
import { ficheSport } from '@/donnees/sports';
import { choisir, prevenir } from '@/lib/alerte';
import { useCompte, type Compte } from '@/lib/compte';
import { ecrireA } from '@/lib/ecrire-prive';
import { distance, heure, quand, texteDistance } from '@/lib/formats';
import { vibrer } from '@/lib/haptics';
import { useHistorique } from '@/lib/historique';
import { useMesSports } from '@/lib/mes-sports';
import { usePhoto } from '@/lib/photo';
import { usePotes, type Pote, type SessionPote } from '@/lib/potes';
import {
  accorder,
  dateCourte,
  initiale,
  joursDeLaSemaine,
  indexDuJour,
  semaine,
  separerTraces,
  sportsDuProfil,
  type EtatJour,
  type Trace,
} from '@/lib/profil';
import { useSessions } from '@/lib/sessions';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

type Onglet = 'semaine' | 'catchs' | 'potes' | 'sports';
const ONGLETS: Onglet[] = ['semaine', 'catchs', 'potes', 'sports'];

/** Au-delà de ce défilement, l'en-tête se replie */
const SEUIL_REPLI = 40;

function inviterDesAmis() {
  const texte = 'Viens faire du sport avec moi sur Catch :';
  Share.share(Platform.OS === 'ios' ? { message: texte, url: SITE } : { message: `${texte} ${SITE}` }).catch(
    () => {},
  );
}

/** « Lu », « Sa » : les deux premières lettres du prénom */
function deuxLettres(prenom: string) {
  const net = prenom.trim();
  return net ? net.charAt(0).toUpperCase() + net.slice(1, 2).toLowerCase() : '?';
}

/** Les trois traits : réglages, aide, compte */
function BoutonMenu() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Réglages"
      onPress={() => router.push('/reglages')}
      hitSlop={8}
      style={({ pressed }) => [styles.menu, pressed && { backgroundColor: c.trait }]}>
      <IconeMenu couleur={c.encre} taille={22} />
    </Pressable>
  );
}

/** Son rond : sa photo, sinon l'initiale sur un carré arrondi légèrement penché */
function MonRond({ prenom, petit = false }: { prenom: string | null; petit?: boolean }) {
  const styles = useStyles(creerStyles);
  const { photo } = usePhoto();
  return (
    <View
      style={[styles.monRond, petit && styles.monRondPetit, photo && styles.monRondPhoto]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={[styles.monRondLettre, petit && styles.monRondLettrePetite]} maxFontSizeMultiplier={1}>
          {initiale(prenom) || '?'}
        </Text>
      )}
    </View>
  );
}

/** Le grand rond de l'en-tête : le toucher pour mettre, changer ou retirer sa photo */
function RondAvecPhoto({ prenom }: { prenom: string | null }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { photo, envoi, choisir: choisirPhoto, retirer } = usePhoto();

  async function prendre(source: 'appareil' | 'galerie') {
    const resultat = await choisirPhoto(source);
    if (resultat === 'ok') vibrer.succes();
    if (resultat === 'erreur') {
      vibrer.erreur();
      prevenir('Photo pas envoyée', 'Vérifie ta connexion et réessaie.');
    }
  }

  function ouvrir() {
    vibrer.selection();
    choisir({
      titre: 'Une photo de ton visage aide les autres à te reconnaître au terrain.',
      couleur: c.rouge,
      options: [
        { texte: 'Prendre une photo', onPress: () => prendre('appareil') },
        { texte: 'Choisir dans mes photos', onPress: () => prendre('galerie') },
        ...(photo
          ? [
              {
                texte: 'Retirer ma photo',
                destructif: true,
                onPress: async () => {
                  if (!(await retirer())) prevenir('Pas de réseau', 'Ta photo n’a pas été retirée. Réessaie.');
                },
              },
            ]
          : []),
      ],
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={photo ? 'Changer ma photo' : 'Ajouter une photo'}
      onPress={ouvrir}
      disabled={envoi}
      style={({ pressed }) => [styles.rondAvecPhoto, (pressed || envoi) && styles.presse]}>
      <MonRond prenom={prenom} />
      {!photo && (
        <View style={styles.badgePhoto}>
          <IconePhoto couleur={c.surEncre} taille={13} />
        </View>
      )}
    </Pressable>
  );
}

/** Rond d'un pote : ses deux premières lettres, sur une des 4 couleurs d'avatar */
function RondPote({
  prenom,
  index,
  dispo = false,
  photo,
}: {
  prenom: string;
  index: number;
  dispo?: boolean;
  photo?: string | null;
}) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const fond = [c.avatar1, c.avatar2, c.avatar3, c.avatar4][index % 4];
  return (
    <View style={[styles.rondPote, { backgroundColor: fond }, dispo && styles.rondDispo]}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={styles.rondPoteTexte} maxFontSizeMultiplier={1}>
          {deuxLettres(prenom)}
        </Text>
      )}
    </View>
  );
}

/** Une case de semaine : pleine + drapeau (j'organise), contour (j'y vais), pointillés (libre) */
function CaseJour({
  etat,
  sport,
  texte,
  choisie,
  petite = false,
  onPress,
  label,
}: {
  etat: EtatJour;
  sport?: Sport;
  texte?: string;
  choisie: boolean;
  petite?: boolean;
  onPress: () => void;
  label: string;
}) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: choisie }}
      onPress={() => {
        vibrer.selection();
        onPress();
      }}
      style={[
        styles.case,
        petite && styles.casePetite,
        etat === 'organise' && styles.caseOrganise,
        etat === 'inscrit' && styles.caseInscrit,
        etat === 'libre' && styles.caseLibre,
        choisie && styles.caseChoisie,
      ]}>
      {etat === 'organise' && !petite && (
        <View style={styles.drapeau}>
          <IconeDrapeau couleur={c.surRouge} taille={12} />
        </View>
      )}
      {sport && (
        <View style={[styles.casePicto, petite && styles.casePictoPetit]}>
          <PictoSport sport={sport} taille={petite ? 18 : 20} />
        </View>
      )}
      {texte && !petite ? (
        <Text
          style={[styles.caseTexte, etat === 'organise' ? styles.caseTexteOrganise : styles.caseTexteInscrit]}
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}>
          {texte}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** L'en-tête qui flotte : son identité, puis les 4 compteurs qui servent de navigation */
function EnteteFlottant({
  compte,
  compact,
  onglet,
  nombres,
  onChoisir,
  onMesure,
}: {
  compte: Compte;
  compact: boolean;
  onglet: Onglet;
  nombres: Record<Onglet, number>;
  onChoisir: (o: Onglet) => void;
  onMesure: (hauteur: number) => void;
}) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const { top } = useSafeAreaInsets();
  const noms: Record<Onglet, string> = { semaine: 'À venir', catchs: 'Catchs', potes: 'Potes', sports: 'Sports' };
  const lus: Record<Onglet, string> = {
    semaine: accorder(nombres.semaine, 'session à venir cette semaine', 'sessions à venir cette semaine'),
    catchs: accorder(nombres.catchs, 'Catch', 'Catchs'),
    potes: accorder(nombres.potes, 'pote', 'potes'),
    sports: accorder(nombres.sports, 'sport', 'sports'),
  };
  return (
    <View
      style={[styles.entete, { top: top + 8 }]}
      onLayout={(e) => !compact && onMesure(e.nativeEvent.layout.height)}>
      {!compact && (
        <View style={styles.identite}>
          <RondAvecPhoto prenom={compte.prenom} />
          <View style={styles.identiteTextes}>
            <Text accessibilityRole="header" style={styles.prenom} numberOfLines={1}>
              {compte.prenom ?? 'Profil'}
            </Text>
            <View style={styles.verifie}>
              {compte.verifiePar && <IconeVerifie couleur={c.rougeTexte} taille={15} />}
              <Text style={styles.verifieTexte} numberOfLines={1}>
                {compte.verifiePar ? `Vérifié · ${NOM_ZONE}` : NOM_ZONE}
              </Text>
            </View>
          </View>
          <BoutonMenu />
        </View>
      )}
      <View style={styles.navigation} accessibilityRole="tablist">
        {compact && <MonRond prenom={compte.prenom} petit />}
        <View style={styles.compteurs}>
          {ONGLETS.map((o) => {
            const actif = o === onglet;
            return (
              <Pressable
                key={o}
                accessibilityRole="tab"
                accessibilityLabel={lus[o]}
                accessibilityState={{ selected: actif }}
                onPress={() => {
                  if (actif) return;
                  vibrer.selection();
                  onChoisir(o);
                }}
                style={[styles.compteur, compact && styles.compteurCompact, actif && styles.compteurActif]}>
                <Text
                  style={[styles.compteurNombre, compact && styles.compteurNombreCompact, actif && styles.compteurNombreActif]}
                  maxFontSizeMultiplier={1.2}>
                  {nombres[o]}
                </Text>
                <Text style={[styles.compteurNom, actif && styles.compteurNomActif]} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {noms[o]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Onglet Semaine : l'action du moment, ma semaine en 7 cases, des sessions près de moi */
function SectionSemaine({ traces, potes, semainePotes }: { traces: Trace[]; potes: ReturnType<typeof usePotes>; semainePotes: SessionPote[] }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const [jour, setJour] = useState(-1);
  const { compte } = useCompte();
  const { sessions, origine } = useSessions();
  const { sports: mesSports } = useMesSports();
  const jours = semaine(traces);
  const choisi = jour >= 0 ? jours[jour] : null;

  // Les potes qui n'ont rien de prévu ce jour-là
  const potesSansRien = choisi
    ? potes.potes.filter((p) => !semainePotes.some((s) => s.poteId === p.id && indexDuJour(s.debut) === jour))
    : [];

  const [maintenant] = useState(() => Date.now());
  const moi = compte?.id ?? '';
  const proches = sessions
    .filter((s) => s.debut.getTime() > maintenant && !s.idsInscrits.includes(moi))
    .filter((s) => mesSports.length === 0 || mesSports.includes(s.sport))
    .sort((a, b) => a.debut.getTime() - b.debut.getTime())
    .slice(0, 3);

  async function dispo() {
    vibrer.selection();
    const ok = await potes.basculerDispo();
    if (!ok) prevenir('Pas de réseau', 'Impossible de changer ta dispo. Vérifie ta connexion et réessaie.');
  }

  return (
    <View style={styles.section}>
      {potes.question ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/rejouer')}
          style={({ pressed }) => [styles.question, pressed && styles.presse]}>
          <PictoSport sport={potes.question.sport} taille={30} />
          <View style={styles.flex}>
            <Text style={styles.questionTitre}>Tu rejouerais avec qui ?</Text>
            <Text style={styles.questionDetail} numberOfLines={1}>
              {potes.question.titre} · {potes.question.lieu}
            </Text>
          </View>
          <IconeChevron couleur={c.orangeTexte} taille={20} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: potes.dispo }}
          onPress={dispo}
          style={({ pressed }) => [styles.dispo, potes.dispo && styles.dispoActif, pressed && styles.presse]}>
          <Text style={[styles.dispoTexte, potes.dispo && styles.dispoTexteActif]}>
            {potes.dispo ? 'Dispo ce soir · tes potes le voient' : 'Je suis dispo ce soir'}
          </Text>
        </Pressable>
      )}

      <View style={styles.bloc}>
        <Text style={styles.titreBloc}>Ma semaine</Text>
        <View style={styles.semaine}>
          {jours.map((j, i) => {
            const premiere = j.sessions[0];
            return (
              <View key={j.nom + i} style={styles.colonne}>
                <Text style={[styles.nomJour, i === 0 && styles.nomJourAujourdhui]} maxFontSizeMultiplier={1.2}>
                  {j.nom}
                </Text>
                <CaseJour
                  etat={j.etat}
                  sport={premiere?.sport}
                  texte={premiere ? (j.sessions.length > 1 ? `+${j.sessions.length - 1}` : heure(premiere.debut)) : undefined}
                  choisie={jour === i}
                  onPress={() => setJour(jour === i ? -1 : i)}
                  label={
                    premiere
                      ? `${j.nom}, ${j.sessions.map((s) => `${s.titre} à ${heure(s.debut)}`).join(', ')}`
                      : `${j.nom}, libre`
                  }
                />
              </View>
            );
          })}
        </View>
        {!choisi ? (
          <Text style={styles.aide}>Plein avec drapeau : tu organises · contour : tu y vas. Touche un jour.</Text>
        ) : choisi.sessions.length > 0 ? (
          <View style={styles.carte}>
            {choisi.sessions.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/session/[id]', params: { id: s.id } })}
                style={({ pressed }) => [styles.ligne, pressed && styles.presse]}>
                <PictoSport sport={s.sport} taille={30} />
                <View style={styles.flex}>
                  <Text style={styles.ligneTitre} numberOfLines={1}>
                    {s.titre} · {heure(s.debut)}
                  </Text>
                  <Text style={styles.aide} numberOfLines={1}>
                    {s.lieu}
                    {s.organise ? ' · tu organises' : ''}
                  </Text>
                </View>
                <IconeChevron couleur={c.texteSecondaire} taille={20} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.carte}>
            <Text style={styles.ligneTitre}>{choisi.nom === 'Auj.' ? 'Rien de prévu aujourd’hui' : 'Rien de prévu ce jour-là'}</Text>
            {potesSansRien.length > 0 && (
              <Text style={styles.aide}>
                {potesSansRien
                  .slice(0, 3)
                  .map((p) => p.prenom)
                  .join(', ')}{' '}
                {potesSansRien.length > 1 ? 'n’ont rien de prévu non plus.' : 'n’a rien de prévu non plus.'}
              </Text>
            )}
            <Bouton titre="Proposer une session" onPress={() => router.navigate('/creer')} />
          </View>
        )}
      </View>

      {proches.length > 0 && (
        <View style={styles.bloc}>
          <Text style={styles.titreBloc}>{mesSports.length ? 'Près de toi, dans tes sports' : 'Près de toi'}</Text>
          {proches.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: s.id } })}
              style={({ pressed }) => [styles.carte, styles.ligne, pressed && styles.presse]}>
              <View style={styles.carrePicto}>
                <PictoSport sport={s.sport} taille={32} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.ligneTitre} numberOfLines={1}>
                  {s.titre} · {quand(s.debut)}
                </Text>
                <Text style={styles.aide} numberOfLines={1}>
                  {s.lieu} · {texteDistance(distance(origine, s.position))}
                </Text>
              </View>
              <IconeChevron couleur={c.texteSecondaire} taille={20} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** Onglet Catchs : les sessions jouées, la plus récente d'abord */
function SectionCatchs({ jouees, etat }: { jouees: Trace[]; etat: string }) {
  const styles = useStyles(creerStyles);
  if (jouees.length === 0) {
    if (etat === 'chargement') return <Chargement phrases={['On retrouve tes Catchs…']} />;
    return (
      <View style={styles.section}>
        <Aide>
          {etat === 'erreur'
            ? 'Pas de réseau : tes Catchs s’afficheront dès que ça revient.'
            : 'Pas encore de Catch joué. Ta première session t’attend sur la carte.'}
        </Aide>
        <View>
          <Bouton titre="Trouver une session" variante="secondaire" onPress={() => router.navigate('/')} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <Text style={styles.titreBloc}>Mes Catchs</Text>
      {jouees.map((t) => {
        const [jour, mois] = dateCourte(t.debut).split(' ');
        return (
          <View key={t.id} style={[styles.carte, styles.ligne]} accessible accessibilityLabel={`${t.titre}, ${dateCourte(t.debut)}, ${t.lieu}`}>
            <View style={styles.date}>
              <Text style={styles.dateJour}>{jour}</Text>
              <Text style={styles.dateMois}>{mois}</Text>
            </View>
            <PictoSport sport={t.sport} taille={30} />
            <View style={styles.flex}>
              <Text style={styles.ligneTitre} numberOfLines={1}>
                {t.titre}
              </Text>
              <Text style={styles.aide} numberOfLines={1}>
                {t.lieu}
                {t.organise ? ' · tu organisais' : ''}
              </Text>
            </View>
          </View>
        );
      })}
      <Text style={styles.aide}>Les sessions s’effacent 30 jours après la fin.</Text>
    </View>
  );
}

/** Onglet Potes : dispo ce soir, leur semaine, la liste */
function SectionPotes({ donnees }: { donnees: ReturnType<typeof usePotes> }) {
  const styles = useStyles(creerStyles);
  const { compte } = useCompte();
  const [choisie, setChoisie] = useState<string | null>(null);
  const { potes, semaine: sessions, dispo } = donnees;
  const index = new Map(potes.map((p, i) => [p.id, i]));

  if (potes.length === 0) {
    return (
      <View style={styles.section}>
        <View style={[styles.carte, styles.carteVide]}>
          <Text style={styles.titreBloc}>Pas encore de potes</Text>
          <Text style={styles.aide}>
            Après chaque session, tu choisis avec qui tu rejouerais. Si c’est réciproque, vous devenez potes et vous
            voyez la semaine l’un de l’autre.
          </Text>
          <Bouton titre="Inviter des amis" onPress={inviterDesAmis} />
        </View>
      </View>
    );
  }

  const dispos = potes.filter((p) => p.dispo);
  const jours = joursDeLaSemaine();
  // Ceux qui jouent cette semaine d'abord
  const lignes = [...potes]
    .sort((a, b) => Number(sessions.some((s) => s.poteId === b.id)) - Number(sessions.some((s) => s.poteId === a.id)))
    .slice(0, 8);
  const sessionChoisie = sessions.find((s) => `${s.poteId}:${s.sessionId}` === choisie) ?? null;
  const poteChoisi = sessionChoisie ? potes.find((p) => p.id === sessionChoisie.poteId) : null;

  return (
    <View style={styles.section}>
      <View style={styles.bloc}>
        <Text style={styles.titreBloc}>Dispo ce soir</Text>
        {dispo || dispos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ronds}>
            {dispo && (
              <View style={styles.rondAvecNom}>
                <MonRond prenom={compte?.prenom ?? null} />
                <Text style={styles.nomRond}>Toi</Text>
              </View>
            )}
            {dispos.map((p) => (
              <View key={p.id} style={styles.rondAvecNom}>
                <RondPote prenom={p.prenom} index={index.get(p.id) ?? 0} dispo photo={p.photo} />
                <Text style={styles.nomRond} numberOfLines={1}>
                  {p.prenom}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.aide}>Personne pour l’instant. Mets-toi dispo depuis « À venir ».</Text>
        )}
      </View>

      <View style={styles.bloc}>
        <Text style={styles.titreBloc}>La semaine des potes</Text>
        <View style={styles.grille}>
          <View style={styles.grilleLigne}>
            <View style={styles.grilleNom} />
            {jours.map((j, i) => (
              <Text key={j.nom + i} style={[styles.grilleJour, i === 0 && styles.nomJourAujourdhui]} maxFontSizeMultiplier={1.2}>
                {j.nom}
              </Text>
            ))}
          </View>
          {lignes.map((p) => (
            <View key={p.id} style={styles.grilleLigne}>
              <Text style={styles.grilleNom} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {p.prenom}
              </Text>
              {jours.map((j, i) => {
                const s = sessions.find((x) => x.poteId === p.id && indexDuJour(x.debut) === i);
                if (!s) return <View key={i} style={styles.grilleVide} />;
                const cle = `${p.id}:${s.sessionId}`;
                return (
                  <View key={i} style={styles.flex}>
                    <CaseJour
                      etat={s.organise ? 'organise' : 'inscrit'}
                      sport={s.sport}
                      choisie={choisie === cle}
                      petite
                      onPress={() => setChoisie(choisie === cle ? null : cle)}
                      label={`${p.prenom}, ${s.titre} ${j.nom} à ${heure(s.debut)}`}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        {sessionChoisie && poteChoisi ? (
          <View style={styles.carte}>
            <Text style={styles.ligneTitre}>
              {sessionChoisie.titre} · {quand(sessionChoisie.debut)}
            </Text>
            <Text style={styles.aide}>
              {poteChoisi.prenom} {sessionChoisie.organise ? 'organise' : 'y va'} · {sessionChoisie.lieu} ·{' '}
              {sessionChoisie.jYSuis
                ? 'tu y vas aussi'
                : sessionChoisie.inscrits >= sessionChoisie.joueurs
                  ? 'complet'
                  : accorder(sessionChoisie.joueurs - sessionChoisie.inscrits, 'place', 'places')}
            </Text>
            <Bouton
              titre="Voir la session"
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: sessionChoisie.sessionId } })}
            />
          </View>
        ) : (
          <Text style={styles.aide}>
            {sessions.length ? 'Touche une session pour la voir et la rejoindre.' : 'Tes potes n’ont rien de prévu cette semaine.'}
          </Text>
        )}
      </View>

      <View style={styles.bloc}>
        <Text style={styles.titreBloc}>Mes potes · {potes.length}</Text>
        <View style={styles.listePotes}>
          {potes.map((p: Pote, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Écrire à ${p.prenom}`}
              accessibilityHint="Appui long pour signaler"
              accessibilityActions={[{ name: 'longpress', label: 'Plus d’options' }]}
              onAccessibilityAction={() => optionsPote(p)}
              onPress={() => ecrireA({ autreId: p.id, prenom: p.prenom, connecte: true })}
              onLongPress={() => optionsPote(p)}
              style={styles.rondAvecNom}>
              <RondPote prenom={p.prenom} index={i} photo={p.photo} />
              <Text style={styles.nomRond} numberOfLines={1}>
                {p.prenom}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.aide}>Touche un pote pour lui écrire. Appui long pour signaler.</Text>
      </View>
    </View>
  );
}

/** Appui long sur un pote : lui écrire, signaler sa photo, le signaler */
function optionsPote(p: Pote) {
  vibrer.selection();
  const signalerCible = (cible: 'photo' | 'joueur') =>
    router.push({
      pathname: '/signaler',
      params: {
        cible,
        id: p.id,
        nom: cible === 'photo' ? `La photo de profil de ${p.prenom}` : p.prenom,
        auteur: p.id,
        prenom: p.prenom,
      },
    });
  choisir({
    titre: p.prenom,
    options: [
      { texte: `Écrire à ${p.prenom}`, onPress: () => ecrireA({ autreId: p.id, prenom: p.prenom, connecte: true }) },
      ...(p.photo ? [{ texte: 'Signaler sa photo', destructif: true, onPress: () => signalerCible('photo') }] : []),
      { texte: `Signaler ${p.prenom}`, destructif: !p.photo, onPress: () => signalerCible('joueur') },
    ],
  });
}

/** Onglet Sports : une tuile par sport, et « Ajouter un sport » */
function SectionSports({ traces, sports }: { traces: Trace[]; sports: Sport[] }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const [maintenant] = useState(() => Date.now());
  return (
    <View style={styles.section}>
      <Text style={styles.titreBloc}>Mes sports</Text>
      <View style={styles.tuiles}>
        {sports.map((sport) => {
          const joues = traces.filter((t) => t.sport === sport && t.fin.getTime() <= maintenant).length;
          const prochain = traces
            .filter((t) => t.sport === sport && t.debut.getTime() > maintenant)
            .sort((a, b) => a.debut.getTime() - b.debut.getTime())[0];
          const detail = [joues ? accorder(joues, 'Catch', 'Catchs') : 'Pas encore joué', prochain ? `prochain ${quand(prochain.debut).toLowerCase()}` : null]
            .filter(Boolean)
            .join(' · ');
          return (
            <Pressable
              key={sport}
              accessibilityRole="button"
              accessibilityLabel={`${ficheSport(sport).nom}, ${detail}`}
              onPress={() => router.push('/mes-sports')}
              style={({ pressed }) => [styles.carte, styles.tuile, pressed && styles.presse]}>
              <View style={styles.carrePicto}>
                <PictoSport sport={sport} taille={36} />
              </View>
              <Text style={styles.tuileNom} numberOfLines={1}>
                {ficheSport(sport).nomTuile ?? ficheSport(sport).nom}
              </Text>
              <Text style={styles.aide} numberOfLines={2}>
                {detail}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/mes-sports')}
          style={({ pressed }) => [styles.tuile, styles.tuileAjout, pressed && styles.presse]}>
          <IconeCreer couleur={c.texteSecondaire} taille={26} />
          <Text style={styles.ajoutTexte}>{sports.length ? 'Ajouter un sport' : 'Choisir mes sports'}</Text>
        </Pressable>
      </View>
      <Text style={styles.aide}>La carte peut ne montrer que tes sports : c’est l’étoile, en haut de la carte.</Text>
    </View>
  );
}

function ProfilConnecte({ compte }: { compte: Compte }) {
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ onglet?: string }>();
  const [onglet, setOnglet] = useState<Onglet>('semaine');
  const [ongletDemande, setOngletDemande] = useState<string | undefined>(undefined);
  const [compact, setCompact] = useState(false);
  const [hauteurEntete, setHauteurEntete] = useState(150);
  const { traces, etat } = useHistorique();
  const potes = usePotes();
  const { sports: mesSports } = useMesSports();

  // « Voir mes potes » (après « Tu rejouerais avec qui ? ») ouvre directement l'onglet Potes
  if (params.onglet !== ongletDemande) {
    setOngletDemande(params.onglet);
    if (params.onglet && (ONGLETS as string[]).includes(params.onglet)) setOnglet(params.onglet as Onglet);
  }

  const { aVenir, jouees } = separerTraces(traces);
  const sports = sportsDuProfil(traces, mesSports);
  const nombres: Record<Onglet, number> = {
    semaine: aVenir.filter((t) => indexDuJour(t.debut) >= 0).length,
    catchs: jouees.length,
    potes: potes.potes.length,
    sports: sports.length,
  };

  function defiler(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const replie = e.nativeEvent.contentOffset.y > SEUIL_REPLI;
    if (replie !== compact) setCompact(replie);
  }

  return (
    <View style={[styles.fond, StyleSheet.absoluteFill]}>
      <ScrollView
        onScroll={defiler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contenu, { paddingTop: top + 8 + hauteurEntete + 18 }]}>
        {onglet === 'semaine' && <SectionSemaine traces={traces} potes={potes} semainePotes={potes.semaine} />}
        {onglet === 'catchs' && <SectionCatchs jouees={jouees} etat={etat} />}
        {onglet === 'potes' && <SectionPotes donnees={potes} />}
        {onglet === 'sports' && <SectionSports traces={traces} sports={sports} />}
      </ScrollView>
      <EnteteFlottant
        compte={compte}
        compact={compact}
        onglet={onglet}
        nombres={nombres}
        onChoisir={setOnglet}
        onMesure={setHauteurEntete}
      />
    </View>
  );
}

/** Sans compte : le rond vide, « Me connecter », et le menu (réglages, aide) */
function ProfilInvite() {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  return (
    <Ecran titre="Profil" defile action={<BoutonMenu />}>
      <View style={styles.invite}>
        <View style={styles.rondVide}>
          <IconeProfil couleur={c.texteSecondaire} taille={36} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.ligneTitre}>Ton profil</Text>
          <Text style={styles.aide}>Ta semaine, tes Catchs, tes potes et tes sports.</Text>
        </View>
      </View>
      <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
      <View>
        <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
      </View>
    </Ecran>
  );
}

export default function Profil() {
  const { compte, pret } = useCompte();
  if (!pret) return <Ecran titre="Profil" />;
  if (!compte) return <ProfilInvite />;
  return <ProfilConnecte compte={compte} />;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fond },
    flex: { flex: 1, gap: 2 },
    presse: { opacity: 0.85 },
    contenu: {
      paddingHorizontal: Espaces.marge,
      paddingBottom: RESERVE_BAS + BarreNavigation.margeBas + 24,
      gap: 18,
    },
    aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, lineHeight: 18, color: c.texteSecondaire },

    // L'en-tête flottant
    entete: {
      position: 'absolute',
      left: 12,
      right: 12,
      padding: 12,
      gap: 12,
      borderRadius: 26,
      backgroundColor: c.carte,
      boxShadow: c.ombreFlottante,
    },
    identite: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    identiteTextes: { flex: 1, gap: 2 },
    prenom: { fontFamily: Polices.titre, fontSize: Tailles.titreSession, color: c.encre },
    verifie: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    verifieTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.rougeTexte },
    menu: {
      width: Espaces.cibleTactile,
      height: Espaces.cibleTactile,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.beige,
    },
    monRond: {
      width: 58,
      height: 58,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.creerFin,
      transform: [{ rotate: '-6deg' }],
    },
    monRondPetit: { width: 38, height: 38, borderRadius: 12, transform: [] },
    monRondPhoto: { overflow: 'hidden', backgroundColor: c.beige },
    photo: { width: '100%', height: '100%' },
    rondAvecPhoto: { position: 'relative' },
    badgePhoto: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 26,
      height: 26,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
      borderWidth: 2,
      borderColor: c.carte,
    },
    monRondLettre: { fontFamily: Polices.titre, fontSize: Tailles.titreEcran, color: c.surCreer, transform: [{ rotate: '6deg' }] },
    monRondLettrePetite: { fontSize: Tailles.accent, transform: [] },
    navigation: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    compteurs: { flex: 1, flexDirection: 'row', gap: 4 },
    compteur: {
      flex: 1,
      minHeight: Espaces.cibleTactile,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },
    compteurCompact: { paddingVertical: 3 },
    compteurActif: { backgroundColor: c.rougeDoux },
    compteurNombre: { fontFamily: Polices.titre, fontSize: Tailles.titreMoyen, color: c.encre },
    compteurNombreCompact: { fontSize: Tailles.accent },
    compteurNombreActif: { color: c.rouge },
    compteurNom: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: c.texteSecondaire },
    compteurNomActif: { fontFamily: Polices.texteDemi, color: c.rougeTexte },

    // Les sections
    section: { gap: 18 },
    bloc: { gap: 10 },
    titreBloc: { fontFamily: Polices.titreDemi, fontSize: Tailles.sousTitre, color: c.encre },
    carte: {
      padding: 14,
      gap: 10,
      borderRadius: 18,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    carteVide: { gap: 12 },
    ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ligneTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    carrePicto: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },

    // Action du moment
    question: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: c.orangeDoux,
    },
    questionTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: c.encre },
    questionDetail: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: c.orangeTexte },
    dispo: {
      minHeight: 48,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Rayons.bouton,
      borderWidth: 1,
      borderColor: c.trait,
      backgroundColor: c.carte,
    },
    dispoActif: { backgroundColor: c.orangeDoux, borderColor: c.orangeDoux },
    dispoTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.courant, color: c.encre },
    dispoTexteActif: { color: c.orangeTexte },

    // La semaine
    semaine: { flexDirection: 'row', gap: 5 },
    colonne: { flex: 1, alignItems: 'center', gap: 5 },
    nomJour: { fontFamily: Polices.texte, fontSize: Tailles.pastille, color: c.texteSecondaire },
    nomJourAujourdhui: { fontFamily: Polices.texteDemi, color: c.rouge },
    case: {
      width: '100%',
      height: 84,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    casePetite: { height: 40, borderRadius: 10 },
    caseOrganise: { backgroundColor: c.rouge },
    caseInscrit: { backgroundColor: c.carte, borderWidth: 2, borderColor: c.rouge },
    caseLibre: { borderWidth: 2, borderStyle: 'dashed', borderColor: c.trait },
    caseChoisie: { outlineWidth: 3, outlineColor: c.encre, outlineOffset: 2, outlineStyle: 'solid' },
    drapeau: { position: 'absolute', top: 4, right: 4 },
    casePicto: {
      width: 30,
      height: 30,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rondPicto,
    },
    casePictoPetit: { width: 26, height: 26 },
    caseTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille },
    caseTexteOrganise: { color: c.surRouge },
    caseTexteInscrit: { color: c.rougeTexte },

    // Catchs
    date: { width: 40, alignItems: 'center' },
    dateJour: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.encre },
    dateMois: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille, color: c.texteSecondaire },

    // Potes
    ronds: { gap: 14, paddingVertical: 4 },
    rondAvecNom: { width: 64, alignItems: 'center', gap: 4 },
    nomRond: { fontFamily: Polices.texteDemi, fontSize: Tailles.pastille, color: c.encre },
    rondPote: {
      width: 56,
      height: 56,
      borderRadius: 18,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rondDispo: { outlineWidth: 3, outlineColor: c.orange, outlineOffset: 2, outlineStyle: 'solid' },
    rondPoteTexte: { fontFamily: Polices.titre, fontSize: Tailles.sousTitre, color: c.surAvatar },
    grille: { gap: 5 },
    grilleLigne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    grilleNom: { width: 58, fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    grilleJour: { flex: 1, textAlign: 'center', fontFamily: Polices.texte, fontSize: Tailles.micro, color: c.texteSecondaire },
    grilleVide: { flex: 1, height: 40, borderRadius: 10, backgroundColor: c.beige },
    listePotes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    // Sports
    tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tuile: { width: '48%', flexGrow: 1, minHeight: 150, gap: 8 },
    tuileNom: { fontFamily: Polices.titre, fontSize: Tailles.titreCarte, color: c.encre },
    tuileAjout: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.trait,
      padding: 14,
    },
    ajoutTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.texteSecondaire },

    // Sans compte
    invite: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
    rondVide: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.beige,
    },
  });

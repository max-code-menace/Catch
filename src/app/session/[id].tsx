import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApercuCarte } from '@/components/apercu-carte';
import { Avatars } from '@/components/avatars';
import { BadgeSession } from '@/components/badge-session';
import { Balle } from '@/components/balle';
import { Bouton } from '@/components/bouton';
import { BoutonCatch } from '@/components/bouton-catch';
import {
  IconeCalendrier,
  IconeInfo,
  IconeLieu,
  IconeRetour,
} from '@/components/icones';
import { PictoSport } from '@/components/picto-sport';
import { Couleurs, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import {
  annulationLibre,
  distance,
  estEnDirect,
  placesLibres,
  quandDetail,
  texteDistance,
  texteDuree,
  textePlaces,
} from '@/lib/formats';
import { ouvrirItineraire } from '@/lib/itineraire';
import { useSessions } from '@/lib/sessions';

const HAUTEUR_CARTE = 250;

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

/** Une ligne d'information : icône, titre, précision, et parfois une action à droite. */
function Ligne({
  Icone,
  titre,
  detail,
  children,
}: {
  Icone: Icone;
  titre: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.ligne}>
      <View style={styles.ligneIcone}>
        <Icone couleur={Couleurs.rouge} taille={20} />
      </View>
      <View style={styles.ligneTextes}>
        <Text style={styles.ligneTitre}>{titre}</Text>
        <Text style={styles.aide}>{detail}</Text>
      </View>
      {children}
    </View>
  );
}

export default function DetailSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { sessions, estCatchee, catcher, annuler, origine } = useSessions();
  const session = sessions.find((s) => s.id === id);

  if (!session) return <Redirect href="/" />;

  const catchee = estCatchee(session.id);
  const enDirect = estEnDirect(session);
  const libres = placesLibres(session);
  const nombre = session.inscrits.length;

  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.defilement} showsVerticalScrollIndicator={false}>
        <View style={styles.carte}>
          <ApercuCarte position={session.position} />
        </View>

        <View style={styles.fiche}>
          <BadgeSession session={session} />

          <View style={styles.entete}>
            <View style={styles.picto}>
              <PictoSport sport={session.sport} taille={36} />
            </View>
            <Text accessibilityRole="header" style={styles.titre}>
              {session.titre}
            </Text>
          </View>

          <Text style={styles.organisateur}>Organisée par {session.organisateur}</Text>

          {session.debutantsBienvenus && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>Débutants bienvenus</Text>
            </View>
          )}

          <View style={styles.lignes}>
            <Ligne Icone={IconeCalendrier} titre={quandDetail(session)} detail={texteDuree(session)} />
            <Ligne
              Icone={IconeLieu}
              titre={session.lieu}
              detail={`${session.commune} · ${texteDistance(distance(origine, session.position))}`}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Itinéraire vers ${session.lieu}`}
                onPress={() => ouvrirItineraire(session.position)}
                hitSlop={4}
                style={({ pressed }) => [styles.itineraire, pressed && styles.presse]}>
                <Text style={styles.itineraireTexte}>Itinéraire</Text>
              </Pressable>
            </Ligne>
            {session.aSavoir && (
              <Ligne Icone={IconeInfo} titre={session.aSavoir.titre} detail={session.aSavoir.detail} />
            )}
          </View>

          <View style={styles.places}>
            <View style={styles.ligneTextes}>
              <Text style={[styles.placesTitre, libres === 0 && { color: Couleurs.encre }]}>
                {textePlaces(session)}
              </Text>
              <Text style={styles.aide}>
                {nombre} {enDirect ? 'jouent' : nombre === 1 ? 'inscrit' : 'inscrits'} sur {session.joueurs}
              </Text>
            </View>
            <Avatars initiales={session.inscrits} />
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={retour}
        hitSlop={4}
        style={({ pressed }) => [styles.retour, { top: top + 8 }, pressed && styles.presse]}>
        <IconeRetour couleur={Couleurs.encre} taille={22} />
      </Pressable>

      <View style={[styles.bas, { paddingBottom: Math.max(bottom, 16) }]}>
        {catchee ? (
          <>
            <View style={styles.catchee}>
              <Balle taille={20} />
              <Text style={styles.catcheeTexte}>Tu l’as catchée !</Text>
            </View>
            <Bouton titre="Annuler ma participation" variante="lien" onPress={() => annuler(session)} />
          </>
        ) : (
          <>
            <BoutonCatch
              complet={libres === 0}
              onCatch={() => {
                catcher(session.id);
                router.push({ pathname: '/catchee/[id]', params: { id: session.id } });
              }}
            />
            <Text style={styles.mention}>
              {libres === 0
                ? 'Toutes les places sont prises'
                : annulationLibre(session)
                  ? 'Gratuit · Tu peux annuler jusqu’à 3h avant'
                  : 'Gratuit'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  defilement: { flexGrow: 1 },
  carte: { height: HAUTEUR_CARTE, backgroundColor: Couleurs.beige },
  fiche: {
    flexGrow: 1,
    marginTop: -24,
    paddingHorizontal: Espaces.marge,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: Couleurs.fond,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  picto: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Couleurs.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { flex: 1, fontFamily: Polices.titre, fontSize: 32, lineHeight: 38, color: Couleurs.encre },
  organisateur: { fontFamily: Polices.texte, fontSize: 15, color: Couleurs.texteSecondaire },
  pastille: {
    alignSelf: 'flex-start',
    height: 26,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: Rayons.pilule,
    backgroundColor: Couleurs.beige,
  },
  pastilleTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.pastille, color: Couleurs.texteSecondaire },
  lignes: { gap: 16, paddingVertical: 8 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ligneIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Couleurs.rougeDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ligneTextes: { flex: 1, gap: 2 },
  ligneTitre: { fontFamily: Polices.texteDemi, fontSize: Tailles.texte, color: Couleurs.encre },
  aide: { fontFamily: Polices.texte, fontSize: Tailles.aide, color: Couleurs.texteSecondaire },
  itineraire: {
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Rayons.pilule,
    backgroundColor: Couleurs.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
  },
  itineraireTexte: { fontFamily: Polices.texteDemi, fontSize: 13, color: Couleurs.encre },
  presse: { backgroundColor: Couleurs.beige },
  places: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
  },
  placesTitre: { fontFamily: Polices.titre, fontSize: 20, color: Couleurs.rouge },
  retour: {
    position: 'absolute',
    left: 16,
    width: Espaces.cibleTactile,
    height: Espaces.cibleTactile,
    borderRadius: Rayons.pilule,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Couleurs.carte,
    borderWidth: 1,
    borderColor: Couleurs.trait,
    boxShadow: '0 4px 16px rgba(28, 20, 18, 0.10)',
  },
  bas: {
    paddingHorizontal: Espaces.marge,
    paddingTop: 12,
    gap: 6,
    backgroundColor: Couleurs.fond,
    borderTopWidth: 1,
    borderTopColor: Couleurs.trait,
  },
  mention: {
    paddingVertical: 4,
    textAlign: 'center',
    fontFamily: Polices.texte,
    fontSize: Tailles.aide,
    color: Couleurs.texteSecondaire,
  },
  catchee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 },
  catcheeTexte: { fontFamily: Polices.titre, fontSize: 22, color: Couleurs.encre },
});

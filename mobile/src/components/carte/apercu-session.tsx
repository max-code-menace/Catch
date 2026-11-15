import { Search } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PictoSport } from '@/components/picto-sport';
import { texteDistance } from '@/lib/geo';
import {
  majuscule,
  placesLibres,
  statut,
  texteHeure,
  textePlaces,
  texteQuand,
  titreSession,
  type Session,
} from '@/lib/sessions';
import { useTheme } from '@/theme/theme-context';
import { durees, polices, rayons, tailles } from '@/theme/tokens';

type Props = { session: Session; distanceKm: number | null; bas: number };

// Carte d'aperçu qui apparaît en bas quand on touche une pastille.
export function ApercuSession({ session, distanceKm, bas }: Props) {
  const { c } = useTheme();
  const st = statut(session);
  const libres = placesLibres(session);
  const quand = st === 'direct' ? `Jusqu’à ${texteHeure(session.fin)}` : majuscule(texteQuand(session.debut));

  return (
    <Animated.View
      entering={FadeIn.duration(durees.standard)}
      exiting={FadeOut.duration(durees.fast)}
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: bas,
        padding: 16,
        gap: 8,
        borderRadius: 24,
        backgroundColor: c.carte,
        borderWidth: 1,
        borderColor: c.trait,
        boxShadow: `0 10px 30px ${c.ombre}`,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {st === 'direct' ? (
          <Badge fond={c.rougeDoux} couleur={c.rougeTexte} texte="En direct">
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.rouge }} />
          </Badge>
        ) : st === 'manque' ? (
          <Badge fond={c.orangeDoux} couleur={c.orangeTexte} texte={`Il manque ${libres} ${libres > 1 ? 'joueurs' : 'joueur'}`}>
            <Search size={13} strokeWidth={2.4} color={c.orangeTexte} />
          </Badge>
        ) : (
          <Text style={{ color: c.secondaire, fontFamily: polices.texteMoyen, fontSize: tailles.aide }}>{quand}</Text>
        )}
        <Text style={{ color: c.secondaire, fontFamily: polices.texteMoyen, fontSize: tailles.aide }}>
          {st === 'normal' ? (distanceKm === null ? '' : texteDistance(distanceKm)) : [quand, distanceKm === null ? null : texteDistance(distanceKm)].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PictoSport sport={session.sport} taille={30} />
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          style={{ flex: 1, color: c.encre, fontFamily: polices.titre, fontSize: tailles.titreSession, letterSpacing: -0.3 }}>
          {titreSession(session)}
        </Text>
      </View>

      <Text style={{ color: c.secondaire, fontFamily: polices.texte, fontSize: 14, lineHeight: 20 }}>
        {[session.lieuNom, textePlaces(session), session.debutantsBienvenus ? 'débutants bienvenus' : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </Animated.View>
  );
}

function Badge({ fond, couleur, texte, children }: { fond: string; couleur: string; texte: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: rayons.pilule,
        backgroundColor: fond,
      }}>
      {children}
      <Text style={{ color: couleur, fontFamily: polices.texteDemi, fontSize: tailles.pastille }}>{texte}</Text>
    </View>
  );
}

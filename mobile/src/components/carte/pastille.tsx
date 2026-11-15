import { Search } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { PictoSport } from '@/components/picto-sport';
import { statut, textePastille, type Session } from '@/lib/sessions';
import { useTheme } from '@/theme/theme-context';
import { polices, rayons, tailles } from '@/theme/tokens';

// Pastille d'une session sur la carte.
// Rouge = en direct, orange doux = il manque un ou deux joueurs, neutre = à venir.
// Le statut est toujours écrit dans le texte, jamais porté par la couleur seule.
export function Pastille({ session, choisie }: { session: Session; choisie: boolean }) {
  const { c } = useTheme();
  const st = statut(session);
  const texte = textePastille(session);

  if (st === 'normal') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 30,
          paddingLeft: 4,
          paddingRight: 10,
          borderRadius: rayons.pilule,
          backgroundColor: c.carte,
          borderWidth: choisie ? 2 : 1,
          borderColor: choisie ? c.encre : c.trait,
        }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.rondPicto, alignItems: 'center', justifyContent: 'center' }}>
          <PictoSport sport={session.sport} taille={20} />
        </View>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
          style={{ color: choisie ? c.encre : c.secondaire, fontFamily: polices.texteMoyen, fontSize: tailles.pastille }}>
          {texte}
        </Text>
      </View>
    );
  }

  const direct = st === 'direct';
  const couleurTexte = direct ? c.surRouge : c.orangeTexte;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingLeft: 5,
        paddingRight: 12,
        borderRadius: rayons.pilule,
        backgroundColor: direct ? c.rouge : c.orangeDoux,
        borderWidth: choisie ? 2 : 1.5,
        borderColor: choisie ? c.encre : direct ? c.rouge : c.orange,
      }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.rondPicto, alignItems: 'center', justifyContent: 'center' }}>
        <PictoSport sport={session.sport} taille={20} />
      </View>
      {direct ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: couleurTexte }} />
      ) : (
        <Search size={13} strokeWidth={2.4} color={couleurTexte} />
      )}
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ color: couleurTexte, fontFamily: polices.texteDemi, fontSize: 13 }}>
        {texte}
      </Text>
    </View>
  );
}

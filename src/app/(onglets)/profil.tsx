import { router } from 'expo-router';
import { View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { Aide, Ecran } from '@/components/ecran';
import { useCompte } from '@/lib/compte';

export default function Profil() {
  const { compte, pret, deconnecter } = useCompte();

  if (!pret) return <Ecran titre="Profil" />;

  if (!compte) {
    return (
      <Ecran titre="Profil">
        <Aide>Connecte-toi pour catcher des sessions et retrouver celles qui t’attendent.</Aide>
        <View>
          <Bouton titre="Me connecter" onPress={() => router.push('/connexion')} />
        </View>
      </Ecran>
    );
  }

  return (
    <Ecran titre={compte.prenom ?? 'Profil'}>
      <Aide>Tes sessions à venir et tes réglages s’afficheront ici.</Aide>
      <View>
        <Bouton titre="Me déconnecter" variante="secondaire" onPress={() => deconnecter()} />
      </View>
    </Ecran>
  );
}

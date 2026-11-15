import { Ecran } from '@/components/ecran';
import { Aide, Texte, Titre } from '@/components/texte';

export default function Messages() {
  return (
    <Ecran>
      <Titre>Messages</Titre>
      <Texte secondaire>Une conversation par session que tu as catchée.</Texte>
      <Aide>Étape 9 du plan de construction.</Aide>
    </Ecran>
  );
}

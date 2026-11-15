import { Ecran } from '@/components/ecran';
import { Aide, Texte, Titre } from '@/components/texte';

export default function Creer() {
  return (
    <Ecran>
      <Titre>Créer une session</Titre>
      <Texte secondaire>Sport, quand, où : trois choix et c’est publié.</Texte>
      <Aide>Étape 6 du plan de construction.</Aide>
    </Ecran>
  );
}

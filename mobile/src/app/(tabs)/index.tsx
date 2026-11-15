import { Ecran } from '@/components/ecran';
import { Aide, Texte, Titre } from '@/components/texte';

export default function Carte() {
  return (
    <Ecran>
      <Titre>Carte</Titre>
      <Texte secondaire>Les sessions près de toi s’afficheront ici.</Texte>
      <Aide>Étape 2 du plan de construction.</Aide>
    </Ecran>
  );
}

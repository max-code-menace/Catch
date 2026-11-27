import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Paragraphe, Partie } from '@/components/texte-legal';

/** Conseils pour retrouver des inconnus. Proposés au premier Catch, puis toujours dans Profil. */
export default function Securite() {
  return (
    <EcranSecondaire titre="Jouer en sécurité">
      <Partie titre="Avant">
        <Paragraphe>
          On se retrouve dans un lieu public : terrain, salle, parc. Envoie le lien de la session à un proche avec
          « Inviter ». Ton numéro, tu le gardes : on parle dans le groupe de la session.
        </Paragraphe>
      </Partie>

      <Partie titre="Sur place">
        <Paragraphe>Tu peux partir quand tu veux, sans rien expliquer.</Paragraphe>
      </Partie>

      <Partie titre="Si ça se passe mal">
        <Paragraphe>
          Signale la session ou le message, puis bloque la personne : elle ne pourra plus rejoindre tes sessions.
          On lit chaque signalement. Urgence : 112.
        </Paragraphe>
      </Partie>
    </EcranSecondaire>
  );
}

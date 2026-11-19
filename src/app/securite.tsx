import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Paragraphe, Partie } from '@/components/texte-legal';

/** Conseils pour retrouver des inconnus. Proposés au premier Catch, puis toujours dans Profil. */
export default function Securite() {
  return (
    <EcranSecondaire titre="Jouer en sécurité">
      <Paragraphe>
        Sur Catch, tu retrouves des gens que tu ne connais pas encore. Quelques réflexes simples, pour que tu ne
        penses plus qu’au match.
      </Paragraphe>

      <Partie titre="Un lieu public">
        <Paragraphe>
          Un terrain, une salle, un parc fréquenté. Pas de rendez-vous chez quelqu’un. Si tu organises, choisis un
          endroit facile à trouver.
        </Paragraphe>
      </Partie>

      <Partie titre="Préviens un proche">
        <Paragraphe>
          Dis-lui où tu vas, à quelle heure et avec qui. Le plus simple : lui envoyer le lien de la session avec
          « Inviter ».
        </Paragraphe>
      </Partie>

      <Partie titre="Garde ton numéro pour toi">
        <Paragraphe>
          Écris au groupe dans Catch. Tu n’as pas besoin de donner ton numéro ou ton adresse avant d’avoir joué
          ensemble.
        </Paragraphe>
      </Partie>

      <Partie titre="Écoute ton instinct">
        <Paragraphe>
          Si quelque chose te met mal à l’aise, tu peux partir quand tu veux, sans te justifier. Annuler ta
          participation reste possible depuis la session.
        </Paragraphe>
      </Partie>

      <Partie titre="Joue à ton niveau">
        <Paragraphe>Échauffe-toi, prends de l’eau et arrête si tu as mal. Personne ne t’en voudra.</Paragraphe>
      </Partie>

      <Partie titre="Si ça se passe mal">
        <Paragraphe>
          Signale la session ou le message depuis l’app, et bloque la personne : tu ne verras plus ses sessions ni ses messages, et elle ne pourra plus
          rejoindre les tiennes. On
          lit chaque signalement. En cas d’urgence, appelle le 112.
        </Paragraphe>
      </Partie>
    </EcranSecondaire>
  );
}

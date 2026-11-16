import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Paragraphe, Partie } from '@/components/texte-legal';
import { EMAIL_CONTACT } from '@/constants/liens';

/** Conditions d'utilisation. Aussi lisibles sans l'app, à l'adresse /conditions du site. */
export default function Conditions() {
  return (
    <EcranSecondaire titre="Conditions d’utilisation">
      <Paragraphe>
        Catch met en relation des personnes qui veulent faire du sport ensemble. L’app est gratuite. En créant un
        compte, tu acceptes ce qui suit. Dernière mise à jour : 16 novembre 2026.
      </Paragraphe>

      <Partie titre="Ce que tu peux attendre de Catch">
        <Paragraphe>
          Catch affiche les sessions proposées par ses utilisateurs et te permet de t’y inscrire et d’écrire au
          groupe. Catch n’organise pas les sessions, ne loue pas les terrains et ne vérifie pas l’identité des
          participants.
        </Paragraphe>
      </Partie>

      <Partie titre="Ce qu’on attend de toi">
        <Paragraphe>
          Tu as 16 ans ou plus. Tu utilises ton vrai prénom. Tu ne crées que des sessions qui auront vraiment lieu,
          dans un endroit où on a le droit de jouer.
        </Paragraphe>
        <Paragraphe>
          Si tu ne peux plus venir, tu annules ta participation pour libérer ta place. Si tu organises et que la
          session n’a plus lieu, tu l’annules : les inscrits sont prévenus.
        </Paragraphe>
        <Paragraphe>
          Pas d’insultes, de harcèlement, de propos haineux ou à caractère sexuel, de publicité ni de demande
          d’argent, dans les sessions comme dans les messages.
        </Paragraphe>
      </Partie>

      <Partie titre="Ta sécurité">
        <Paragraphe>
          Tu rencontres des personnes que tu ne connais pas : privilégie les lieux publics et préviens un proche. Tu
          fais du sport sous ta propre responsabilité, selon ta condition physique. En cas d’urgence, appelle le 112.
        </Paragraphe>
        <Paragraphe>
          Tu peux signaler une session ou un message, et bloquer une personne, à tout moment depuis l’app.
        </Paragraphe>
      </Partie>

      <Partie titre="Si ça se passe mal">
        <Paragraphe>
          On lit chaque signalement. On peut retirer une session ou un message, et fermer le compte de quelqu’un qui
          ne respecte pas ces règles.
        </Paragraphe>
      </Partie>

      <Partie titre="Ton compte">
        <Paragraphe>
          Tu peux supprimer ton compte quand tu veux, depuis Profil. L’usage de tes données est décrit dans la page
          Confidentialité.
        </Paragraphe>
      </Partie>

      <Partie titre="Nous écrire">
        <Paragraphe>
          {EMAIL_CONTACT ? `Une question, un problème : ${EMAIL_CONTACT}.` : 'Une question, un problème : écris-nous depuis Profil.'}{' '}
          Ces conditions relèvent du droit belge.
        </Paragraphe>
      </Partie>
    </EcranSecondaire>
  );
}

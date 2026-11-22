import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Paragraphe, Partie } from '@/components/texte-legal';
import { EDITEUR, EMAIL_CONTACT } from '@/constants/liens';

/**
 * Politique de confidentialité. Aussi lisible sans l'app, à l'adresse /confidentialite du site.
 * Si l'app se met à collecter autre chose, ce texte doit changer en même temps.
 */
export default function Confidentialite() {
  return (
    <EcranSecondaire titre="Confidentialité">
      <Paragraphe>
        Catch sert à trouver des sessions de sport près de chez toi et à y retrouver des gens. On garde le strict
        nécessaire pour ça, on ne vend rien et il n’y a pas de publicité. Dernière mise à jour : 20 novembre 2026.
      </Paragraphe>

      <Partie titre="Qui édite Catch">
        <Paragraphe>
          Catch est édité par {EDITEUR}, à titre personnel. Catch n’est pas une entreprise et n’a pas de numéro BCE
          pour l’instant.{EMAIL_CONTACT ? ` Contact : ${EMAIL_CONTACT}.` : ''} L’adresse postale sera ajoutée ici avant
          la publication sur l’App Store et Google Play. C’est lui le responsable de tes données.
        </Paragraphe>
      </Partie>

      <Partie titre="Ce qu’on garde">
        <Paragraphe>
          Ton adresse e-mail, pour te connecter avec un code (ou ton identifiant Apple si tu te connectes avec Apple).
          Elle n’est jamais montrée aux autres.
        </Paragraphe>
        <Paragraphe>
          Ton prénom. Quand tu organises une session, il est visible de tous sur la carte. Quand tu t’inscris à une
          session, seules ses deux premières lettres s’affichent. Dans une conversation, ton prénom apparaît à côté
          de tes messages.
        </Paragraphe>
        <Paragraphe>
          Les sessions que tu crées (sport, lieu, horaire) et celles où tu t’inscris. Les sessions sont visibles de
          tous sur la carte, même sans compte.
        </Paragraphe>
        <Paragraphe>
          Tes messages. Ceux d’un groupe sont lisibles seulement par les inscrits de la session concernée ; un
          message privé, seulement par la personne à qui tu l’écris.
        </Paragraphe>
        <Paragraphe>
          Si tu actives les notifications : un identifiant de ton téléphone qui permet de te les envoyer, tes réglages,
          et le centre approximatif de ta zone pour ne te prévenir que des sessions proches.
        </Paragraphe>
        <Paragraphe>Tes signalements et la liste des personnes que tu as bloquées.</Paragraphe>
      </Partie>

      <Partie titre="Ta position">
        <Paragraphe>
          Ta position sert à centrer la carte et à calculer les distances. Elle reste sur ton téléphone : on ne
          l’enregistre pas et on ne suit pas tes déplacements. Le lieu d’une session que tu crées, lui, est public :
          c’est toi qui le places sur la carte.
        </Paragraphe>
        <Paragraphe>
          Les terrains et les salles de la carte viennent de chez nous : les afficher n’envoie rien sur toi. Le
          bouton « Site » d’une salle ouvre son site, qui a ses propres règles de confidentialité.
        </Paragraphe>
      </Partie>

      <Partie titre="Où sont tes données">
        <Paragraphe>
          Elles sont hébergées dans l’Union européenne (Francfort) chez Supabase. Les notifications passent par les
          services d’Expo, d’Apple et de Google, qui reçoivent le texte de la notification et l’identifiant de ton
          téléphone. Il n’y a ni outil de mesure d’audience ni traceur publicitaire dans l’app.
        </Paragraphe>
      </Partie>

      <Partie titre="Combien de temps">
        <Paragraphe>
          Tant que ton compte existe. Tu peux le supprimer à tout moment dans Profil, ou sur la page « Supprimer mon
          compte » du site : ton prénom, tes participations, tes messages, tes réglages et les sessions que tu
          organises sont effacés. Un signalement que tu as envoyé est conservé sans ton nom, le temps de le traiter.
        </Paragraphe>
        <Paragraphe>
          Une session et sa conversation sont effacées 30 jours après la fin de la session (7 jours si elle a été
          annulée), sauf si un signalement est en cours de traitement. Les messages privés restent tant que vos deux
          comptes existent. L’identifiant d’un téléphone qui ne reçoit plus les notifications est oublié.
        </Paragraphe>
      </Partie>

      <Partie titre="Tes droits">
        <Paragraphe>
          Tu peux demander à voir tes données, les faire corriger ou effacer, ou t’opposer à leur utilisation
          {EMAIL_CONTACT ? ` : écris-nous à ${EMAIL_CONTACT}` : ' : écris-nous depuis Profil'}. On répond dans le
          mois. Si la réponse ne te convient pas, tu peux t’adresser à l’Autorité de protection des données
          (autoriteprotectiondonnees.be).
        </Paragraphe>
      </Partie>

      <Partie titre="Âge">
        <Paragraphe>
          Catch est réservé aux personnes de 18 ans et plus. Si on apprend qu’un compte appartient à une personne de
          moins de 18 ans, on le supprime avec ses données.
        </Paragraphe>
      </Partie>
    </EcranSecondaire>
  );
}

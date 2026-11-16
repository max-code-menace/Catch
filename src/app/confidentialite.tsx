import { EcranSecondaire } from '@/components/ecran-secondaire';
import { Paragraphe, Partie } from '@/components/texte-legal';
import { EMAIL_CONTACT } from '@/constants/liens';

/**
 * Politique de confidentialité. Aussi lisible sans l'app, à l'adresse /confidentialite du site.
 * Si l'app se met à collecter autre chose, ce texte doit changer en même temps.
 */
export default function Confidentialite() {
  return (
    <EcranSecondaire titre="Confidentialité">
      <Paragraphe>
        Catch sert à trouver des sessions de sport près de chez toi et à y retrouver des gens. On garde le strict
        nécessaire pour ça, on ne vend rien et il n’y a pas de publicité. Dernière mise à jour : 16 novembre 2026.
      </Paragraphe>

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
          Tes messages, lisibles seulement par les inscrits de la session concernée.
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
        <Paragraphe>Catch s’adresse aux personnes de 16 ans et plus.</Paragraphe>
      </Partie>
    </EcranSecondaire>
  );
}

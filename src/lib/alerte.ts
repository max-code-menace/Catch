// Messages et questions du système. `Alert` ne fait rien dans un navigateur :
// sur le web (page d'invitation) on passe par les fenêtres du navigateur, pour que rien ne reste muet.
import { Alert, Platform } from 'react-native';

/** Un message à lire, avec un seul bouton. */
export function prevenir(titre: string, texte: string) {
  if (Platform.OS === 'web') {
    window.alert(`${titre}\n\n${texte}`);
    return;
  }
  Alert.alert(titre, texte);
}

/** Une question avec deux réponses. */
export function demander({
  titre,
  texte,
  confirmer,
  refuser = 'Annuler',
  destructif = false,
  onConfirmer,
  onRefuser,
}: {
  titre: string;
  texte: string;
  confirmer: string;
  /** Le bouton qui ne fait rien : « Annuler », ou « Je viens » quand « Annuler » prêterait à confusion */
  refuser?: string;
  destructif?: boolean;
  onConfirmer: () => void;
  /** Appelé quand on répond non (utile pour attendre la réponse) */
  onRefuser?: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titre}\n\n${texte}`)) onConfirmer();
    else onRefuser?.();
    return;
  }
  Alert.alert(titre, texte, [
    { text: refuser, style: 'cancel', onPress: onRefuser },
    { text: confirmer, style: destructif ? 'destructive' : 'default', onPress: onConfirmer },
  ]);
}

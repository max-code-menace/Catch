// Messages et questions du système. `Alert` ne fait rien dans un navigateur :
// sur le web (page d'invitation) on passe par les fenêtres du navigateur, pour que rien ne reste muet.
import { ActionSheetIOS, Alert, Platform } from 'react-native';

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

/** Une liste d'actions (feuille d'actions d'iOS, boîte de dialogue ailleurs). */
export function choisir({
  titre,
  options,
  couleur,
}: {
  titre: string;
  options: { texte: string; destructif?: boolean; onPress: () => void }[];
  /** Couleur des boutons de la feuille iOS */
  couleur?: string;
}) {
  if (Platform.OS === 'web') {
    // Pas de menu sur le web : une question par action, la première acceptée gagne
    const choisie = options.length === 1 ? options[0] : options.find((o) => window.confirm(`${o.texte} ?`));
    choisie?.onPress();
    return;
  }
  if (Platform.OS === 'ios') {
    const destructif = options.findIndex((o) => o.destructif);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: titre,
        options: [...options.map((o) => o.texte), 'Fermer'],
        destructiveButtonIndex: destructif >= 0 ? destructif : undefined,
        cancelButtonIndex: options.length,
        tintColor: couleur,
      },
      (i) => options[i]?.onPress(),
    );
    return;
  }
  Alert.alert(titre, undefined, [
    ...options.map((o) => ({
      text: o.texte,
      style: o.destructif ? ('destructive' as const) : ('default' as const),
      onPress: o.onPress,
    })),
    { text: 'Fermer', style: 'cancel' as const },
  ]);
}

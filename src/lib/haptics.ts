// Toutes les vibrations de l'app passent par ici (voir docs/design-system.md).
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let actives = true;

/** Réglage « Vibrations » du profil. */
export function reglerVibrations(valeur: boolean) {
  actives = valeur;
}

function jouer(ios: () => Promise<void>, android: Haptics.AndroidHaptics) {
  if (!actives || Platform.OS === 'web') return;
  const action =
    Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(android) : ios();
  action.catch(() => {});
}

export const vibrer = {
  /** Pastille, filtre, stepper */
  selection: () => jouer(() => Haptics.selectionAsync(), Haptics.AndroidHaptics.Segment_Tick),
  /** Appui sur Catch */
  appuiCatch: () =>
    jouer(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      Haptics.AndroidHaptics.Virtual_Key,
    ),
  /** Catch confirmé, session publiée */
  succes: () =>
    jouer(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      Haptics.AndroidHaptics.Confirm,
    ),
  /** Session complète, butée */
  avertissement: () =>
    jouer(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      Haptics.AndroidHaptics.Reject,
    ),
  erreur: () =>
    jouer(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      Haptics.AndroidHaptics.Reject,
    ),
};

// Seul endroit de l'app qui déclenche une vibration (voir docs/design-system.md).
// Jamais au scroll, aux onglets, à la frappe ou à la réception d'un message.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type Vibration = 'selection' | 'catch' | 'succes' | 'avertissement' | 'erreur';

const CLE = 'catch.vibrations';
let actives = true;

AsyncStorage.getItem(CLE)
  .then((v) => {
    if (v === '0') actives = false;
  })
  .catch(() => {});

export function vibrationsActives() {
  return actives;
}

export function reglerVibrations(oui: boolean) {
  actives = oui;
  AsyncStorage.setItem(CLE, oui ? '1' : '0').catch(() => {});
}

const android: Record<Vibration, Haptics.AndroidHaptics> = {
  selection: Haptics.AndroidHaptics.Segment_Tick,
  catch: Haptics.AndroidHaptics.Virtual_Key,
  succes: Haptics.AndroidHaptics.Confirm,
  avertissement: Haptics.AndroidHaptics.Reject,
  erreur: Haptics.AndroidHaptics.Reject,
};

export function vibrer(type: Vibration) {
  if (!actives || Platform.OS === 'web') return;
  const fait =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(android[type])
      : type === 'selection'
        ? Haptics.selectionAsync()
        : type === 'catch'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          : Haptics.notificationAsync(
              type === 'succes'
                ? Haptics.NotificationFeedbackType.Success
                : type === 'avertissement'
                  ? Haptics.NotificationFeedbackType.Warning
                  : Haptics.NotificationFeedbackType.Error,
            );
  fait.catch(() => {});
}

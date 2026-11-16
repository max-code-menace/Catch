import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useCompte } from '@/lib/compte';
import {
  ACTION_PEUX_PLUS,
  ACTION_VIENS,
  activerNotifications,
  preparerNotifications,
} from '@/lib/notifications';
import { useMessages } from '@/lib/messages';
import { useSessions } from '@/lib/sessions';

/**
 * Ne dessine rien : rattache le téléphone au compte connecté, et réagit quand on touche une notification
 * (ouvrir la session, ou « Je ne peux plus » qui annule la participation).
 */
export function GestionNotifications() {
  const { compte } = useCompte();
  const { annulerParId } = useSessions();
  const idCompte = compte?.id;

  // Déjà autorisées : on garde le jeton du téléphone à jour, sans rien demander
  useEffect(() => {
    if (idCompte) activerNotifications(false);
  }, [idCompte]);

  const { recharger } = useMessages();
  const annuler = useRef(annulerParId);
  const relire = useRef(recharger);
  useEffect(() => {
    annuler.current = annulerParId;
    relire.current = recharger;
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    preparerNotifications();

    function reagir(reponse: Notifications.NotificationResponse) {
      const { session, type } = reponse.notification.request.content.data ?? {};
      if (typeof session !== 'string') return;
      // Nouveau message : on ouvre la conversation
      if (type === 'message') {
        router.push({ pathname: '/messages/[id]', params: { id: session } });
        return;
      }
      // « Je viens » : rien à faire, la place est gardée
      if (reponse.actionIdentifier === ACTION_VIENS) return;
      router.push({ pathname: '/session/[id]', params: { id: session } });
      if (reponse.actionIdentifier === ACTION_PEUX_PLUS) annuler.current(session);
    }

    // L'app a été ouverte en touchant une notification
    const derniere = Notifications.getLastNotificationResponse();
    if (derniere) {
      Notifications.clearLastNotificationResponse();
      reagir(derniere);
    }
    const ecoute = Notifications.addNotificationResponseReceivedListener(reagir);
    // Une notification arrive pendant que l'app est ouverte : les non lus se mettent à jour
    const reception = Notifications.addNotificationReceivedListener(() => relire.current());
    return () => {
      ecoute.remove();
      reception.remove();
    };
  }, []);

  return null;
}

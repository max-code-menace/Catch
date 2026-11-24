import { router } from 'expo-router';
import { useEffect } from 'react';

/**
 * Adresse de retour de « Continuer avec Google » (catch://connexion-google).
 * Sur iPhone, la fenêtre de Google la récupère elle-même et cet écran ne s'ouvre jamais.
 * Sur Android, le système rouvre l'app sur cette adresse : on revient tout de suite à l'écran
 * de connexion, qui finit le travail.
 */
export default function RetourGoogle() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return null;
}

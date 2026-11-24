// Lecture de l'adresse par laquelle Supabase renvoie vers l'app après « Continuer avec Google ».
// Calcul pur (aucune dépendance), testé par tests/retour-connexion.test.mjs.

export type RetourConnexion =
  | { type: 'jetons'; accessToken: string; refreshToken: string }
  | { type: 'erreur'; code: string }
  | { type: 'vide' };

/**
 * Supabase met les jetons après le `#` (`…#access_token=…&refresh_token=…`), et une erreur
 * soit après le `#`, soit après le `?` (`…?error=access_denied&error_description=…`).
 */
export function lireRetourConnexion(adresse: string): RetourConnexion {
  const valeurs = new Map<string, string>();
  const diese = adresse.indexOf('#');
  const question = adresse.indexOf('?');
  const morceaux: string[] = [];
  if (question !== -1) morceaux.push(adresse.slice(question + 1, diese > question ? diese : undefined));
  if (diese !== -1) morceaux.push(adresse.slice(diese + 1));
  for (const morceau of morceaux) {
    for (const paire of morceau.split('&')) {
      if (!paire) continue;
      const egal = paire.indexOf('=');
      const cle = decoder(egal === -1 ? paire : paire.slice(0, egal));
      const valeur = egal === -1 ? '' : decoder(paire.slice(egal + 1));
      valeurs.set(cle, valeur);
    }
  }
  const erreur = valeurs.get('error_code') || valeurs.get('error');
  if (erreur) return { type: 'erreur', code: erreur };
  const accessToken = valeurs.get('access_token');
  const refreshToken = valeurs.get('refresh_token');
  if (accessToken && refreshToken) return { type: 'jetons', accessToken, refreshToken };
  return { type: 'vide' };
}

function decoder(texte: string) {
  try {
    return decodeURIComponent(texte.replace(/\+/g, ' '));
  } catch {
    return texte;
  }
}

/** Le prénom à garder depuis le nom donné par Google (« Maxime Dupont » → « Maxime »). */
export function prenomDepuisNom(nom: unknown): string | null {
  if (typeof nom !== 'string') return null;
  const premier = nom.trim().split(/\s+/)[0] ?? '';
  return premier.length >= 2 ? premier.slice(0, 30) : null;
}

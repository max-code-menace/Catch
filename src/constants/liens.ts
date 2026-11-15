// Adresse du site de Catch : c'est la version web de l'app, hébergée chez Expo.
// Une invitation est un lien vers la page d'une session, lisible sans installer l'app.
export const SITE = 'https://catch-sport.expo.app';

export function lienSession(id: string) {
  return `${SITE}/session/${id}`;
}

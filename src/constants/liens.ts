// Adresse du site de Catch : c'est la version web de l'app, hébergée chez Expo.
// Une invitation est un lien vers la page d'une session, lisible sans installer l'app.
export const SITE = 'https://catch-sport.expo.app';

export function lienSession(id: string) {
  return `${SITE}/session/${id}`;
}

// Adresse pour nous écrire (affichée dans Profil). Vide : la ligne « Nous contacter » est masquée. Provisoire, à remplacer par une adresse dédiée avant les stores.
// À renseigner avant la publication sur les stores : le contact doit être visible.
export const EMAIL_CONTACT = 'drauxmaxime@gmail.com';

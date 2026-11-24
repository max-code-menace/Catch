// Complète app.json (qui reste la référence) avec ce qui ne doit pas être écrit dans le dépôt.
// La clé Google Maps d'Android est rangée dans les variables d'environnement du projet sur expo.dev
// (nom : GOOGLE_MAPS_ANDROID_KEY, environnements preview et production). Sans elle, rien ne change :
// Expo Go et l'iPhone (Apple Plans) n'en ont pas besoin.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY }],
  ],
});

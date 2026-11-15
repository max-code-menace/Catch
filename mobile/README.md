# Catch — l'app

App Expo (SDK 58) de Catch. Le contexte produit est dans `../docs/`.

## Lancer l'app sur ton téléphone

```
cd mobile
npm install
npx expo start
```

Puis scanne le QR code avec l'app **Expo Go** (Android) ou l'appareil photo (iPhone).

## Où est quoi

- `src/app/` : les écrans (un fichier = un écran). `(tabs)/` contient les 4 onglets.
- `src/components/` : les briques réutilisées (barre flottante, textes, bouton pressable).
- `src/theme/` : couleurs clair et sombre, polices, ressorts. Aucune couleur en dur ailleurs.
- `src/lib/haptics.ts` : le seul endroit qui déclenche une vibration.

## Vérifier avant d'enregistrer

```
npx tsc --noEmit
npx expo lint
```

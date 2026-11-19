// Fabrique l'icône de l'app, l'écran de démarrage et le favicon à partir du logo.
// Lancer depuis la racine : node scripts/generer_icones.mjs
// Source : design/logo/logo-catch.png (logo détouré). Résultat : assets/images/.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// jimp-compact est déjà installé avec Expo (il sert à ses propres outils d'images)
const Jimp = require('jimp-compact');

const LOGO = 'design/logo/logo-catch.png';
const SORTIE = 'assets/images/';

// Dégradé orange → rouge du logo, en diagonale
const HAUT = [0xff, 0x6a, 0x00];
const BAS = [0xe8, 0x24, 0x1a];

function degrade(taille) {
  const image = new Jimp(taille, taille);
  image.scan(0, 0, taille, taille, (x, y, k) => {
    const t = (x + y) / (2 * (taille - 1));
    for (let i = 0; i < 3; i++) image.bitmap.data[k + i] = Math.round(HAUT[i] + (BAS[i] - HAUT[i]) * t);
    image.bitmap.data[k + 3] = 255;
  });
  return image;
}

/** Le logo tout en blanc (on garde seulement sa forme) */
function enBlanc(logo) {
  const copie = logo.clone();
  copie.scan(0, 0, copie.bitmap.width, copie.bitmap.height, (x, y, k) => {
    copie.bitmap.data[k] = 255;
    copie.bitmap.data[k + 1] = 255;
    copie.bitmap.data[k + 2] = 255;
  });
  return copie;
}

/** Pose le logo au centre d'un carré, sur `largeur` × la taille du carré */
function centrer(fond, logo, largeur) {
  const taille = fond.bitmap.width;
  const l = Math.round(taille * largeur);
  const petit = logo.clone().resize(l, Jimp.AUTO, Jimp.RESIZE_BICUBIC);
  fond.composite(petit, Math.round((taille - l) / 2), Math.round((taille - petit.bitmap.height) / 2));
  return fond;
}

const vide = (taille) => new Jimp(taille, taille, 0x00000000);

const logo = await Jimp.read(LOGO);
const blanc = enBlanc(logo);

// iPhone et site : carré orange, logo blanc
await centrer(degrade(1024), blanc, 0.8).writeAsync(SORTIE + 'icon.png');
await centrer(degrade(1024), blanc, 0.8).resize(48, 48, Jimp.RESIZE_BICUBIC).writeAsync(SORTIE + 'favicon.png');

// Android : le système découpe l'icône (rond, carré arrondi…), le logo reste dans le cercle central
await degrade(1024).writeAsync(SORTIE + 'android-icon-background.png');
await centrer(vide(1024), blanc, 0.6).writeAsync(SORTIE + 'android-icon-foreground.png');
await centrer(vide(1024), blanc, 0.6).writeAsync(SORTIE + 'android-icon-monochrome.png');

// Écran de démarrage : le logo en couleurs, sur le fond clair ou sombre de l'app
await centrer(vide(1024), logo, 1).writeAsync(SORTIE + 'splash-icon.png');

console.log('Icônes écrites dans ' + SORTIE);

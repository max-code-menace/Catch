// Design system de Catch. Référence : docs/design-system.md

// Deux palettes : claire et sombre. Aucune couleur n'est écrite en dur dans un écran,
// tout passe par useCouleurs() ou useStyles() (src/lib/theme.tsx).
export const Palettes = {
  clair: {
    rouge: '#C8361C',
    /** Texte et icônes posés sur le rouge */
    surRouge: '#FFFFFF',
    rougeTexte: '#A12A14',
    rougeDoux: '#FCE6E0',
    rougeBordure: '#E9A58F',
    /** Tranche sous les boutons rouges : le bouton s'y enfonce sous le doigt */
    rougeTranche: '#8F2410',
    orange: '#E35A0C',
    orangeTexte: '#863404',
    orangeDoux: '#FDE6D2',
    /** Bouton « Créer » au-dessus de la barre : dégradé orange vers rouge, bien voyant */
    creerDebut: '#F26A1B',
    creerFin: '#D9361A',
    surCreer: '#FFFFFF',
    encre: '#1C1412',
    /** Texte posé sur un fond couleur encre (filtre actif, toast) */
    surEncre: '#FFFFFF',
    surEncreDoux: 'rgba(255, 255, 255, 0.14)',
    texteSecondaire: '#6E625C',
    fond: '#FBF8F5',
    carte: '#FFFFFF',
    trait: '#E8DFD7',
    beige: '#F3EDE8',
    /** Rond blanc derrière les pictos : blanc dans les deux thèmes */
    rondPicto: '#FFFFFF',
    /** Texte des avatars, posés sur des teintes claires dans les deux thèmes */
    surAvatar: '#1C1412',
    /** Fonds des avatars (initiales des inscrits), utilisés à tour de rôle */
    avatar1: '#F5C3B5',
    avatar2: '#FAD9B8',
    avatar3: '#EFC9A4',
    avatar4: '#E9D5C6',
    /** Reflet clair sur la balle orange */
    refletBalle: 'rgba(255, 255, 255, 0.4)',
    /** Fond de secours quand il n'y a pas de vraie carte (navigateur) */
    fondCarte: '#EFE9E2',
    /** Fond assombri derrière une feuille ouverte par-dessus la carte */
    voile: 'rgba(28, 20, 18, 0.38)',
    /** Ombres (boxShadow) : petite (pastilles, boutons sur la carte), normale (en-têtes), flottante (barre, fiches), vers le haut (panneaux du bas), forte (toast) */
    ombrePetite: '0 2px 8px rgba(28, 20, 18, 0.14)',
    ombre: '0 4px 16px rgba(28, 20, 18, 0.10)',
    ombreFlottante: '0 8px 24px rgba(28, 20, 18, 0.14)',
    ombreVersHaut: '0 -6px 24px rgba(28, 20, 18, 0.12)',
    ombreForte: '0 8px 24px rgba(28, 20, 18, 0.24)',
  },
  sombre: {
    rouge: '#E8553A',
    surRouge: '#1C1412',
    rougeTexte: '#FFB4A3',
    rougeDoux: '#3A1D16',
    rougeBordure: '#7A3A2A',
    rougeTranche: '#9E3523',
    orange: '#FF8A3D',
    orangeTexte: '#FFC08F',
    orangeDoux: '#3B2410',
    creerDebut: '#FF7A33',
    creerFin: '#E8432A',
    surCreer: '#FFFFFF',
    encre: '#F5EEE9',
    surEncre: '#1C1412',
    surEncreDoux: 'rgba(28, 20, 18, 0.10)',
    texteSecondaire: '#A99C94',
    fond: '#14100E',
    carte: '#211B18',
    trait: '#3A312C',
    beige: '#2A2320',
    rondPicto: '#FFFFFF',
    surAvatar: '#1C1412',
    // Un peu moins lumineux qu'en clair pour ne pas éblouir sur fond sombre ; le texte foncé reste très lisible
    avatar1: '#E3AE9F',
    avatar2: '#E6C29F',
    avatar3: '#D9B48F',
    avatar4: '#CFBCAD',
    refletBalle: 'rgba(255, 255, 255, 0.4)',
    fondCarte: '#1B1614',
    voile: 'rgba(0, 0, 0, 0.55)',
    // Sur fond sombre, une ombre doit être noire et plus marquée pour se voir
    ombrePetite: '0 2px 8px rgba(0, 0, 0, 0.40)',
    ombre: '0 4px 16px rgba(0, 0, 0, 0.35)',
    ombreFlottante: '0 8px 24px rgba(0, 0, 0, 0.45)',
    ombreVersHaut: '0 -6px 24px rgba(0, 0, 0, 0.40)',
    ombreForte: '0 8px 24px rgba(0, 0, 0, 0.55)',
  },
} as const;

export type Theme = keyof typeof Palettes;
export type Palette = { [K in keyof typeof Palettes.clair]: string };

// Les noms correspondent aux polices chargées dans src/app/_layout.tsx
export const Polices = {
  titre: 'BricolageGrotesque_700Bold',
  titreDemi: 'BricolageGrotesque_600SemiBold',
  texte: 'Inter_400Regular',
  texteMoyen: 'Inter_500Medium',
  texteDemi: 'Inter_600SemiBold',
} as const;

// Échelle des tailles de texte. Aucun fontSize écrit en chiffres dans un écran.
export const Tailles = {
  /** Pastilles de compteur, initiales des avatars */
  minuscule: 10,
  /** Libellés de la barre d'onglets */
  micro: 11,
  pastille: 12,
  aide: 13,
  petit: 14,
  courant: 15,
  texte: 16,
  accent: 17,
  titreCarte: 19,
  sousTitre: 20,
  titreMoyen: 22,
  titreSession: 24,
  titreEcran: 28,
  grandNombre: 30,
  titreDetail: 32,
  celebration: 36,
} as const;

export const Espaces = {
  marge: 20,
  cibleTactile: 44,
} as const;

export const Rayons = {
  bouton: 16,
  carte: 20,
  pilule: 999,
} as const;

// Ressorts Reanimated : à passer tels quels à withSpring()
export const Ressorts = {
  snappy: { duration: 250, dampingRatio: 1 },
  standard: { duration: 400, dampingRatio: 1 },
  gesture: { duration: 300, dampingRatio: 0.8 },
  bounce: { duration: 450, dampingRatio: 0.55 },
} as const;

export const Durees = {
  instant: 100,
  fast: 150,
  standard: 250,
  emphasized: 350,
} as const;

// Barre de navigation flottante : sert aussi à réserver la place en bas des écrans
export const BarreNavigation = {
  hauteur: 64,
  margeCotes: 20,
  margeBas: 26,
  /** Bouton « Créer » posé au-dessus de la barre, et l'espace entre les deux */
  hauteurCreer: 52,
  ecartCreer: 10,
} as const;

/** Place à réserver en bas d'un écran à onglets : la barre et le bouton « Créer » au-dessus. */
export const RESERVE_BAS = BarreNavigation.hauteur + BarreNavigation.hauteurCreer + BarreNavigation.ecartCreer;

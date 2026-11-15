// Jetons du design system (voir docs/design-system.md).
// Aucune couleur ne doit être écrite en dur dans un écran : tout passe par ici.

export const palettes = {
  light: {
    rouge: '#C8361C',
    surRouge: '#FFFFFF',
    rougeTexte: '#A12A14',
    rougeDoux: '#FCE6E0',
    orange: '#E35A0C',
    orangeTexte: '#863404',
    orangeDoux: '#FDE6D2',
    encre: '#1C1412',
    secondaire: '#6E625C',
    fond: '#FBF8F5',
    carte: '#FFFFFF',
    trait: '#E8DFD7',
    beige: '#F3EDE8',
    ombre: 'rgba(28, 20, 18, 0.14)',
  },
  dark: {
    rouge: '#E8553A',
    surRouge: '#1C1412',
    rougeTexte: '#FFB4A3',
    rougeDoux: '#3A1D16',
    orange: '#FF8A3D',
    orangeTexte: '#FFC08F',
    orangeDoux: '#3B2410',
    encre: '#F5EEE9',
    secondaire: '#A99C94',
    fond: '#14100E',
    carte: '#211B18',
    trait: '#3A312C',
    beige: '#2A2320',
    ombre: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export type Scheme = keyof typeof palettes;
export type Couleurs = { [K in keyof typeof palettes.light]: string };

export const polices = {
  titre: 'BricolageGrotesque_700Bold',
  titreDemi: 'BricolageGrotesque_600SemiBold',
  texte: 'Inter_400Regular',
  texteMoyen: 'Inter_500Medium',
  texteDemi: 'Inter_600SemiBold',
} as const;

export const tailles = {
  titreEcran: 28,
  titreSession: 24,
  texte: 16,
  texteSerre: 15,
  aide: 13,
  pastille: 12,
} as const;

export const espace = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

export const rayons = { bouton: 16, carte: 20, feuille: 26, pilule: 999 } as const;

export const mise = {
  marge: 20,
  cible: 44,
  // Place à laisser en bas des écrans qui défilent, pour la barre flottante.
  basBarre: 90,
} as const;

// Réglages Reanimated (withSpring / withTiming).
export const ressorts = {
  snappy: { duration: 250, dampingRatio: 1 },
  standard: { duration: 400, dampingRatio: 1 },
  gesture: { duration: 300, dampingRatio: 0.8 },
  bounce: { duration: 450, dampingRatio: 0.55 },
} as const;

export const durees = { instant: 100, fast: 150, standard: 250, emphasized: 350 } as const;

export const pression = { bouton: 0.96, carte: 0.98 } as const;

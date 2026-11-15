// Design system de Catch. Référence : docs/design-system.md

export const Couleurs = {
  rouge: '#C8361C',
  rougeTexte: '#A12A14',
  rougeDoux: '#FCE6E0',
  orange: '#E35A0C',
  orangeTexte: '#863404',
  orangeDoux: '#FDE6D2',
  encre: '#1C1412',
  texteSecondaire: '#6E625C',
  fond: '#FBF8F5',
  carte: '#FFFFFF',
  trait: '#E8DFD7',
  beige: '#F3EDE8',
} as const;

// Les noms correspondent aux polices chargées dans src/app/_layout.tsx
export const Polices = {
  titre: 'BricolageGrotesque_700Bold',
  titreDemi: 'BricolageGrotesque_600SemiBold',
  texte: 'Inter_400Regular',
  texteMoyen: 'Inter_500Medium',
  texteDemi: 'Inter_600SemiBold',
} as const;

export const Tailles = {
  titreEcran: 28,
  titreSession: 24,
  texte: 16,
  aide: 13,
  pastille: 12,
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
} as const;

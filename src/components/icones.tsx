import Svg, { Circle, Path } from 'react-native-svg';

type Props = { couleur: string; taille?: number };

function Base({ couleur, taille = 24, children }: Props & { children: React.ReactNode }) {
  return (
    <Svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke={couleur}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function IconeCreer(props: Props) {
  return (
    <Base {...props}>
      <Path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconeCarte(props: Props) {
  return (
    <Base {...props}>
      <Path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <Path d="M9 4v14M15 6v14" />
    </Base>
  );
}

export function IconeMessages(props: Props) {
  return (
    <Base {...props}>
      <Path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" />
    </Base>
  );
}

export function IconeProfil(props: Props) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </Base>
  );
}

export function IconeRecentrer(props: Props) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={6} />
      <Circle cx={12} cy={12} r={1.5} />
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </Base>
  );
}

export function IconeListe(props: Props) {
  return (
    <Base {...props}>
      <Path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </Base>
  );
}

export function IconeRetour(props: Props) {
  return (
    <Base {...props}>
      <Path d="M15 5l-7 7 7 7" />
    </Base>
  );
}

export function IconeCalendrier(props: Props) {
  return (
    <Base {...props}>
      <Path d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4" />
    </Base>
  );
}

export function IconeLieu(props: Props) {
  return (
    <Base {...props}>
      <Path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z" />
      <Circle cx={12} cy={9.500} r={2.500} />
    </Base>
  );
}

export function IconeInfo(props: Props) {
  return (
    <Base {...props}>
      <Path d="M12 3l7 3v5.500c0 4.300-3 7.800-7 9.500-4-1.700-7-5.200-7-9.500V6l7-3z" />
      <Path d="M9 12l2.200 2.200L15 10.400" />
    </Base>
  );
}

export function IconeItineraire(props: Props) {
  return (
    <Base {...props}>
      <Path d="M4 19V11a3 3 0 0 1 3-3h12M15 4l4 4-4 4" />
    </Base>
  );
}

export function IconeCoche(props: Props) {
  return (
    <Base {...props}>
      <Path d="M5 12.500l4.500 4.500L19 7.500" />
    </Base>
  );
}

export function IconeMoins(props: Props) {
  return (
    <Base {...props}>
      <Path d="M5 12h14" />
    </Base>
  );
}

export function IconeRelancer(props: Props) {
  return (
    <Base {...props}>
      <Path d="M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4v1M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4v-1" />
    </Base>
  );
}

export function IconeSansReseau(props: Props) {
  return (
    <Base {...props}>
      <Path d="M3 3l18 18" />
      <Path d="M5 12.5a10 10 0 0 1 4-2.6M2 9a15 15 0 0 1 4.5-3M10.5 5.1A15 15 0 0 1 22 9M14 10a10 10 0 0 1 5 2.5M8.5 16a5 5 0 0 1 7 0" />
      <Circle cx={12} cy={19.5} r={0.6} />
    </Base>
  );
}

export function IconeInviter(props: Props) {
  return (
    <Base {...props}>
      <Path d="M12 15V4M8 8l4-4 4 4" />
      <Path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </Base>
  );
}

export function IconeChevron(props: Props) {
  return (
    <Base {...props}>
      <Path d="m9 6 6 6-6 6" />
    </Base>
  );
}

export function IconeEnvoyer(props: Props) {
  return (
    <Base {...props}>
      <Path d="M4 12 20 4l-6 16-3-7z" />
    </Base>
  );
}

export function IconeDrapeau(props: Props) {
  return (
    <Base {...props}>
      <Path d="M5 21V4" />
      <Path d="M5 4h11l-2 4 2 4H5" />
    </Base>
  );
}

export function IconeFermer(props: Props) {
  return (
    <Base {...props}>
      <Path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

/** Étoile « Mes sports » : pleine quand la carte est filtrée */
export function IconeEtoile({ pleine, ...props }: Props & { pleine?: boolean }) {
  return (
    <Svg
      width={props.taille ?? 24}
      height={props.taille ?? 24}
      viewBox="0 0 24 24"
      fill={pleine ? props.couleur : 'none'}
      stroke={props.couleur}
      strokeWidth={1.8}
      strokeLinejoin="round">
      <Path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </Svg>
  );
}

/** Menu du profil (réglages, aide), comme les trois traits d'Instagram */
export function IconeMenu(props: Props) {
  return (
    <Base {...props}>
      <Path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  );
}

/** Badge « vérifié » : bouclier avec une coche */
export function IconeVerifie(props: Props) {
  return (
    <Base {...props}>
      <Path d="M12 3 5 6v5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6z" />
      <Path d="m9 12 2.2 2.2L15.5 10" />
    </Base>
  );
}

/** Réglages d'une session (modifier, annuler) : engrenage */
export function IconeReglages(props: Props) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Base>
  );
}

/** Appareil photo : ajouter sa photo de profil */
export function IconePhoto(props: Props) {
  return (
    <Base {...props}>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx={12} cy={13} r={3.5} />
    </Base>
  );
}

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

// Les lignes du terrain de chaque sport, dessinées en traits fins dans l'en-tête du détail d'une session.
// Vu du dessus, dans une boîte de 400 × 240 qui remplit l'en-tête (coupée sur les bords si besoin).
// Le centre (200, 120) reste dégagé : le picto du sport s'y pose.
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Sport } from '@/donnees/pictos';

// Le terrain occupe x 40 → 360, y 30 → 210 (320 × 180), comme un terrain vu de côté sur le téléphone
// Bords du terrain : GA gauche, D droite, H haut, B bas
const GA = 40;
const D = 360;
const H = 30;
const B = 210;
const CX = 200;
const CY = 120;

/** Terrain de foot (aussi rugby et ultimate, avec leurs zones à eux) */
function Foot() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={CX} y1={H} x2={CX} y2={B} />
      <Circle cx={CX} cy={CY} r={38} />
      <Rect x={GA} y={72} width={48} height={96} />
      <Rect x={D - 48} y={72} width={48} height={96} />
      <Rect x={GA} y={98} width={18} height={44} />
      <Rect x={D - 18} y={98} width={18} height={44} />
      <Path d={`M ${GA + 48} 104 A 24 24 0 0 1 ${GA + 48} 136`} />
      <Path d={`M ${D - 48} 104 A 24 24 0 0 0 ${D - 48} 136`} />
    </>
  );
}

function Rugby() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={GA + 26} y1={H} x2={GA + 26} y2={B} />
      <Line x1={D - 26} y1={H} x2={D - 26} y2={B} />
      <Line x1={CX} y1={H} x2={CX} y2={B} />
      <Line x1={GA + 80} y1={H} x2={GA + 80} y2={B} strokeDasharray="10 8" />
      <Line x1={D - 80} y1={H} x2={D - 80} y2={B} strokeDasharray="10 8" />
      {/* Poteaux en H */}
      <Path d={`M ${GA + 26} 106 h -14 M ${GA + 26} 134 h -14 M ${GA + 12} 106 v 28`} />
      <Path d={`M ${D - 26} 106 h 14 M ${D - 26} 134 h 14 M ${D - 12} 106 v 28`} />
    </>
  );
}

function Ultimate() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={GA + 56} y1={H} x2={GA + 56} y2={B} />
      <Line x1={D - 56} y1={H} x2={D - 56} y2={B} />
      <Path d={`M ${GA + 92} ${CY - 6} l 12 12 m 0 -12 l -12 12`} />
      <Path d={`M ${D - 104} ${CY - 6} l 12 12 m 0 -12 l -12 12`} />
    </>
  );
}

function Basket() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={CX} y1={H} x2={CX} y2={B} />
      <Circle cx={CX} cy={CY} r={30} />
      <Rect x={GA} y={92} width={66} height={56} />
      <Rect x={D - 66} y={92} width={66} height={56} />
      <Path d={`M ${GA} 48 H ${GA + 40} A 76 76 0 0 1 ${GA + 40} 192 H ${GA}`} />
      <Path d={`M ${D} 48 H ${D - 40} A 76 76 0 0 0 ${D - 40} 192 H ${D}`} />
      <Circle cx={GA + 16} cy={CY} r={6} />
      <Circle cx={D - 16} cy={CY} r={6} />
    </>
  );
}

function Tennis() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={GA} y1={H + 22} x2={D} y2={H + 22} />
      <Line x1={GA} y1={B - 22} x2={D} y2={B - 22} />
      <Line x1={GA + 74} y1={H + 22} x2={GA + 74} y2={B - 22} />
      <Line x1={D - 74} y1={H + 22} x2={D - 74} y2={B - 22} />
      <Line x1={GA + 74} y1={CY} x2={D - 74} y2={CY} />
      <Line x1={CX} y1={H - 8} x2={CX} y2={B + 8} strokeWidth={4} />
    </>
  );
}

function Padel() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={GA + 54} y1={H} x2={GA + 54} y2={B} />
      <Line x1={D - 54} y1={H} x2={D - 54} y2={B} />
      <Line x1={GA + 54} y1={CY} x2={D - 54} y2={CY} />
      <Line x1={CX} y1={H - 8} x2={CX} y2={B + 8} strokeWidth={4} />
      {/* Les vitres du fond */}
      <Line x1={GA - 8} y1={H} x2={GA - 8} y2={B} strokeDasharray="4 6" />
      <Line x1={D + 8} y1={H} x2={D + 8} y2={B} strokeDasharray="4 6" />
    </>
  );
}

function Badminton() {
  return (
    <>
      <Rect x={GA} y={H} width={D - GA} height={B - H} />
      <Line x1={GA} y1={H + 14} x2={D} y2={H + 14} />
      <Line x1={GA} y1={B - 14} x2={D} y2={B - 14} />
      <Line x1={GA + 20} y1={H} x2={GA + 20} y2={B} />
      <Line x1={D - 20} y1={H} x2={D - 20} y2={B} />
      <Line x1={CX - 52} y1={H} x2={CX - 52} y2={B} />
      <Line x1={CX + 52} y1={H} x2={CX + 52} y2={B} />
      <Line x1={GA} y1={CY} x2={CX - 52} y2={CY} />
      <Line x1={CX + 52} y1={CY} x2={D} y2={CY} />
      <Line x1={CX} y1={H - 8} x2={CX} y2={B + 8} strokeWidth={4} />
    </>
  );
}

function Volley() {
  return (
    <>
      <Rect x={GA + 20} y={H} width={D - GA - 40} height={B - H} />
      <Line x1={CX - 56} y1={H} x2={CX - 56} y2={B} />
      <Line x1={CX + 56} y1={H} x2={CX + 56} y2={B} />
      <Line x1={CX} y1={H - 10} x2={CX} y2={B + 10} strokeWidth={4} />
    </>
  );
}

function Squash() {
  return (
    <>
      <Rect x={GA + 30} y={H} width={D - GA - 60} height={B - H} />
      {/* Le mur du fond à gauche, la ligne courte, la moitié du terrain */}
      <Line x1={GA + 30} y1={H} x2={GA + 30} y2={B} strokeWidth={5} />
      <Line x1={CX + 10} y1={H} x2={CX + 10} y2={B} />
      <Line x1={CX + 10} y1={CY} x2={D - 30} y2={CY} />
      <Rect x={CX + 10} y={H} width={44} height={44} />
      <Rect x={CX + 10} y={B - 44} width={44} height={44} />
    </>
  );
}

function PingPong() {
  return (
    <>
      <Rect x={GA + 30} y={H + 20} width={D - GA - 60} height={B - H - 40} rx={4} />
      <Line x1={GA + 30} y1={CY} x2={D - 30} y2={CY} />
      <Line x1={CX} y1={H + 6} x2={CX} y2={B - 6} strokeWidth={4} />
      <Path d={`M ${GA + 40} ${B - 10} v 22 M ${D - 40} ${B - 10} v 22`} />
    </>
  );
}

function Boxe() {
  // Le ring vu du dessus : trois cordes et quatre coins
  return (
    <>
      <Rect x={CX - 100} y={CY - 90} width={200} height={180} />
      <Rect x={CX - 88} y={CY - 78} width={176} height={156} />
      <Rect x={CX - 76} y={CY - 66} width={152} height={132} />
      <Circle cx={CX - 100} cy={CY - 90} r={7} />
      <Circle cx={CX + 100} cy={CY - 90} r={7} />
      <Circle cx={CX - 100} cy={CY + 90} r={7} />
      <Circle cx={CX + 100} cy={CY + 90} r={7} />
    </>
  );
}

function Escalade() {
  // Des prises sur un mur, de toutes les formes
  const prises: [number, number, number][] = [
    [60, 50, 9], [110, 90, 7], [70, 150, 11], [130, 190, 8], [150, 40, 6],
    [270, 60, 10], [320, 110, 7], [290, 170, 9], [340, 200, 6], [250, 200, 7],
    [345, 45, 8], [40, 205, 7], [255, 120, 5], [145, 130, 5],
  ];
  return (
    <>
      {prises.map(([x, y, r], i) =>
        i % 3 === 0 ? (
          <Ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r} />
        ) : i % 3 === 1 ? (
          <Circle key={i} cx={x} cy={y} r={r} />
        ) : (
          <Path key={i} d={`M ${x - r} ${y + r} L ${x} ${y - r} L ${x + r * 1.2} ${y + r * 0.6} Z`} />
        ),
      )}
      <Path d="M 20 230 C 90 180 120 100 200 60" strokeDasharray="6 8" />
    </>
  );
}

function Course() {
  // Une piste d'athlétisme, couloirs compris
  return (
    <>
      {[0, 14, 28, 42].map((e) => (
        <Rect key={e} x={GA + 10 + e} y={H + e} width={D - GA - 20 - 2 * e} height={B - H - 2 * e} rx={90 - e} />
      ))}
      <Line x1={CX + 40} y1={B - 42} x2={CX + 40} y2={B} />
    </>
  );
}

function Velo() {
  // Une route qui serpente, avec sa ligne du milieu
  return (
    <>
      <Path d="M -10 200 C 80 200 90 70 200 70 S 320 190 410 60" strokeWidth={34} strokeOpacity={0.35} />
      <Path d="M -10 200 C 80 200 90 70 200 70 S 320 190 410 60" strokeDasharray="12 10" />
    </>
  );
}

function Petanque() {
  return (
    <>
      <Rect x={GA} y={H + 30} width={D - GA} height={B - H - 60} />
      <Circle cx={GA + 40} cy={CY} r={16} />
      <Circle cx={D - 70} cy={CY - 14} r={10} />
      <Circle cx={D - 48} cy={CY + 12} r={10} />
      <Circle cx={D - 90} cy={CY + 18} r={10} />
      <Circle cx={D - 62} cy={CY + 2} r={4} />
      <Path d={`M ${GA + 60} ${CY} C 120 60 220 60 ${D - 80} ${CY - 6}`} strokeDasharray="4 8" />
    </>
  );
}

function Spikeball() {
  return (
    <>
      <Circle cx={CX} cy={CY} r={40} />
      <Circle cx={CX} cy={CY} r={86} strokeDasharray="8 8" />
      {[0, 90, 180, 270].map((a) => {
        const r = (a * Math.PI) / 180;
        return <Circle key={a} cx={CX + Math.cos(r) * 110} cy={CY + Math.sin(r) * 80} r={8} />;
      })}
    </>
  );
}

function StreetWorkout() {
  // Barres et poteaux, vus de face
  return (
    <>
      <Path d="M 60 220 V 40 M 160 220 V 40 M 50 52 H 170" />
      <Path d="M 240 220 V 90 M 340 220 V 90 M 230 102 H 350" />
      <Path d="M 250 160 H 330 M 250 190 H 330" />
      <Line x1={20} y1={222} x2={380} y2={222} />
    </>
  );
}

function Autre() {
  return (
    <>
      <Circle cx={CX} cy={CY} r={50} />
      <Circle cx={CX} cy={CY} r={90} strokeDasharray="6 8" />
      <Circle cx={CX} cy={CY} r={130} strokeDasharray="2 10" />
    </>
  );
}

const TERRAINS: Record<Sport, () => React.ReactNode> = {
  foot: Foot,
  rugby: Rugby,
  ultimate: Ultimate,
  basket: Basket,
  tennis: Tennis,
  padel: Padel,
  badminton: Badminton,
  volley: Volley,
  squash: Squash,
  pingpong: PingPong,
  boxe: Boxe,
  escalade: Escalade,
  course: Course,
  velo: Velo,
  petanque: Petanque,
  spikeball: Spikeball,
  streetworkout: StreetWorkout,
  autre: Autre,
};

/** Lignes du terrain d'un sport, qui remplissent leur parent. Décor seulement : ignoré par VoiceOver. */
export function TerrainSport({ sport, couleur }: { sport: Sport; couleur: string }) {
  const Dessin = TERRAINS[sport] ?? Autre;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
        <G fill="none" stroke={couleur} strokeWidth={2.5} strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round">
          <Dessin />
        </G>
      </Svg>
    </View>
  );
}

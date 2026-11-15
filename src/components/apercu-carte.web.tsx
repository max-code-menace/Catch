// Version web : un fond et une épingle, pour vérifier la mise en page dans un navigateur.
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { PropsApercu } from '@/components/apercu-carte';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

export function ApercuCarte(_: PropsApercu) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <View style={[StyleSheet.absoluteFill, styles.fond]}>
      <Svg width={36} height={44} viewBox="0 0 36 44">
        <Path d="M18 43S3 29.500 3 17a15 15 0 0 1 30 0c0 12.500-15 26-15 26z" fill={c.rouge} />
        <Circle cx={18} cy={17} r={5} fill={c.surRouge} />
      </Svg>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    fond: { backgroundColor: c.fondCarte, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  });

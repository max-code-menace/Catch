// Version web : un fond et une épingle, pour vérifier la mise en page dans un navigateur.
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { PropsApercu } from '@/components/apercu-carte';
import { Couleurs } from '@/constants/theme';

export function ApercuCarte(_: PropsApercu) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.fond]}>
      <Svg width={36} height={44} viewBox="0 0 36 44">
        <Path d="M18 43S3 29.500 3 17a15 15 0 0 1 30 0c0 12.500-15 26-15 26z" fill={Couleurs.rouge} />
        <Circle cx={18} cy={17} r={5} fill={Couleurs.carte} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: '#EFE9E2', alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
});

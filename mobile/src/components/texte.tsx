import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/theme-context';
import { polices, tailles } from '@/theme/tokens';

type Props = TextProps & { secondaire?: boolean };

export function Titre({ style, ...rest }: TextProps) {
  const { c } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[{ color: c.encre, fontFamily: polices.titre, fontSize: tailles.titreEcran, lineHeight: 34 }, style]}
      {...rest}
    />
  );
}

export function Texte({ style, secondaire, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <Text
      style={[
        { color: secondaire ? c.secondaire : c.encre, fontFamily: polices.texte, fontSize: tailles.texte, lineHeight: 23 },
        style,
      ]}
      {...rest}
    />
  );
}

export function Aide({ style, ...rest }: TextProps) {
  const { c } = useTheme();
  return (
    <Text
      style={[{ color: c.secondaire, fontFamily: polices.texte, fontSize: tailles.aide, lineHeight: 18 }, style]}
      {...rest}
    />
  );
}

// Choix d'un jour et d'une heure avec le sélecteur du système.
// iPhone : les deux pastilles d'iOS (date et heure) qui ouvrent le calendrier et la roue des heures.
// Android : deux boutons qui ouvrent les fenêtres de date et d'heure du système.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { heure } from '@/lib/formats';
import { useCouleurs, useTheme } from '@/lib/theme';

/** Les heures se choisissent au quart d'heure */
const PAS_MINUTES = 15;

type Props = {
  valeur: Date;
  onChange: (date: Date) => void;
  min: Date;
  max: Date;
};

function auQuartDHeure(date: Date) {
  const arrondie = new Date(date);
  arrondie.setSeconds(0, 0);
  arrondie.setMinutes(Math.round(arrondie.getMinutes() / PAS_MINUTES) * PAS_MINUTES);
  return arrondie;
}

/** Garde la date entre les bornes */
function borner(date: Date, min: Date, max: Date) {
  return new Date(Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()));
}

export function ChoixDateHeure({ valeur, onChange, min, max }: Props) {
  const c = useCouleurs();
  const { theme } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.ligne}>
        <DateTimePicker
          value={valeur}
          mode="datetime"
          display="compact"
          locale="fr-FR"
          minuteInterval={PAS_MINUTES}
          minimumDate={min}
          maximumDate={max}
          accentColor={c.rouge}
          themeVariant={theme === 'sombre' ? 'dark' : 'light'}
          onChange={(_, date) => date && onChange(borner(date, min, max))}
        />
      </View>
    );
  }

  function ouvrir(mode: 'date' | 'time') {
    DateTimePickerAndroid.open({
      value: valeur,
      mode,
      is24Hour: true,
      minimumDate: min,
      maximumDate: max,
      onChange: (evenement, date) => {
        if (evenement.type !== 'set' || !date) return;
        const nouvelle = new Date(valeur);
        if (mode === 'date') nouvelle.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        else nouvelle.setHours(date.getHours(), date.getMinutes());
        onChange(borner(auQuartDHeure(nouvelle), min, max));
      },
    });
  }

  return (
    <View style={[styles.ligne, styles.boutons]}>
      <Bouton
        titre={valeur.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
        variante="secondaire"
        style={styles.bouton}
        onPress={() => ouvrir('date')}
      />
      <Bouton titre={heure(valeur)} variante="secondaire" style={styles.bouton} onPress={() => ouvrir('time')} />
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center' },
  boutons: { gap: 8 },
  bouton: { flex: 1 },
});

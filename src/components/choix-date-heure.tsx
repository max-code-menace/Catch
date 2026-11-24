// Choix d'un jour et d'une heure avec le sélecteur du système.
// iPhone : les deux pastilles d'iOS (date et heure) qui ouvrent le calendrier et la roue des heures.
// Android : deux boutons qui ouvrent les fenêtres de date et d'heure du système.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, StyleSheet, View } from 'react-native';

import { Bouton } from '@/components/bouton';
import { heure } from '@/lib/formats';
import { useCouleurs, useTheme } from '@/lib/theme';

type Props = {
  valeur: Date;
  onChange: (date: Date) => void;
  min: Date;
  max: Date;
  /** Pas de la roue des minutes : au quart d'heure par défaut, à la minute pour « Créer » */
  pasMinutes?: 1 | 15;
  /** iPhone : « roue » montre directement la roue jour + heure (étape « Quand ? » de Créer) au lieu des deux pastilles */
  affichage?: 'compact' | 'roue';
};

function arrondir(date: Date, pas: number) {
  const arrondie = new Date(date);
  arrondie.setSeconds(0, 0);
  arrondie.setMinutes(Math.round(arrondie.getMinutes() / pas) * pas);
  return arrondie;
}

/** Garde la date entre les bornes */
function borner(date: Date, min: Date, max: Date) {
  return new Date(Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()));
}

export function ChoixDateHeure({ valeur, onChange, min, max, pasMinutes = 15, affichage = 'compact' }: Props) {
  const c = useCouleurs();
  const { theme } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.ligne, affichage === 'roue' && styles.roue]}>
        <DateTimePicker
          value={valeur}
          mode="datetime"
          display={affichage === 'roue' ? 'spinner' : 'compact'}
          locale="fr-FR"
          minuteInterval={pasMinutes}
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
        onChange(borner(arrondir(nouvelle, pasMinutes), min, max));
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
  roue: { justifyContent: 'center' },
  boutons: { gap: 8 },
  bouton: { flex: 1 },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from '@/constants/supabase';

/** Client Supabase, ou `null` tant que le projet n'est pas renseigné dans src/constants/supabase.ts. */
export const supabase =
  SUPABASE_URL && SUPABASE_CLE_PUBLIQUE
    ? createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
        auth: {
          // La connexion est gardée sur le téléphone : on ne se reconnecte pas à chaque ouverture
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// La connexion n'est renouvelée que quand l'app est à l'écran
if (supabase && Platform.OS !== 'web') {
  const client = supabase;
  AppState.addEventListener('change', (etat) => {
    if (etat === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
}

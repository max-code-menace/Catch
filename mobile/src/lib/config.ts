// Adresse et clé publique du projet Supabase (la base de données de Catch).
// Cette clé est faite pour être dans l'app : elle ne donne accès qu'à ce que les règles de la base autorisent.
export const SUPABASE_URL = 'https://fwhewavlrbujnwfbgcdf.supabase.co';
export const SUPABASE_CLE_PUBLIQUE = 'sb_publishable_lN5DHG-qPEU3xcDn7ZVMFA_iQddjVwT';

// Zone de lancement : centre de Wavre. Sert de point de départ quand on n'a pas la position.
export const ZONE_DEPART = { nom: 'Wavre', lat: 50.7172, lng: 4.6083 } as const;
export const RAYON_KM = 5;
// Au-delà, on ne propose plus « Voir les sessions à X km ».
export const RAYON_MAX_KM = 30;

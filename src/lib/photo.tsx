// Photo de profil : facultative, l'initiale reste par défaut. Rangée dans le stockage Supabase,
// dossier « photos/<id du compte>/photo.jpg » (migration 20261123000000_photos.sql).
// Partagée entre le Profil et l'onglet du bas, qui montre ta tête comme sur Instagram.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { createContext, use, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { demander } from '@/lib/alerte';
import { useCompte } from '@/lib/compte';
import { supabase } from '@/lib/supabase';

/** `annule` : la personne a fermé le sélecteur. `refuse` : pas d'accès aux photos ou à l'appareil. */
export type ResultatPhoto = 'ok' | 'annule' | 'refuse' | 'erreur';

type Valeur = {
  photo: string | null;
  envoi: boolean;
  choisir: (source: 'appareil' | 'galerie') => Promise<ResultatPhoto>;
  retirer: () => Promise<boolean>;
};

const Contexte = createContext<Valeur | null>(null);

/** Chemin de la photo dans le rangement : toujours le même, on la remplace */
export function cheminPhoto(id: string) {
  return `${id}/photo.jpg`;
}

async function demanderAcces(source: 'appareil' | 'galerie') {
  const reponse =
    source === 'appareil'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (reponse.granted) return true;
  if (!reponse.canAskAgain) {
    demander({
      titre: source === 'appareil' ? 'Appareil photo bloqué' : 'Photos bloquées',
      texte: 'Tu peux autoriser Catch dans les Réglages de ton téléphone.',
      confirmer: 'Ouvrir les Réglages',
      onConfirmer: () => Linking.openSettings(),
    });
  }
  return false;
}

export function FournisseurPhoto({ children }: { children: React.ReactNode }) {
  const { compte } = useCompte();
  const moi = compte?.id ?? null;
  const [photo, setPhoto] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!moi || !supabase) return;
    let actif = true;
    supabase
      .rpc('ma_photo')
      .then(({ data, error }) => {
        if (actif && !error) setPhoto(typeof data === 'string' ? data : null);
      })
      .then(undefined, () => {});
    return () => {
      actif = false;
    };
  }, [moi]);

  async function choisir(source: 'appareil' | 'galerie'): Promise<ResultatPhoto> {
    if (!moi || !supabase) return 'erreur';
    if (!(await demanderAcces(source))) return 'refuse';
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };
    const choix =
      source === 'appareil'
        ? await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front })
        : await ImagePicker.launchImageLibraryAsync(options);
    if (choix.canceled || !choix.assets[0]) return 'annule';

    setEnvoi(true);
    try {
      // Une petite image carrée suffit : 512 px, en JPEG
      const contexte = ImageManipulator.ImageManipulator.manipulate(choix.assets[0].uri);
      contexte.resize({ width: 512 });
      const rendu = await contexte.renderAsync();
      const fichier = await rendu.saveAsync({ compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
      const octets = await (await fetch(fichier.uri)).arrayBuffer();

      const chemin = cheminPhoto(moi);
      const { error: erreurEnvoi } = await supabase.storage
        .from('photos')
        .upload(chemin, octets, { contentType: 'image/jpeg', upsert: true });
      if (erreurEnvoi) return 'erreur';
      // Le numéro de version force les téléphones à recharger la nouvelle photo
      const adresse = `${supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl}?v=${Date.now()}`;
      const { error } = await supabase.rpc('regler_photo', { p_photo: adresse });
      if (error) return 'erreur';
      setPhoto(adresse);
      return 'ok';
    } catch {
      return 'erreur';
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    if (!moi || !supabase) return false;
    try {
      const { error } = await supabase.rpc('regler_photo', { p_photo: null });
      if (error) return false;
      await supabase.storage.from('photos').remove([cheminPhoto(moi)]);
      setPhoto(null);
      return true;
    } catch {
      return false;
    }
  }

  return <Contexte value={{ photo: moi ? photo : null, envoi, choisir, retirer }}>{children}</Contexte>;
}

export function usePhoto() {
  const valeur = use(Contexte);
  if (!valeur) throw new Error('usePhoto doit être utilisé dans FournisseurPhoto');
  return valeur;
}

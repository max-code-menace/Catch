// Tests du retour de « Continuer avec Google » (src/lib/retour-connexion.ts).
// À lancer avec `npm test` (Node 24 lit directement le TypeScript).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lireRetourConnexion, prenomDepuisNom } from '../src/lib/retour-connexion.ts';

test('jetons après le #', () => {
  assert.deepEqual(
    lireRetourConnexion('exp://u.expo.dev/abc/--/connexion-google#access_token=a.b.c&expires_in=3600&refresh_token=xyz&token_type=bearer'),
    { type: 'jetons', accessToken: 'a.b.c', refreshToken: 'xyz' },
  );
});

test('erreur après le ?', () => {
  assert.deepEqual(
    lireRetourConnexion('catch://connexion-google?error=access_denied&error_description=User+denied'),
    { type: 'erreur', code: 'access_denied' },
  );
});

test('erreur après le #, avec code précis', () => {
  assert.deepEqual(
    lireRetourConnexion('catch://connexion-google#error=server_error&error_code=bad_oauth_state'),
    { type: 'erreur', code: 'bad_oauth_state' },
  );
});

test('? puis # : les deux sont lus', () => {
  assert.deepEqual(lireRetourConnexion('catch://x?foo=1#access_token=t&refresh_token=r'), {
    type: 'jetons',
    accessToken: 't',
    refreshToken: 'r',
  });
});

test('rien dans l’adresse, ou un seul jeton', () => {
  assert.deepEqual(lireRetourConnexion('catch://connexion-google'), { type: 'vide' });
  assert.deepEqual(lireRetourConnexion('catch://x#access_token=t'), { type: 'vide' });
});

test('prénom depuis le nom Google', () => {
  assert.equal(prenomDepuisNom('Maxime Dupont'), 'Maxime');
  assert.equal(prenomDepuisNom('  Léa  '), 'Léa');
  assert.equal(prenomDepuisNom('J'), null);
  assert.equal(prenomDepuisNom(''), null);
  assert.equal(prenomDepuisNom(undefined), null);
});

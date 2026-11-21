// Tests du filtre « Mes sports » de la carte (src/lib/filtre-sports.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  basculerSport,
  CHOIX_VIDE,
  filtreActif,
  garder,
  lireChoix,
  listeSports,
  texteFiltre,
} from '../src/lib/filtre-sports.ts';

const noms = { foot: 'Foot', padel: 'Padel', course: 'Course à pied', basket: 'Basket' };
const nomDe = (s) => noms[s];

test('sans sport choisi, la carte montre tout', () => {
  assert.equal(filtreActif(CHOIX_VIDE), false);
  const liste = [{ sport: 'foot' }, { sport: 'basket' }];
  assert.deepEqual(garder(liste, CHOIX_VIDE, (x) => [x.sport]), liste);
});

test('« Tous les sports » montre tout sans oublier ses sports', () => {
  const choix = { sports: ['padel'], tous: true };
  assert.equal(filtreActif(choix), false);
  assert.equal(garder([{ sport: 'foot' }], choix, (x) => [x.sport]).length, 1);
});

test('avec des sports choisis, on ne garde que ceux-là', () => {
  const choix = { sports: ['foot', 'padel'], tous: false };
  const sessions = [{ sport: 'foot' }, { sport: 'basket' }, { sport: 'padel' }];
  assert.deepEqual(
    garder(sessions, choix, (x) => [x.sport]).map((x) => x.sport),
    ['foot', 'padel'],
  );
});

test('une salle reste si elle propose un des sports choisis', () => {
  const choix = { sports: ['padel'], tous: false };
  const lieux = [{ sports: ['tennis', 'padel'] }, { sports: ['escalade'] }];
  assert.equal(garder(lieux, choix, (l) => l.sports).length, 1);
});

test('toucher un sport l’ajoute ou le retire, et revient à « Mes sports »', () => {
  const ajoute = basculerSport({ sports: ['foot'], tous: true }, 'padel');
  assert.deepEqual(ajoute, { sports: ['foot', 'padel'], tous: false });
  assert.deepEqual(basculerSport(ajoute, 'foot'), { sports: ['padel'], tous: false });
});

test('ce qui est relu du téléphone est vérifié', () => {
  const connus = ['foot', 'padel', 'basket'];
  assert.deepEqual(lireChoix(null, connus), CHOIX_VIDE);
  assert.deepEqual(lireChoix('pas du json', connus), CHOIX_VIDE);
  assert.deepEqual(lireChoix('{"sports":["padel","curling",3],"tous":true}', connus), {
    sports: ['padel'],
    tous: true,
  });
});

test('les textes', () => {
  assert.equal(texteFiltre({ sports: ['padel'], tous: false }, nomDe), 'en padel');
  assert.equal(texteFiltre({ sports: ['padel', 'foot'], tous: false }, nomDe), 'dans tes sports');
  assert.equal(listeSports(['foot', 'course'], nomDe), 'Foot, course à pied');
});

// Tests de l'anneau des places (src/lib/anneau-places.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TRAITS_MAX, traitsAnneau } from '../src/lib/anneau-places.ts';

const pleins = (traits) => traits.filter((t) => t.plein).length;

test('un trait par joueur, plein pour chaque inscrit', () => {
  const traits = traitsAnneau(7, 10, 64, 6);
  assert.equal(traits.length, 10);
  assert.equal(pleins(traits), 7);
  // Les inscrits viennent en premier, le reste est vide
  assert.deepEqual(traits.map((t) => t.plein), [true, true, true, true, true, true, true, false, false, false]);
});

test('12 traits au plus : chaque trait vaut alors plusieurs joueurs', () => {
  const traits = traitsAnneau(10, 20, 64, 6);
  assert.equal(traits.length, TRAITS_MAX);
  assert.equal(pleins(traits), 6);
});

test('anneau vide, plein, et cas limites', () => {
  assert.equal(pleins(traitsAnneau(0, 4, 64, 6)), 0);
  assert.equal(pleins(traitsAnneau(4, 4, 64, 6)), 4);
  // Plus d'inscrits que de places : jamais plus de traits pleins que de traits
  assert.equal(pleins(traitsAnneau(9, 4, 64, 6)), 4);
  // Un seul joueur : un trait, jamais de calcul impossible
  const seul = traitsAnneau(1, 1, 64, 6);
  assert.equal(seul.length, 1);
  assert.match(seul[0].d, /^M[\d. -]+ A[\d.]+ [\d.]+ 0 1 1 [\d. -]+$/);
  assert.equal(traitsAnneau(0, 0, 64, 6).length, 1);
});

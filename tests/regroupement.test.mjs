// Tests du regroupement des lieux sur la carte (src/lib/regroupement.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OUVERTURE_REGROUPEMENT, regrouper } from '../src/lib/regroupement.ts';

const lieux = [
  { id: 'a', position: { latitude: 50.8467, longitude: 4.3525 } },
  { id: 'b', position: { latitude: 50.8468, longitude: 4.3527 } },
  { id: 'c', position: { latitude: 50.79, longitude: 4.45 } },
];
const position = (l) => l.position;
const cle = (l) => l.id;

test('zoomé, chaque lieu reste seul', () => {
  const groupes = regrouper(lieux, position, OUVERTURE_REGROUPEMENT, cle);
  assert.equal(groupes.length, 3);
  assert.deepEqual(groupes.map((g) => g.cle), ['a', 'b', 'c']);
});

test('dézoomé, les lieux voisins se regroupent, les lointains non', () => {
  const groupes = regrouper(lieux, position, 0.2, cle);
  assert.equal(groupes.length, 2);
  const groupe = groupes.find((g) => g.elements.length === 2);
  assert.equal(groupe.cle, 'a|b');
  assert.ok(Math.abs(groupe.position.latitude - 50.84675) < 1e-9);
});

test('aucun lieu, aucun groupe', () => {
  assert.deepEqual(regrouper([], position, 0.5, cle), []);
});

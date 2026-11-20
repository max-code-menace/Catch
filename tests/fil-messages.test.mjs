// Tests du fil d'une conversation (src/lib/fil-messages.ts) : les messages reçus en direct s'ajoutent sans doublon.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fusionnerMessages } from '../src/lib/fil-messages.ts';

const m = (id, minute, enAttente) => ({
  id,
  auteurId: 'a',
  prenom: 'Sarah',
  texte: id,
  date: new Date(2026, 10, 20, 19, minute),
  ...(enAttente ? { enAttente: true } : {}),
});

test('les nouveaux messages s’ajoutent à la fin, sans relire les anciens', () => {
  const fil = fusionnerMessages([m('a', 1), m('b', 2)], [m('c', 3)]);
  assert.deepEqual(fil.map((x) => x.id), ['a', 'b', 'c']);
});

test('un message déjà affiché n’apparaît pas deux fois', () => {
  const fil = fusionnerMessages([m('a', 1), m('b', 2)], [m('b', 2), m('c', 3)]);
  assert.deepEqual(fil.map((x) => x.id), ['a', 'b', 'c']);
});

test('les messages en cours d’envoi restent à la fin', () => {
  const fil = fusionnerMessages([m('a', 1), m('envoi', 5, true)], [m('c', 3)]);
  assert.deepEqual(fil.map((x) => x.id), ['a', 'c', 'envoi']);
});

test('fil vide, rien de reçu : fil vide', () => {
  assert.deepEqual(fusionnerMessages([], []), []);
});

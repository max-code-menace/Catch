// Tests du fil d'une conversation (src/lib/fil-messages.ts) : les messages reçus en direct s'ajoutent sans doublon.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fusionnerMessages, placesDansLeFil, texteSeparateur } from '../src/lib/fil-messages.ts';

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

const de = (id, auteurId, minute) => ({ id, auteurId, prenom: auteurId, texte: id, date: new Date(2026, 10, 20, 19, minute) });

test('les messages qui se suivent de la même personne sont collés, comme dans Messenger', () => {
  const places = placesDansLeFil([de('1', 'sarah', 0), de('2', 'sarah', 1), de('3', 'lucas', 2), de('4', 'sarah', 3)]);
  assert.deepEqual(
    places.map((p) => [p.debutGroupe, p.finGroupe]),
    [[true, false], [false, true], [true, true], [true, true]],
  );
});

test('une pause de 5 minutes sépare deux blocs, une pause d’une heure affiche l’heure', () => {
  const places = placesDansLeFil([de('1', 'sarah', 0), de('2', 'sarah', 6), de('3', 'sarah', 70)]);
  assert.deepEqual(places.map((p) => p.debutGroupe), [true, true, true]);
  assert.deepEqual(places.map((p) => !!p.separateur), [true, false, true]);
});

test('l’heure au milieu du fil', () => {
  const maintenant = new Date(2026, 10, 21, 12, 0);
  assert.equal(texteSeparateur(new Date(2026, 10, 21, 9, 5), maintenant), '9h05');
  assert.equal(texteSeparateur(new Date(2026, 10, 20, 19, 30), maintenant), 'Hier 19h30');
  assert.equal(texteSeparateur(new Date(2026, 10, 2, 19, 30), maintenant), '2/11 19h30');
});

test('le prénom n’est rappelé que quand quelqu’un d’autre parlait juste avant', () => {
  const places = placesDansLeFil([de('1', 'lucas', 0), de('2', 'lucas', 7), de('3', 'sarah', 8), de('4', 'lucas', 9)]);
  assert.deepEqual(places.map((p) => p.avecPrenom), [true, false, true, true]);
});

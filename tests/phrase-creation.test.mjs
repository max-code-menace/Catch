// Tests de la phrase de Créer (src/lib/phrase-creation.ts) et de « quand » dans cette phrase.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { phraseCreation, sportDansLaPhrase } from '../src/lib/phrase-creation.ts';
import { quandCreation } from '../src/lib/formats.ts';

const lire = (morceaux) =>
  morceaux.map((m) => (m.type === 'trou' ? `[${m.texte}]` : m.texte + (m.ponctuation ?? ''))).join(' ');

test('phrase complète', () => {
  const phrase = phraseCreation({
    sport: { cle: 'foot', nom: 'Foot' },
    quand: 'ce soir à 19h',
    joueurs: 10,
    lieu: 'Parc Josaphat',
  });
  assert.equal(lire(phrase), 'Je lance du foot ce soir à 19h, à 10 joueurs. Rendez-vous Parc Josaphat.');
  assert.equal(phrase.filter((m) => m.type === 'trou').length, 0);
});

test('phrase vide : des trous pour le sport, les joueurs et le lieu', () => {
  const phrase = phraseCreation({ sport: null, quand: 'maintenant', joueurs: null, lieu: null });
  assert.equal(lire(phrase), 'Je lance [quel sport ?] maintenant, [combien ?] Rendez-vous [où ?]');
  assert.deepEqual(phrase.filter((m) => m.type === 'trou').map((m) => m.champ), ['sport', 'joueurs', 'ou']);
});

test('articles des sports', () => {
  assert.equal(sportDansLaPhrase('escalade', 'Escalade'), 'de l’escalade');
  assert.equal(sportDansLaPhrase('boxe', 'Boxe'), 'de la boxe');
  assert.equal(sportDansLaPhrase('course', 'Course à pied'), 'de la course');
  assert.equal(sportDansLaPhrase('pingpong', 'Ping-pong'), 'du ping-pong');
  assert.equal(sportDansLaPhrase('streetworkout', 'Street workout'), 'du street workout');
});

test('quand dans la phrase', () => {
  const lundiMidi = new Date(2026, 10, 16, 12, 0);
  assert.equal(quandCreation(new Date(2026, 10, 16, 19, 0), lundiMidi), 'ce soir à 19h');
  assert.equal(quandCreation(new Date(2026, 10, 16, 14, 30), lundiMidi), 'aujourd’hui à 14h30');
  assert.equal(quandCreation(new Date(2026, 10, 17, 18, 0), lundiMidi), 'demain à 18h');
  assert.equal(quandCreation(new Date(2026, 10, 19, 19, 0), lundiMidi), 'jeudi à 19h');
  assert.equal(quandCreation(new Date(2026, 10, 28, 10, 0), lundiMidi), 'samedi 28 novembre à 10h');
});

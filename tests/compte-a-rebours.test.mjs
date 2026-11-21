// Tests du compte à rebours de l'en-tête du détail (src/lib/formats.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compteARebours } from '../src/lib/formats.ts';

// Un lundi à midi
const maintenant = new Date(2026, 10, 16, 12, 0);
const session = (debut, dureeMin = 90) => ({ debut, fin: new Date(debut.getTime() + dureeMin * 60_000) });

test('compte à rebours : en direct, terminée', () => {
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 11, 30)), maintenant), 'En direct');
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 9, 0)), maintenant), 'Terminée');
});

test('compte à rebours : le jour même', () => {
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 12, 45)), maintenant), 'Dans 45 min');
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 15, 0)), maintenant), 'Dans 3 h');
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 19, 0)), maintenant), 'Ce soir');
  assert.equal(compteARebours(session(new Date(2026, 10, 16, 17, 0)), maintenant), "Aujourd'hui");
});

test('compte à rebours : les jours suivants', () => {
  assert.equal(compteARebours(session(new Date(2026, 10, 17, 9, 0)), maintenant), 'Demain');
  assert.equal(compteARebours(session(new Date(2026, 10, 20, 19, 0)), maintenant), 'Dans 4 jours');
});

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

test('jour de la tuile « Quand »', async () => {
  const { jourDetail } = await import('../src/lib/formats.ts');
  assert.equal(jourDetail(session(new Date(2026, 10, 16, 11, 30)), maintenant), 'En ce moment');
  assert.equal(jourDetail(session(new Date(2026, 10, 16, 19, 0)), maintenant), 'Ce soir');
  assert.equal(jourDetail(session(new Date(2026, 10, 16, 14, 0)), maintenant), "Aujourd'hui");
  assert.equal(jourDetail(session(new Date(2026, 10, 17, 18, 0)), maintenant), 'Demain');
  assert.equal(jourDetail(session(new Date(2026, 10, 24, 18, 0)), maintenant), 'Mar. 24 novembre');
});

test('phrase de l’en-tête : le temps, puis les places', async () => {
  const { phraseEntete } = await import('../src/lib/formats.ts');
  const avec = (debut, joueurs, inscrits) => ({ ...session(debut), joueurs, inscrits });
  const dans3h = new Date(2026, 10, 16, 15, 0);
  assert.deepEqual(phraseEntete(avec(dans3h, 10, ['Ma', 'Lu']), maintenant), {
    temps: 'Dans 3 h',
    places: { avant: 'encore', nombre: 8, apres: 'places' },
  });
  assert.deepEqual(phraseEntete(avec(dans3h, 2, ['Ma']), maintenant).places, { avant: 'encore', nombre: 1, apres: 'place' });
  assert.deepEqual(phraseEntete(avec(dans3h, 2, ['Ma', 'Toi']), maintenant).places, { avant: '', nombre: null, apres: 'complet' });
  assert.equal(phraseEntete(avec(new Date(2026, 10, 16, 11, 30), 4, ['Ma']), maintenant).temps, 'En direct');
  assert.equal(phraseEntete(avec(new Date(2026, 10, 16, 9, 0), 4, ['Ma']), maintenant).places, null);
});

test('ligne de points : joueurs, toi, places libres, coupée au-delà du maximum', async () => {
  const { pointsDesPlaces } = await import('../src/lib/formats.ts');
  assert.deepEqual(pointsDesPlaces({ joueurs: 4, inscrits: ['Ma', 'Toi'] }), {
    points: ['joueur', 'toi', 'libre', 'libre'],
    reste: 0,
  });
  const course = pointsDesPlaces({ joueurs: 20, inscrits: ['Ma', 'Lu', 'So'] });
  assert.equal(course.points.length, 12);
  assert.equal(course.reste, 8);
  assert.deepEqual(pointsDesPlaces({ joueurs: 2, inscrits: ['Ma', 'Lu', 'So'] }).points, ['joueur', 'joueur', 'joueur']);
});

// Tests des textes et calculs d'une session (src/lib/formats.ts) : heures, places, distances, annulation.
// À lancer avec `npm test` (Node 24 lit directement le TypeScript).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  annulationLibre,
  distance,
  estEnDirect,
  heure,
  placesLibres,
  quand,
  quandDetail,
  texteDistance,
  texteDuree,
  textePastille,
  textePlaces,
} from '../src/lib/formats.ts';

const HEURE = 3_600_000;
// Un lundi à midi
const maintenant = new Date(2026, 10, 16, 12, 0);

function session(debut, { dureeMin = 90, joueurs = 10, inscrits = 3 } = {}) {
  return {
    id: 's1',
    sport: 'foot',
    nomSport: 'Foot',
    titre: 'Foot',
    lieu: 'Parc du Cinquantenaire',
    commune: 'Bruxelles',
    position: { latitude: 50.84, longitude: 4.39 },
    debut,
    fin: new Date(debut.getTime() + dureeMin * 60_000),
    joueurs,
    inscrits: Array.from({ length: inscrits }, (_, i) => `J${i}`),
    idsInscrits: Array.from({ length: inscrits }, (_, i) => `id-${i}`),
    organisateur: 'Sarah',
    organisateurId: 'id-0',
    debutantsBienvenus: true,
  };
}

test('heure : pas de minutes quand c’est une heure pile', () => {
  assert.equal(heure(new Date(2026, 10, 16, 19, 0)), '19h');
  assert.equal(heure(new Date(2026, 10, 16, 19, 5)), '19h05');
  assert.equal(heure(new Date(2026, 10, 16, 9, 30)), '9h30');
});

test('quand : aujourd’hui, ce soir, demain, puis le jour de la semaine', () => {
  assert.equal(quand(new Date(2026, 10, 16, 15, 0), maintenant), "Aujourd'hui 15h");
  assert.equal(quand(new Date(2026, 10, 16, 19, 0), maintenant), 'Ce soir 19h');
  assert.equal(quand(new Date(2026, 10, 17, 18, 30), maintenant), 'Demain 18h30');
  assert.equal(quand(new Date(2026, 10, 19, 19, 0), maintenant), 'Jeu. 19h');
});

test('quand : « demain » se compte en jours du calendrier, pas en 24 heures', () => {
  const tard = new Date(2026, 10, 16, 23, 30);
  assert.equal(quand(new Date(2026, 10, 17, 0, 30), tard), 'Demain 0h30');
});

test('places : libres, une seule, complet, jamais négatif', () => {
  assert.equal(textePlaces(session(maintenant, { joueurs: 10, inscrits: 3 })), '7 places libres');
  assert.equal(textePlaces(session(maintenant, { joueurs: 4, inscrits: 3 })), '1 place libre');
  assert.equal(textePlaces(session(maintenant, { joueurs: 4, inscrits: 4 })), 'Complet');
  assert.equal(placesLibres(session(maintenant, { joueurs: 4, inscrits: 6 })), 0);
});

test('en direct : entre le début et la fin, pas avant ni après', () => {
  const s = session(new Date(maintenant.getTime() - 30 * 60_000));
  assert.equal(estEnDirect(s, maintenant), true);
  assert.equal(estEnDirect(session(new Date(maintenant.getTime() + HEURE)), maintenant), false);
  assert.equal(estEnDirect(session(new Date(maintenant.getTime() - 3 * HEURE)), maintenant), false);
  assert.equal(quandDetail(s, maintenant), "En ce moment · jusqu'à 13h");
});

test('pastille : en direct, il manque 1, sinon le moment', () => {
  assert.equal(textePastille(session(new Date(Date.now() - 10 * 60_000), { inscrits: 6 })), 'Foot · 6 jouent');
  const demain = new Date(Date.now() + 26 * HEURE);
  assert.equal(textePastille(session(demain, { joueurs: 4, inscrits: 3 })), 'Foot · il manque 1');
});

test('annulation libre jusqu’à 3 heures avant le début', () => {
  assert.equal(annulationLibre(session(new Date(maintenant.getTime() + 4 * HEURE)), maintenant), true);
  assert.equal(annulationLibre(session(new Date(maintenant.getTime() + 2 * HEURE)), maintenant), false);
  assert.equal(annulationLibre(session(new Date(maintenant.getTime() - HEURE)), maintenant), false);
});

test('durée : en minutes sous une heure, sinon en heures', () => {
  assert.equal(texteDuree(session(maintenant, { dureeMin: 45 })), 'Environ 45 min');
  assert.equal(texteDuree(session(maintenant, { dureeMin: 60 })), 'Environ 1h');
  assert.equal(texteDuree(session(maintenant, { dureeMin: 90 })), 'Environ 1h30');
});

test('distance : Grand-Place → Atomium ≈ 5,5 km, et son texte', () => {
  const grandPlace = { latitude: 50.8467, longitude: 4.3525 };
  const atomium = { latitude: 50.8949, longitude: 4.3415 };
  const metres = distance(grandPlace, atomium);
  assert.ok(metres > 5200 && metres < 5700, `distance inattendue : ${metres}`);
  assert.equal(distance(grandPlace, grandPlace), 0);
  assert.equal(texteDistance(20), 'à 50 m');
  assert.equal(texteDistance(620), 'à 600 m');
  assert.equal(texteDistance(metres), 'à 5 km');
});

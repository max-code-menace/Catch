// Tests du profil (src/lib/profil.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  accorder,
  dateCourte,
  initiale,
  separerTraces,
  statsProfil,
  texteMembreDepuis,
} from '../src/lib/profil.ts';

const maintenant = new Date(2026, 10, 22, 12, 0);
const trace = (id, sport, jours, organise = false) => {
  const debut = new Date(maintenant.getTime() + jours * 86_400_000);
  return { id, sport, titre: sport, lieu: 'Parc', debut, fin: new Date(debut.getTime() + 3_600_000), organise };
};

const traces = [
  trace('a', 'foot', -5, true),
  trace('b', 'padel', -2),
  trace('c', 'foot', -1),
  trace('d', 'foot', 2, true),
  trace('e', 'basket', 3),
];

test('compteurs : jouées, organisées, sports du plus fréquent au moins fréquent', () => {
  const stats = statsProfil(traces, maintenant);
  assert.equal(stats.jouees, 3);
  assert.equal(stats.organisees, 2);
  assert.deepEqual(stats.sports.slice(0, 1), ['foot']);
  assert.equal(stats.sports.length, 3);
});

test('une session en cours n’est pas encore jouée', () => {
  const enCours = { ...trace('x', 'foot', 0), debut: new Date(maintenant.getTime() - 1_800_000), fin: new Date(maintenant.getTime() + 1_800_000) };
  assert.equal(statsProfil([enCours], maintenant).jouees, 0);
  assert.equal(separerTraces([enCours], maintenant).aVenir.length, 1);
});

test('à venir : la prochaine d’abord ; jouées : la plus récente d’abord', () => {
  const { aVenir, jouees } = separerTraces(traces, maintenant);
  assert.deepEqual(aVenir.map((t) => t.id), ['d', 'e']);
  assert.deepEqual(jouees.map((t) => t.id), ['c', 'b', 'a']);
});

test('textes', () => {
  assert.equal(texteMembreDepuis(new Date(2026, 10, 3)), 'Membre depuis novembre 2026');
  assert.equal(dateCourte(new Date(2026, 1, 9)), '9 févr.');
  assert.equal(accorder(1, 'session jouée', 'sessions jouées'), '1 session jouée');
  assert.equal(accorder(0, 'session jouée', 'sessions jouées'), '0 session jouée');
  assert.equal(accorder(4, 'session jouée', 'sessions jouées'), '4 sessions jouées');
  assert.equal(initiale('  maxime'), 'M');
  assert.equal(initiale(null), '');
});

import { indexDuJour, joursDeLaSemaine, semaine, sportsDuProfil } from '../src/lib/profil.ts';

test('les 7 jours commencent aujourd’hui', () => {
  const jours = joursDeLaSemaine(maintenant);
  assert.equal(jours.length, 7);
  assert.equal(jours[0].nom, 'Auj.');
  assert.equal(jours[1].nom, 'Lun'); // le 22 novembre 2026 est un dimanche
  assert.equal(indexDuJour(new Date(2026, 10, 28, 23, 0), maintenant), 6);
  assert.equal(indexDuJour(new Date(2026, 10, 29, 9, 0), maintenant), -1);
});

test('la semaine : j’organise l’emporte, les sessions finies n’y sont pas', () => {
  const d = (jours, h, organise) => {
    const debut = new Date(2026, 10, 22 + jours, h);
    return { debut, fin: new Date(debut.getTime() + 3_600_000), organise };
  };
  const s = semaine([d(0, 9, false), d(0, 19, false), d(2, 18, true), d(2, 20, false), d(6, 11, false)], maintenant);
  assert.equal(s[0].etat, 'inscrit');
  assert.equal(s[0].sessions.length, 1); // celle de 9h est finie à midi
  assert.equal(s[2].etat, 'organise');
  assert.equal(s[2].sessions.length, 2);
  assert.equal(s[1].etat, 'libre');
  assert.equal(s[6].etat, 'inscrit');
});

test('sports du profil : joués d’abord, puis choisis', () => {
  assert.deepEqual(sportsDuProfil([{ sport: 'padel' }, { sport: 'foot' }, { sport: 'foot' }], ['tennis', 'foot']), ['foot', 'padel', 'tennis']);
});

// Tests de la phrase de Créer (src/lib/phrase-creation.ts) et de « quand » dans cette phrase.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  etapePrecedente,
  etapeSuivante,
  creneauxProposes,
  phraseCreation,
  prochainCreneau,
  retenirCreation,
  sportDansLaPhrase,
} from '../src/lib/phrase-creation.ts';
import { quandCreation } from '../src/lib/formats.ts';

const lire = (morceaux) =>
  morceaux.map((m) => (m.type === 'trou' ? `[${m.texte}]` : m.texte + (m.ponctuation ?? ''))).join(' ');

test('phrase complète', () => {
  const phrase = phraseCreation({
    sport: { cle: 'foot', nom: 'Foot' },
    quand: 'ce soir à 19h',
    duree: '1h30',
    joueurs: 10,
    debutants: true,
    lieu: 'Parc Josaphat',
  });
  assert.equal(
    lire(phrase),
    'Je lance du foot ce soir à 19h pour 1h30, à 10 joueurs, débutants bienvenus. Rendez-vous Parc Josaphat.',
  );
  assert.equal(phrase.filter((m) => m.type === 'trou').length, 0);
});

test('phrase vide : un trou par choix', () => {
  const phrase = phraseCreation({ sport: null, quand: null, duree: null, joueurs: null, debutants: null, lieu: null });
  assert.equal(
    lire(phrase),
    'Je lance [quel sport ?] [quand ?] [combien de temps ?] [combien ?] [quel niveau ?] Rendez-vous [où ?]',
  );
  assert.deepEqual(
    phrase.filter((m) => m.type === 'trou').map((m) => m.champ),
    ['sport', 'quand', 'duree', 'joueurs', 'niveau', 'ou'],
  );
});

test('niveau confirmé', () => {
  const phrase = phraseCreation({ sport: null, quand: null, duree: null, joueurs: null, debutants: false, lieu: null });
  assert.ok(lire(phrase).includes('niveau confirmé.'));
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


test('étapes suivantes et précédentes', () => {
  const toutes = ['sport', 'quand', 'duree', 'joueurs', 'niveau', 'ou'];
  assert.equal(etapeSuivante('sport', toutes), 'quand');
  assert.equal(etapeSuivante('quand', toutes), 'duree');
  assert.equal(etapeSuivante('ou', toutes), null);
  // Depuis un événement : seulement joueurs et niveau
  assert.equal(etapeSuivante('joueurs', ['joueurs', 'niveau']), 'niveau');
  assert.equal(etapeSuivante('niveau', ['joueurs', 'niveau']), null);
  assert.equal(etapePrecedente('joueurs', ['joueurs', 'niveau']), null);
  assert.equal(etapePrecedente('ou', toutes), 'niveau');
});

test('Relancer : la même heure, au prochain créneau', () => {
  const quinzeHeures = new Date(2026, 10, 16, 15, 0);
  assert.deepEqual(prochainCreneau(19, 0, quinzeHeures), new Date(2026, 10, 16, 19, 0));
  assert.deepEqual(prochainCreneau(9, 30, quinzeHeures), new Date(2026, 10, 17, 9, 30));
  // Moins de 10 minutes devant soi : le lendemain
  assert.deepEqual(prochainCreneau(15, 5, quinzeHeures), new Date(2026, 10, 17, 15, 5));
});

test('Relancer : les 3 dernières créations différentes', () => {
  const m = (sport, nom) => ({ sport, joueurs: 4, duree: 90, debutants: true, lieu: { nom } });
  let liste = [];
  liste = retenirCreation(liste, m('foot', 'Josaphat'));
  liste = retenirCreation(liste, m('padel', 'Tour & Taxis'));
  liste = retenirCreation(liste, m('foot', 'Josaphat'));
  assert.deepEqual(liste.map((x) => x.sport), ['foot', 'padel']);
  liste = retenirCreation(liste, m('tennis', 'Forest'));
  liste = retenirCreation(liste, m('basket', 'Cinquantenaire'));
  assert.deepEqual(liste.map((x) => x.sport), ['basket', 'tennis', 'foot']);
});

test('créneaux proposés dans « Quand ? »', () => {
  const titres = (cs) => cs.map((c) => `${c.titre} ${c.sous}`);
  // 15h10 : maintenant, 16h, 17h, 18h, puis demain 18h
  assert.deepEqual(titres(creneauxProposes(new Date(2026, 10, 16, 15, 10))), [
    'Maintenant 15h10',
    '16h aujourd’hui',
    '17h aujourd’hui',
    '18h ce soir',
    'Demain 18h',
  ]);
  // 21h45 : moins de 30 minutes avant 22h, on propose 23h, puis demain
  assert.deepEqual(titres(creneauxProposes(new Date(2026, 10, 16, 21, 45))), [
    'Maintenant 21h45',
    '23h ce soir',
    'Demain 18h',
    'Demain 19h',
    'Demain 20h',
  ]);
  assert.equal(creneauxProposes(new Date(2026, 10, 16, 23, 50)).length, 5);
});

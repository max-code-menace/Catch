// Tests des textes et calculs d'une session (src/lib/formats.ts) : heures, places, distances, annulation.
// À lancer avec `npm test` (Node 24 lit directement le TypeScript).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  annulationLibre,
  descriptionGroupe,
  descriptionPastille,
  distance,
  estEnDirect,
  heure,
  placesLibres,
  quand,
  quandDetail,
  texteDistance,
  texteDuree,
  etiquettePastille,
  jourSection,
  textesBandeau,
  quandFiche,
  textePlaces,
  etiquetteGroupe,
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

test('pastille : en direct, 1 ou 2 places, complet, sinon le moment', () => {
  const direct = new Date(Date.now() - 10 * 60_000);
  assert.equal(etiquettePastille(session(direct, { inscrits: 6 })), 'En direct');
  const demain = new Date(Date.now() + 26 * HEURE);
  assert.equal(etiquettePastille(session(demain, { joueurs: 10, inscrits: 3 })), `Demain ${heure(demain)}`);
  assert.equal(etiquettePastille(session(demain, { joueurs: 4, inscrits: 3 })), `Demain ${heure(demain)} · 1 pl.`);
  assert.equal(etiquettePastille(session(demain, { joueurs: 4, inscrits: 2 })), `Demain ${heure(demain)} · 2 pl.`);
  assert.equal(etiquettePastille(session(demain, { joueurs: 4, inscrits: 4 })), `Demain ${heure(demain)} · complet`);
  const ceSoir = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 19, 0);
  assert.equal(etiquettePastille(session(ceSoir, { joueurs: 10, inscrits: 3 }), maintenant), '19h');
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

test('VoiceOver : la pastille dit le sport, le moment et les places', () => {
  const soir = new Date(2026, 10, 16, 19, 0);
  assert.equal(descriptionPastille(session(soir), maintenant), 'Foot, ce soir 19h, 7 places libres');
  const enCours = new Date(maintenant.getTime() - HEURE / 2);
  assert.equal(descriptionPastille(session(enCours, { inscrits: 9 }), maintenant), 'Foot, en ce moment, 1 place libre');
  assert.equal(descriptionPastille(session(soir, { inscrits: 10 }), maintenant), 'Foot, ce soir 19h, complet');
});

test('bulle de sessions : même sport, sports différents, en direct', () => {
  const foot = (h, j = 16) => session(new Date(2026, 10, j, h, 0));
  const autre = (sport, nomSport, h) => ({ ...foot(h), sport, nomSport });
  assert.equal(etiquetteGroupe([foot(19), foot(18), foot(20), foot(21)], maintenant), 'dès 18h');
  assert.equal(etiquetteGroupe([foot(19, 17), foot(20, 17)], maintenant), 'dès demain 19h');
  assert.equal(etiquetteGroupe([foot(19, 19), foot(20, 19)], maintenant), 'dès jeu. 19h');
  // Une session en cours (11h-12h30, il est midi) : la bulle passe en direct
  assert.equal(etiquetteGroupe([foot(11), foot(19)], maintenant), 'En direct');
});

test('bulle de sessions : ce que lit VoiceOver', () => {
  const foot = (h, j = 16) => session(new Date(2026, 10, j, h, 0));
  const autre = (sport, nomSport, h, j = 16) => ({ ...foot(h, j), sport, nomSport });
  assert.equal(
    descriptionGroupe([foot(19), foot(18), foot(20), foot(21)], maintenant),
    '4 sessions de foot, à partir de 18h',
  );
  assert.equal(
    descriptionGroupe([autre('escalade', 'Escalade', 19, 17), autre('escalade', 'Escalade', 20, 17)], maintenant),
    '2 sessions d’escalade, à partir de demain 19h',
  );
  assert.equal(
    descriptionGroupe([autre('volley', 'Volley', 18, 19), foot(19, 19), autre('padel', 'Padel', 20, 19)], maintenant),
    '3 sessions : volley, foot et padel, à partir de jeudi 18h',
  );
  assert.equal(descriptionGroupe([foot(11), foot(19)], maintenant), '2 sessions de foot, à partir de 19h, dont 1 en ce moment');
  assert.equal(descriptionGroupe([foot(11), foot(11)], maintenant), '2 sessions de foot, en ce moment');
});

test('fiche de la carte : le moment dans la phrase', () => {
  const dans = (heures, minutesEnPlus = 0) => session(new Date(maintenant.getTime() + heures * HEURE + minutesEnPlus * 60_000));
  assert.equal(quandFiche(session(new Date(maintenant.getTime() - 10 * 60_000)), maintenant), 'en direct');
  assert.equal(quandFiche(dans(0, 40), maintenant), 'dans 40 min');
  assert.equal(quandFiche(dans(3), maintenant), 'dans 3 h');
  // Plus tard le même jour : l'heure (un lundi midi, 19h dans 7 h)
  assert.equal(quandFiche(session(new Date(2026, 10, 16, 19, 0)), maintenant), 'ce soir à 19h');
  assert.equal(quandFiche(session(new Date(2026, 10, 17, 18, 0)), maintenant), 'demain à 18h');
  assert.equal(quandFiche(session(new Date(2026, 10, 19, 19, 0)), maintenant), 'jeudi à 19h');
});

test('Mes sessions : titre des rangées et texte sur le terrain', () => {
  // maintenant : lundi 16 novembre à midi
  assert.equal(jourSection(new Date(2026, 10, 16, 19, 0), maintenant), 'Aujourd’hui');
  assert.equal(jourSection(new Date(2026, 10, 17, 9, 0), maintenant), 'Demain');
  assert.equal(jourSection(new Date(2026, 10, 21, 10, 0), maintenant), 'Samedi 21');
  assert.deepEqual(textesBandeau(session(new Date(2026, 10, 16, 15, 0)), maintenant), { petit: '15h', grand: 'Dans 3 h' });
  assert.deepEqual(textesBandeau(session(new Date(2026, 10, 16, 11, 30)), maintenant), { petit: 'Jusqu’à 13h', grand: 'En direct' });
  assert.deepEqual(textesBandeau(session(new Date(2026, 10, 16, 19, 0)), maintenant), { petit: 'Ce soir', grand: '19h' });
  assert.deepEqual(textesBandeau(session(new Date(2026, 10, 18, 20, 0)), maintenant), { petit: 'Jusqu’à 21h30', grand: '20h' });
});

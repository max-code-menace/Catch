// Tests du regroupement des pastilles de sessions (src/lib/regroupement-sessions.ts).
// Règle : jamais deux zones de toucher qui se chevauchent.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MARGE_PASTILLES,
  PASTILLE,
  regrouperSessions,
  taillePastille,
  versEcran,
  zoomPourSeparer,
} from '../src/lib/regroupement-sessions.ts';

const BRUXELLES = { latitude: 50.8467, longitude: 4.3525 };
// Un iPhone de 390 points de large, carte au zoom de départ de l'app
const VUE = { longitudeDelta: 0.11, largeurEcran: 390 };
const HAUTEUR = 844;

// Taille calculée comme dans l'app : « Demain 18h · 1 pl. » sous l'anneau d'une pastille, « dès 18h » sous une bulle
const options = {
  position: (s) => s.position,
  cle: (s) => s.id,
  taille: (liste) =>
    liste.length === 1
      ? taillePastille({ texte: 'Demain 18h · 1 pl.' }, 12)
      : taillePastille({ texte: 'dès demain 18h', groupe: true }, 12),
};

function session(id, latitude, longitude) {
  return { id, position: { latitude, longitude } };
}

/** Vérifie la règle : aucune paire de zones de toucher (avec la marge) ne se chevauche */
function aucunChevauchement(groupes, vue) {
  const boites = groupes.map((g) => ({
    ...versEcran(g.position, BRUXELLES, vue, HAUTEUR),
    ...options.taille(g.elements),
  }));
  for (let i = 0; i < boites.length; i++) {
    for (let j = i + 1; j < boites.length; j++) {
      const a = boites[i];
      const b = boites[j];
      const chevauche =
        Math.abs(a.x - b.x) < (a.largeur + b.largeur) / 2 + MARGE_PASTILLES - 0.01 &&
        Math.abs(a.y - b.y) < (a.hauteur + b.hauteur) / 2 + MARGE_PASTILLES - 0.01;
      assert.ok(!chevauche, `${groupes[i].cle} touche ${groupes[j].cle}`);
    }
  }
}

test('0 session : aucune pastille', () => {
  assert.deepEqual(regrouperSessions([], options, VUE), []);
  assert.equal(zoomPourSeparer([], options, VUE), null);
});

test('deux sessions loin l’une de l’autre restent seules', () => {
  const groupes = regrouperSessions(
    [session('a', 50.8467, 4.3525), session('b', 50.82, 4.4)],
    options,
    VUE,
  );
  assert.deepEqual(groupes.map((g) => g.cle), ['a', 'b']);
});

test('deux sessions exactement au même endroit : une bulle, que le zoom ne sépare jamais', () => {
  const memes = [session('a', 50.8467, 4.3525), session('b', 50.8467, 4.3525)];
  const groupes = regrouperSessions(memes, options, VUE);
  assert.equal(groupes.length, 1);
  assert.equal(groupes[0].cle, 'a|b');
  assert.ok(Math.abs(groupes[0].position.latitude - 50.8467) < 1e-9);
  assert.ok(Math.abs(groupes[0].position.longitude - 4.3525) < 1e-9);
  // Même au zoom le plus fort : toujours ensemble, donc on ouvre la liste
  assert.equal(regrouperSessions(memes, options, { ...VUE, longitudeDelta: 0.0005 }).length, 1);
  assert.equal(zoomPourSeparer(memes, options, VUE), null);
});

test('deux sessions voisines : une bulle, et toucher la bulle zoome jusqu’à les séparer', () => {
  // ≈ 150 m d'écart : ensemble au zoom de départ, séparées quand on zoome
  const voisines = [session('a', 50.8467, 4.3525), session('b', 50.8467, 4.3546)];
  assert.equal(regrouperSessions(voisines, options, VUE).length, 1);
  const zoom = zoomPourSeparer(voisines, options, VUE);
  assert.ok(zoom);
  assert.ok(zoom.longitudeDelta < VUE.longitudeDelta);
  assert.equal(regrouperSessions(voisines, options, { ...VUE, longitudeDelta: zoom.longitudeDelta }).length, 2);
  assert.ok(Math.abs(zoom.centre.longitude - 4.35355) < 1e-9);
});

test('50 sessions : chacune une seule fois, et plus aucun chevauchement, à tous les zooms', () => {
  // Positions fixes mais dispersées autour de Bruxelles (pas de hasard : le test donne toujours le même résultat)
  const sessions = Array.from({ length: 50 }, (_, i) =>
    session(`s${String(i).padStart(2, '0')}`, 50.8467 + Math.sin(i * 12.9898) * 0.04, 4.3525 + Math.cos(i * 78.233) * 0.06),
  );
  for (const longitudeDelta of [0.4, 0.11, 0.05, 0.02, 0.005]) {
    const vue = { ...VUE, longitudeDelta };
    const groupes = regrouperSessions(sessions, options, vue);
    const ids = groupes.flatMap((g) => g.elements.map((s) => s.id)).sort();
    assert.deepEqual(ids, sessions.map((s) => s.id).sort());
    aucunChevauchement(groupes, vue);
  }
  // Plus on zoome, plus il y a de pastilles
  const dezoome = regrouperSessions(sessions, options, { ...VUE, longitudeDelta: 0.4 }).length;
  const zoome = regrouperSessions(sessions, options, { ...VUE, longitudeDelta: 0.005 }).length;
  assert.ok(dezoome < zoome);
  // L'ordre reçu ne change rien
  const melange = [...sessions].reverse();
  assert.deepEqual(
    regrouperSessions(melange, options, VUE).map((g) => g.cle),
    regrouperSessions(sessions, options, VUE).map((g) => g.cle),
  );
});

test('pastille au bord de l’écran : se regroupe avec sa voisine cachée, et ne dépend pas de l’endroit regardé', () => {
  // Bord droit de l'écran quand on regarde la Grand-Place ; la voisine est 20 m plus à l'est, hors de l'écran
  const bord = BRUXELLES.longitude + VUE.longitudeDelta / 2;
  const sessions = [session('a', 50.8467, bord), session('b', 50.8467, bord + 0.0003), session('c', 50.83, 4.3525)];
  const groupes = regrouperSessions(sessions, options, VUE);
  assert.deepEqual(groupes.map((g) => g.cle).sort(), ['a|b', 'c']);
  // La pastille du bord tombe bien au bord de l'écran
  const { x } = versEcran(sessions[0].position, BRUXELLES, VUE, HAUTEUR);
  assert.ok(Math.abs(x - VUE.largeurEcran) < 0.5);
});

test('zone de toucher d’une pastille : l’anneau et son étiquette, jamais moins de 44 points', () => {
  const court = taillePastille({ texte: '19h' }, 12);
  const long = taillePastille({ texte: 'Demain 22h20 · 1 pl.' }, 12);
  // Une étiquette courte tient sous l'anneau ; une longue l'élargit
  assert.equal(court.largeur, PASTILLE.anneau);
  assert.ok(long.largeur > court.largeur);
  assert.equal(court.hauteur, PASTILLE.anneau + PASTILLE.etiquette - PASTILLE.recouvrement);
  assert.ok(taillePastille({ texte: '' }, 12).largeur >= 44);
  // Texte grossi par l'iPhone : plus large
  assert.ok(taillePastille({ texte: 'Demain 22h20 · 1 pl.' }, 12, 1.3).largeur > long.largeur);
  // Le disque d'une bulle est plus petit que l'anneau
  assert.ok(taillePastille({ texte: 'dès 18h', groupe: true }, 12).hauteur < court.hauteur);
});

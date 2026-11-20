// Tests du Catch, de la création et de l'annulation côté app (src/lib/regles-sessions.ts).
// Les règles de la base (place libre, limites, organisateur) sont testées par supabase/tests/catch.sql.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { annulationLibre } from '../src/lib/formats.ts';
import {
  appliquerInscription,
  choixAnnulation,
  dernierInscrit,
  etapePublication,
  interpreterCatch,
  interpreterCreation,
  ligneNouvelleSession,
  texteAnnulationSession,
} from '../src/lib/regles-sessions.ts';

const HEURE = 3_600_000;
const maintenant = new Date(2026, 10, 20, 12, 0);

// ——— Catch ———

test('Catch : chaque réponse de la base donne le bon résultat', () => {
  assert.equal(interpreterCatch('ok', false), 'ok');
  assert.equal(interpreterCatch('complete', false), 'complete');
  assert.equal(interpreterCatch('limite', false), 'limite');
  assert.equal(interpreterCatch('terminee', false), 'terminee');
  // Session supprimée, ou organisateur qui nous a bloqués : on ne dit pas pourquoi
  assert.equal(interpreterCatch('introuvable', false), 'terminee');
});

test('Catch : une panne n’est jamais prise pour une place obtenue', () => {
  assert.equal(interpreterCatch('ok', true), 'erreur');
  assert.equal(interpreterCatch(null, false), 'erreur');
  assert.equal(interpreterCatch('reponse-inconnue', false), 'erreur');
  assert.equal(interpreterCatch(undefined, true), 'erreur');
});

test('Catch : je m’ajoute une seule fois, et je me retire sans toucher aux autres', () => {
  const moi = { id: 'moi', prenom: 'Max' };
  const sarah = { id: 'sarah', prenom: 'Sarah' };
  assert.deepEqual(appliquerInscription([sarah], moi, true), [sarah, moi]);
  // Déjà inscrit (double appui, réponse en retard) : pas de doublon
  assert.deepEqual(appliquerInscription([sarah, moi], moi, true), [sarah, moi]);
  assert.deepEqual(appliquerInscription([sarah, moi], moi, false), [sarah]);
  assert.deepEqual(appliquerInscription([sarah], moi, false), [sarah]);
});

// ——— Création ———

const nouvelle = {
  sport: 'foot',
  titre: 'Foot',
  lieu: 'Parc du Cinquantenaire',
  commune: 'Bruxelles',
  position: { latitude: 50.84, longitude: 4.39 },
  debut: new Date(Date.UTC(2026, 10, 20, 18, 0)),
  fin: new Date(Date.UTC(2026, 10, 20, 19, 30)),
  joueurs: 10,
  debutantsBienvenus: true,
};

test('Création : seulement les champs du formulaire sont envoyés', () => {
  const ligne = ligneNouvelleSession(nouvelle);
  assert.deepEqual(Object.keys(ligne).sort(), [
    'a_savoir_detail', 'a_savoir_titre', 'commune', 'debut', 'debutants_bienvenus', 'evenement_id',
    'fin', 'joueurs', 'lat', 'lieu', 'lng', 'sport', 'titre',
  ]);
  // Jamais l'organisateur ni la date de création : c'est la base qui les impose
  assert.ok(!('organisateur_id' in ligne) && !('cree_le' in ligne));
  assert.equal(ligne.debut, '2026-11-20T18:00:00.000Z');
  assert.equal(ligne.lat, 50.84);
  assert.equal(ligne.evenement_id, null);
  assert.equal(ligneNouvelleSession({ ...nouvelle, evenementId: 'ev1' }).evenement_id, 'ev1');
});

test('Création : réponse de la base', () => {
  assert.deepEqual(interpreterCreation({ id: 'abc' }, null), { id: 'abc' });
  assert.equal(interpreterCreation(null, { message: 'limite_sessions : 6 par 24 h' }), 'limite');
  assert.equal(interpreterCreation(null, { message: 'Failed to fetch' }), null);
  assert.equal(interpreterCreation(null, null), null);
  assert.equal(interpreterCreation({}, null), null);
});

test('Création : on demande le sport, puis le lieu, puis la connexion', () => {
  assert.equal(etapePublication({ sportChoisi: false, lieuChoisi: false, connecte: false }), 'sport');
  assert.equal(etapePublication({ sportChoisi: false, lieuChoisi: true, connecte: true }), 'sport');
  // Jamais de lieu par défaut publié par mégarde
  assert.equal(etapePublication({ sportChoisi: true, lieuChoisi: false, connecte: true }), 'lieu');
  assert.equal(etapePublication({ sportChoisi: true, lieuChoisi: true, connecte: false }), 'connexion');
  assert.equal(etapePublication({ sportChoisi: true, lieuChoisi: true, connecte: true }), 'envoyer');
});

// ——— Annulation ———

const session = (debutDansH, organisateurId = 'sarah', idsInscrits = ['sarah', 'moi']) => ({
  debut: new Date(maintenant.getTime() + debutDansH * HEURE),
  fin: new Date(maintenant.getTime() + (debutDansH + 1.5) * HEURE),
  organisateurId,
  idsInscrits,
});
const choix = (s, moi = 'moi') => choixAnnulation(s, moi, { libre: annulationLibre(s, maintenant) });

test('Annulation : libre jusqu’à 3 h avant, puis confirmation', () => {
  assert.equal(choix(session(24)), 'quitter');
  assert.equal(choix(session(3.5)), 'quitter');
  assert.equal(choix(session(2)), 'confirmer_quitter');
  // Déjà commencée
  assert.equal(choix(session(-0.5)), 'confirmer_quitter');
});

test('Annulation : l’organisateur ne quitte jamais sa session, il l’annule pour tout le monde', () => {
  assert.equal(choix(session(24, 'moi')), 'annuler_session');
  assert.equal(choix(session(1, 'moi')), 'annuler_session');
  // Pas connecté : jamais « annuler la session »
  assert.equal(choixAnnulation(session(24, 'moi'), null, { libre: true }), 'quitter');
});

test('Annulation par l’organisateur : le texte dit qui sera prévenu', () => {
  assert.equal(texteAnnulationSession({ idsInscrits: ['moi'] }, 'moi'), 'Elle disparaîtra de la carte.');
  assert.equal(
    texteAnnulationSession({ idsInscrits: ['moi', 'sarah'] }, 'moi'),
    'Elle disparaîtra de la carte et la personne inscrite sera prévenue.',
  );
  assert.equal(
    texteAnnulationSession({ idsInscrits: ['moi', 'a', 'b', 'c'] }, 'moi'),
    'Elle disparaîtra de la carte et les 3 inscrits seront prévenus.',
  );
});

test('Annulation : seul inscrit restant, la session disparaît', () => {
  assert.equal(dernierInscrit({ idsInscrits: ['moi'] }, 'moi'), true);
  assert.equal(dernierInscrit({ idsInscrits: ['moi', 'sarah'] }, 'moi'), false);
});

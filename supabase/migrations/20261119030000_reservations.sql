-- Lien de réservation par sport pour les lieux payants : on tombe directement sur la page
-- qui sert à réserver ce sport-là (par exemple le padel d'un centre qui fait aussi du tennis).
-- Clé = sport (même nom que dans `sports`), valeur = adresse de la page. Sans lien pour un sport,
-- l'app retombe sur `site`. Ne supprime rien.
-- Liens trouvés le 19 novembre 2026 (pages Playtomic des clubs), pas encore vérifiés par Maxime.

alter table public.lieux add column if not exists reservations jsonb not null default '{}'::jsonb;

update public.lieux set reservations = reservations || jsonb_build_object('padel', 'https://playtomic.com/fr/clubs/tourtaxis-padel-club-brussels')
  where nom = 'Tour & Taxis Padel Club';
update public.lieux set reservations = reservations || jsonb_build_object('padel', 'https://playtomic.com/fr/clubs/tero-padel-club-louise')
  where nom = 'Tero Padel Club Louise';
update public.lieux set reservations = reservations || jsonb_build_object('padel', 'https://playtomic.com/fr/clubs/parc-sportif-3-tilleuls')
  where nom = 'Parc sportif des Trois Tilleuls';

-- Événements de 2027 dont la date, l'heure et le départ sont confirmés sur le site de l'organisateur
-- (relevés le 19 novembre 2026). Ils apparaîtront tout seuls sur la carte 2 semaines avant. Ne supprime rien.
insert into public.evenements (nom, sport, detail, debut, depart, commune, lat, lng, lien) values
  ('Relais Givrés', 'course', 'Relais par équipes de 5, 44 km', '2027-01-16 11:00+01', 'Centre sportif Nelson Mandela', 'Neder-Over-Heembeek', 50.9001948, 4.3980838, 'https://www.relaisgivres.be/index.php/fr/info'),
  ('20 km de Bruxelles', 'course', '20 km, départ par vagues', '2027-05-30 10:00+02', 'Parc du Cinquantenaire', 'Bruxelles', 50.8402489, 4.3939746, 'https://www.20kmdebruxelles.be/general/')
on conflict (nom) do nothing;

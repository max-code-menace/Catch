-- Étape 12 : les lieux de sport (terrains publics gratuits et salles payantes), affichés sur la carte.
-- Lecture ouverte à tous (même sans compte), aucune écriture depuis l'app : les lieux sont choisis à la main.
-- Ne supprime rien. Les lieux viennent de docs/lieux-a-verifier.md (pas encore vérifiés par Maxime) :
-- seulement ceux qui ont une adresse ou un endroit précis, sans les lignes ⚠️.
-- Coordonnées : géocodage OpenStreetMap (Nominatim), le 19 novembre 2026.

create table if not exists public.lieux (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  sports text[] not null check (cardinality(sports) > 0),
  type text not null check (type in ('gratuit', 'payant')),
  adresse text not null,
  commune text not null,
  site text,
  lat double precision not null,
  lng double precision not null,
  cree_le timestamptz not null default now()
);

alter table public.lieux enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lieux' and policyname = 'lieux lisibles par tous') then
    create policy "lieux lisibles par tous" on public.lieux for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.lieux to anon, authenticated;

insert into public.lieux (nom, sports, type, adresse, commune, site, lat, lng) values
  ('Petite Île', array['escalade'], 'payant', 'Rue de la Petite Île 1A', 'Anderlecht', null, 50.831590, 4.322082),
  ('À Bloc', array['escalade'], 'payant', 'Avenue Léonard Mommaerts 11', 'Evere', null, 50.856334, 4.410861),
  ('Maniak Padoue', array['escalade'], 'payant', 'Rue des Moines 26', 'Forest', null, 50.827693, 4.331978),
  ('Palais du Midi', array['tennis', 'basket'], 'payant', 'Rue Roger Van der Weyden 3', 'Bruxelles', null, 50.841903, 4.343480),
  ('Brussels Badminton Club', array['badminton'], 'payant', 'Rue des Lapins 32', 'Anderlecht', 'https://www.brusselsbadminton.be/', 50.824166, 4.276325),
  ('Fitfive', array['foot'], 'payant', 'Rue Tielemans 2', 'Laeken', 'https://www.fitfive.be/fitfive-bruxelles/', 50.874637, 4.345179),
  ('City Five', array['foot'], 'payant', 'Rue de l''Indépendance 83', 'Molenbeek-Saint-Jean', 'https://www.cityfive.be/', 50.853083, 4.328952),
  ('Royal Foot Indoor', array['foot'], 'payant', 'Rue de la Bienvenue 13', 'Anderlecht', 'https://royalfootindoor.be/', 50.813723, 4.303347),
  ('Centre sportif Albert Demuyter', array['volley'], 'payant', 'Rue Volta 18', 'Ixelles', null, 50.813817, 4.395270),
  ('NBS Boxing', array['boxe'], 'payant', 'Rue Neuve 123', 'Bruxelles', 'https://www.nbsboxing.com/', 50.854939, 4.358562),
  ('VS Boxing', array['boxe'], 'payant', 'Avenue De Fré 82', 'Uccle', 'https://vsboxing.com/', 50.804846, 4.356513),
  ('Champion''s Academy', array['boxe'], 'payant', 'Rue de l''Escaut 25', 'Molenbeek-Saint-Jean', 'https://www.champions-academy.be/', 50.866289, 4.342024),
  ('Brussels Boxing Club', array['boxe'], 'payant', 'Rue des Capucins 19', 'Bruxelles', 'https://sport.brussels/clubs/brussels-boxing-club/', 50.838285, 4.346581),
  ('Boxing Club MG', array['boxe'], 'payant', 'Rue Verte 50', 'Saint-Josse-ten-Noode', 'https://sport.brussels/clubs/boxing-club-mg/', 50.857259, 4.364602),
  ('HBB Boksclub', array['boxe'], 'payant', 'Chaussée de Helmet 75', 'Schaerbeek', null, 50.870232, 4.382007),
  ('Tour & Taxis Padel Club', array['padel'], 'payant', 'Drève des Rêves, Tour & Taxis', 'Bruxelles', null, 50.865512, 4.348199),
  ('Tero Padel Club Louise', array['padel'], 'payant', 'Rue du Beau Site', 'Bruxelles', null, 50.829085, 4.364034),
  ('Centre sportif Mounier', array['padel', 'tennis', 'badminton', 'squash'], 'payant', 'Avenue Emmanuel Mounier', 'Woluwe-Saint-Lambert', 'https://www.mounier.be/', 50.851061, 4.458614),
  ('Parc sportif des Trois Tilleuls', array['volley', 'padel', 'squash'], 'payant', 'Avenue des Naïades', 'Watermael-Boitsfort', null, 50.806654, 4.410807),
  ('Boulodrome Charles Picqué', array['petanque'], 'gratuit', 'Rue de l''Hôtel des Monnaies 110', 'Saint-Gilles', 'https://sport.brussels/infrastructures/boulodrome-charles-picque/', 50.829541, 4.347931),
  ('Boulodrome du parc Garcet', array['petanque'], 'gratuit', 'Rue Léon Theodor 217', 'Jette', 'https://sport.brussels/infrastructures/boulodrome-du-parc-garcet/', 50.879256, 4.329478),
  ('Parc Malou', array['petanque'], 'gratuit', 'Parc Malou', 'Woluwe-Saint-Lambert', null, 50.842393, 4.439755),
  ('Parc Tenbosch', array['petanque'], 'gratuit', 'Parc Tenbosch', 'Ixelles', null, 50.820027, 4.364306),
  ('Parc Jadot', array['petanque'], 'gratuit', 'Parc Jadot', 'Ixelles', null, 50.821724, 4.378214),
  ('Place De Linde', array['petanque'], 'gratuit', 'Place De Linde', 'Anderlecht', null, 50.835760, 4.299643),
  ('Parc Tercoigne', array['petanque'], 'gratuit', 'Parc Tercoigne', 'Watermael-Boitsfort', null, 50.813378, 4.403195),
  ('Place De Brouckère', array['pingpong'], 'gratuit', 'Place De Brouckère', 'Bruxelles', null, 50.851459, 4.352825),
  ('Square Marguerite', array['pingpong', 'basket', 'foot'], 'gratuit', 'Square Marguerite', 'Bruxelles', null, 50.847017, 4.385965),
  ('Square Prince Léopold', array['pingpong'], 'gratuit', 'Square Prince Léopold', 'Laeken', null, 50.883651, 4.341048),
  ('Place du Nouveau Marché aux Grains', array['pingpong'], 'gratuit', 'Place du Nouveau Marché aux Grains', 'Bruxelles', null, 50.850861, 4.344518),
  ('Place Fontainas', array['pingpong'], 'gratuit', 'Place Fontainas', 'Bruxelles', null, 50.845246, 4.346389),
  ('Plaine Renier Chalon', array['pingpong', 'basket', 'foot'], 'gratuit', 'Plaine de jeux Renier Chalon', 'Ixelles', null, 50.818827, 4.360009),
  ('Paradis des enfants', array['basket', 'foot'], 'gratuit', 'Parc du Paradis des Enfants', 'Etterbeek', null, 50.829559, 4.405608),
  ('Place du Rinsdelle', array['basket'], 'gratuit', 'Place du Rinsdelle', 'Etterbeek', null, 50.833981, 4.395782),
  ('Agoraspace Parc des Muses', array['basket', 'streetworkout'], 'gratuit', 'Parc des Muses', 'Molenbeek-Saint-Jean', 'https://sport.brussels/infrastructures/agoraspace-parc-des-muses/', 50.854665, 4.316892),
  ('Parc du Cinquantenaire', array['basket', 'streetworkout'], 'gratuit', 'Parc du Cinquantenaire', 'Bruxelles', 'https://sport.brussels/infrastructures/parc-du-cinquantenaire/', 50.841037, 4.393492),
  ('Parc de la Sauvagère', array['basket'], 'gratuit', 'Parc de la Sauvagère', 'Uccle', null, 50.788337, 4.348863),
  ('Parc Georges Henri', array['streetworkout'], 'gratuit', 'Rue du Menuisier 2', 'Woluwe-Saint-Lambert', null, 50.844556, 4.419164)
on conflict (nom) do nothing;

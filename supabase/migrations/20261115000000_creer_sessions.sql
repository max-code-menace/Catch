-- Sessions de sport affichées sur la carte (étape 2).
-- Lecture ouverte à tous (pas de compte pour regarder). L'écriture arrivera avec la connexion (étapes 5 et 6).
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre')),
  titre text check (titre is null or char_length(titre) between 1 and 60),
  lieu_nom text not null check (char_length(lieu_nom) between 1 and 80),
  commune text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  debut timestamptz not null,
  fin timestamptz not null,
  joueurs_max int not null check (joueurs_max between 2 and 60),
  inscrits int not null default 1 check (inscrits >= 0),
  debutants_bienvenus boolean not null default false,
  cree_le timestamptz not null default now(),
  check (fin > debut),
  check (inscrits <= joueurs_max)
);

create index sessions_fin_idx on public.sessions (fin);
create index sessions_lat_lng_idx on public.sessions (lat, lng);

alter table public.sessions enable row level security;

create policy "Tout le monde peut voir les sessions"
  on public.sessions for select
  to anon, authenticated
  using (true);

revoke all on public.sessions from anon, authenticated;
grant select on public.sessions to anon, authenticated;

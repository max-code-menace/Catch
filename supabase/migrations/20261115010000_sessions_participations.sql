-- Vraies données : profils, sessions, participations (les Catchs).
-- Tout le monde peut regarder (pas de compte pour voir la carte) ; il faut être connecté pour créer, catcher, annuler.

-- La première table `sessions` (vide) est remplacée par celle-ci.
drop table if exists public.sessions;

create schema if not exists private;

-- Profil public d'un compte : seulement le prénom.
create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '' check (char_length(prenom) <= 40)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  organisateur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  sport text not null check (sport in ('foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre')),
  titre text not null check (char_length(titre) between 1 and 60),
  lieu text not null check (char_length(lieu) between 1 and 80),
  commune text not null default '' check (char_length(commune) <= 60),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  debut timestamptz not null,
  fin timestamptz not null,
  joueurs int not null check (joueurs between 2 and 60),
  debutants_bienvenus boolean not null default true,
  a_savoir_titre text check (a_savoir_titre is null or char_length(a_savoir_titre) <= 60),
  a_savoir_detail text check (a_savoir_detail is null or char_length(a_savoir_detail) <= 120),
  cree_le timestamptz not null default now(),
  check (fin > debut),
  check (fin - debut <= interval '12 hours')
);
create index sessions_fin_idx on public.sessions (fin);
create index sessions_organisateur_idx on public.sessions (organisateur_id);

-- Un Catch = une ligne.
create table public.participations (
  session_id uuid not null references public.sessions (id) on delete cascade,
  joueur_id uuid not null references public.profils (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (session_id, joueur_id)
);
create index participations_joueur_idx on public.participations (joueur_id);

alter table public.profils enable row level security;
alter table public.sessions enable row level security;
alter table public.participations enable row level security;

revoke all on public.profils, public.sessions, public.participations from anon, authenticated;
grant select on public.profils, public.sessions, public.participations to anon, authenticated;
grant insert on public.sessions to authenticated;
grant delete on public.participations to authenticated;

create policy "Tout le monde voit les prénoms" on public.profils
  for select to anon, authenticated using (true);

create policy "Tout le monde voit les sessions" on public.sessions
  for select to anon, authenticated using (true);

create policy "Un compte crée ses propres sessions" on public.sessions
  for insert to authenticated
  with check (
    organisateur_id = (select auth.uid())
    and fin > now()
    and debut < now() + interval '60 days'
  );

create policy "Tout le monde voit les inscrits" on public.participations
  for select to anon, authenticated using (true);

create policy "On annule sa propre participation" on public.participations
  for delete to authenticated using (joueur_id = (select auth.uid()));

-- Le prénom est enregistré à la connexion (données du compte) : on le recopie dans le profil public.
create function private.synchroniser_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, prenom)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 40))
  on conflict (id) do update set prenom = excluded.prenom;
  return new;
end;
$$;

create trigger synchroniser_profil
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function private.synchroniser_profil();

insert into public.profils (id, prenom)
select id, left(coalesce(raw_user_meta_data ->> 'prenom', ''), 40) from auth.users
on conflict (id) do nothing;

-- L'organisateur est inscrit d'office à sa session.
create function private.inscrire_organisateur() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.participations (session_id, joueur_id) values (new.id, new.organisateur_id);
  return new;
end;
$$;

create trigger inscrire_organisateur
  after insert on public.sessions
  for each row execute function private.inscrire_organisateur();

-- Catcher une session. La place est vérifiée ici, ligne verrouillée : deux personnes ne peuvent pas prendre la dernière place.
-- Renvoie 'ok', 'complete', 'terminee' ou 'introuvable'.
create function public.catcher(p_session uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  places int;
  fin_session timestamptz;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  select joueurs, fin into places, fin_session from public.sessions where id = p_session for update;
  if not found then return 'introuvable'; end if;
  if fin_session <= now() then return 'terminee'; end if;
  if exists (select 1 from public.participations where session_id = p_session and joueur_id = moi) then
    return 'ok';
  end if;
  if (select count(*) from public.participations where session_id = p_session) >= places then
    return 'complete';
  end if;
  insert into public.participations (session_id, joueur_id) values (p_session, moi);
  return 'ok';
end;
$$;

revoke all on function public.catcher(uuid) from public, anon;
grant execute on function public.catcher(uuid) to authenticated;

-- Ce que l'app lit : les sessions avec le prénom de l'organisateur et la liste des inscrits (organisateur en premier).
-- Une session que tout le monde a quittée n'apparaît plus.
create view public.sessions_visibles with (security_invoker = true) as
select
  s.id, s.organisateur_id, o.prenom as organisateur, s.sport, s.titre, s.lieu, s.commune, s.lat, s.lng,
  s.debut, s.fin, s.joueurs, s.debutants_bienvenus, s.a_savoir_titre, s.a_savoir_detail,
  i.inscrits
from public.sessions s
join public.profils o on o.id = s.organisateur_id
cross join lateral (
  select jsonb_agg(
    jsonb_build_object('id', p.joueur_id, 'prenom', pr.prenom)
    order by (p.joueur_id = s.organisateur_id) desc, p.cree_le
  ) as inscrits
  from public.participations p
  join public.profils pr on pr.id = p.joueur_id
  where p.session_id = s.id
) i
where i.inscrits is not null;

revoke all on public.sessions_visibles from anon, authenticated;
grant select on public.sessions_visibles to anon, authenticated;

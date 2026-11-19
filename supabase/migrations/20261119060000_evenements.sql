-- Étape 13 : les événements sportifs ouverts à tous (courses, randos vélo…), affichés sur la carte
-- au point de départ, seulement pendant les 7 jours qui précèdent (comme les sessions).
-- Lecture ouverte à tous, aucune écriture depuis l'app : les événements sont choisis à la main.
-- Une session peut être rattachée à un événement (« On y va ensemble »). Ne supprime rien.

create table if not exists public.evenements (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique check (char_length(nom) between 1 and 80),
  sport text not null,
  -- Ce qu'on y fait, en une ligne : « 5 et 10 km »
  detail text check (detail is null or char_length(detail) <= 80),
  debut timestamptz not null,
  depart text not null check (char_length(depart) between 1 and 80),
  commune text not null check (char_length(commune) <= 60),
  lat double precision not null,
  lng double precision not null,
  -- Page officielle pour s'inscrire
  lien text not null,
  cree_le timestamptz not null default now()
);

alter table public.evenements enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'evenements' and policyname = 'evenements lisibles par tous') then
    create policy "evenements lisibles par tous" on public.evenements for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.evenements to anon, authenticated;

alter table public.sessions add column if not exists evenement_id uuid references public.evenements (id) on delete set null;
create index if not exists sessions_evenement_id on public.sessions (evenement_id);

-- Même vue qu'avant (garde-fous du 16 novembre), avec l'événement en plus à la fin
create or replace view public.sessions_visibles with (security_invoker = false) as
  select s.id,
    s.organisateur_id,
    o.prenom as organisateur,
    s.sport,
    s.titre,
    s.lieu,
    s.commune,
    s.lat,
    s.lng,
    s.debut,
    s.fin,
    s.joueurs,
    s.debutants_bienvenus,
    s.a_savoir_titre,
    s.a_savoir_detail,
    i.inscrits,
    s.evenement_id
  from public.sessions s
    join public.profils o on o.id = s.organisateur_id
    cross join lateral (
      select jsonb_agg(jsonb_build_object(
          'id', case when (select auth.uid()) is null then null::uuid else p.joueur_id end,
          'prenom', left(btrim(pr.prenom), 2))
        order by (p.joueur_id = s.organisateur_id) desc, p.cree_le) as inscrits
      from public.participations p
        join public.profils pr on pr.id = p.joueur_id
      where p.session_id = s.id) i
  where i.inscrits is not null
    and s.annulee_le is null
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = (select auth.uid()) and b.bloque_id = s.organisateur_id);

revoke all on public.sessions_visibles from anon, authenticated;
grant select on public.sessions_visibles to anon, authenticated;

-- Premiers événements (Bruxelles), relevés le 19 novembre 2026 sur les sites des organisateurs.
-- Heures de Bruxelles. Coordonnées : OpenStreetMap (Nominatim).
insert into public.evenements (nom, sport, detail, debut, depart, commune, lat, lng, lien) values
  ('Les Foulées Joyeuses', 'course', '5 et 10 km dans le parc', '2026-11-22 11:00+01', 'La Cité Joyeuse', 'Molenbeek-Saint-Jean', 50.8549496, 4.2993864, 'https://www.otop.be/lesfouleesjoyeuses/jogging/informations'),
  ('Corrida Brussels', 'course', '5 km à 18h, 10 km à 19h', '2026-12-19 18:00+01', 'Sportcity', 'Woluwe-Saint-Pierre', 50.8308409, 4.4552962, 'https://www.corridabrussels.be/inscriptions'),
  ('Manneken-Pis Corrida', 'course', '6 km de nuit dans le centre', '2026-12-26 20:45+01', 'Mont des Arts', 'Bruxelles', 50.8438626, 4.3567662, 'https://mannekenpiscorrida.zatopekevent.com/inscription-a-la-manneken-pis-corrida/')
on conflict (nom) do nothing;

-- Garde-fous avant d'ouvrir l'app à des inconnus :
-- 1. limites anti-spam (sessions, messages, signalements),
-- 2. alerte à l'équipe à chaque signalement,
-- 3. sans compte, on ne lit plus que ce que la carte affiche (plus d'accès direct aux tables),
-- 4. « nouvelle session d'un sport suivi » limitée à la zone de chacun.
-- Rien n'est supprimé.

-- ---------------------------------------------------------------------------
-- 1. Limites par compte
-- ---------------------------------------------------------------------------
create function private.limiter_sessions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.sessions
    where organisateur_id = new.organisateur_id and cree_le > now() - interval '24 hours'
  ) >= 6 then
    raise exception 'limite_sessions' using hint = 'Pas plus de 6 sessions créées par 24 heures.';
  end if;
  return new;
end;
$$;
create trigger limiter_sessions
  before insert on public.sessions
  for each row execute function private.limiter_sessions();

create function private.limiter_messages() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.messages
    where auteur_id = new.auteur_id and cree_le > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'limite_messages' using hint = 'Pas plus de 20 messages par minute.';
  end if;
  return new;
end;
$$;
create trigger limiter_messages
  before insert on public.messages
  for each row execute function private.limiter_messages();

create function private.limiter_signalements() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.signalements
    where auteur_id = new.auteur_id and cree_le > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'limite_signalements' using hint = 'Pas plus de 20 signalements par 24 heures.';
  end if;
  return new;
end;
$$;
create trigger limiter_signalements
  before insert on public.signalements
  for each row execute function private.limiter_signalements();

-- ---------------------------------------------------------------------------
-- 2. Alerte à chaque signalement : une notification aux comptes de l'équipe.
-- Pour ajouter quelqu'un : une ligne dans private.moderateurs (depuis le site Supabase).
-- ---------------------------------------------------------------------------
create table private.moderateurs (
  joueur_id uuid primary key references public.profils (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);
alter table private.moderateurs enable row level security;

create function private.prevenir_signalement() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  equipe uuid[];
  motifs constant jsonb := '{"comportement": "Comportement déplacé", "contenu": "Contenu inapproprié", "faux": "Fausse session ou arnaque", "danger": "Quelqu’un se sent en danger", "autre": "Autre"}';
begin
  select array_agg(joueur_id) into equipe from private.moderateurs;
  if equipe is null then return new; end if;
  perform private.pousser(
    equipe,
    'Signalement : ' || coalesce(motifs ->> new.motif, new.motif),
    'Sur ' || case new.cible when 'session' then 'une session' when 'message' then 'un message' else 'une personne' end
      || coalesce(' · ' || left(new.details, 120), '') || '. À lire dans la table signalements.',
    jsonb_build_object('type', 'signalement')
  );
  return new;
end;
$$;
create trigger prevenir_signalement
  after insert on public.signalements
  for each row execute function private.prevenir_signalement();

-- ---------------------------------------------------------------------------
-- 3. Lecture sans compte : seulement la vue des sessions, avec des initiales.
-- La vue lit désormais les tables avec ses propres droits (security_invoker = false) :
-- c'est voulu, pour pouvoir retirer aux visiteurs l'accès direct aux tables
-- (qui montrait les prénoms complets et qui participe à quoi).
-- Elle ne montre que : l'organisateur (prénom), et pour chaque inscrit les deux premières lettres du prénom.
-- L'identifiant des inscrits n'est donné qu'aux comptes connectés (l'app s'en sert pour reconnaître « Toi »).
-- ---------------------------------------------------------------------------
create or replace view public.sessions_visibles with (security_invoker = false) as
select
  s.id, s.organisateur_id, o.prenom as organisateur, s.sport, s.titre, s.lieu, s.commune, s.lat, s.lng,
  s.debut, s.fin, s.joueurs, s.debutants_bienvenus, s.a_savoir_titre, s.a_savoir_detail,
  i.inscrits
from public.sessions s
join public.profils o on o.id = s.organisateur_id
cross join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', case when (select auth.uid()) is null then null else p.joueur_id end,
      'prenom', left(btrim(pr.prenom), 2)
    )
    order by (p.joueur_id = s.organisateur_id) desc, p.cree_le
  ) as inscrits
  from public.participations p
  join public.profils pr on pr.id = p.joueur_id
  where p.session_id = s.id
) i
where i.inscrits is not null
  and s.annulee_le is null
  and not exists (
    select 1 from public.blocages b
    where b.bloqueur_id = (select auth.uid()) and b.bloque_id = s.organisateur_id
  );

revoke all on public.sessions_visibles from anon, authenticated;
grant select on public.sessions_visibles to anon, authenticated;

-- Plus d'accès direct aux tables sans compte.
revoke select on public.sessions, public.participations, public.profils, public.blocages from anon;

-- Fonction technique de Supabase : personne n'a à l'appeler depuis l'app.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. « Nouvelle session d'un sport suivi » : seulement près de chez soi.
-- L'app enregistre le centre de la zone de chacun (sa position si elle est connue, sinon le centre de Bruxelles).
-- ---------------------------------------------------------------------------
alter table public.reglages_notifications add column zone_lat double precision check (zone_lat between -90 and 90);
alter table public.reglages_notifications add column zone_lng double precision check (zone_lng between -180 and 180);
grant insert (zone_lat, zone_lng) on public.reglages_notifications to authenticated;
grant update (zone_lat, zone_lng) on public.reglages_notifications to authenticated;

-- Distance à vol d'oiseau, en kilomètres.
create function private.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable set search_path = '' as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function private.prevenir_nouvelle_session() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  joueurs uuid[];
begin
  with prevenus as (
    update public.reglages_notifications r set derniere_nouvelle_session = now()
    where r.nouvelle_session
      and new.sport = any (r.sports)
      and r.joueur_id <> new.organisateur_id
      and (r.derniere_nouvelle_session is null or r.derniere_nouvelle_session < now() - interval '24 hours')
      -- À moins de 15 km du centre de sa zone ; sans zone enregistrée (anciens réglages), on prévient comme avant
      and (
        r.zone_lat is null or r.zone_lng is null
        or private.distance_km(r.zone_lat, r.zone_lng, new.lat, new.lng) <= 15
      )
      -- Jamais pour quelqu'un qui a bloqué l'organisateur
      and not exists (
        select 1 from public.blocages b
        where b.bloqueur_id = r.joueur_id and b.bloque_id = new.organisateur_id
      )
    returning r.joueur_id
  )
  select array_agg(joueur_id) into joueurs from prevenus;
  if joueurs is not null then
    perform private.pousser(
      joueurs,
      'Nouvelle session : ' || new.titre,
      upper(left(private.jour_fr(new.debut), 1)) || substr(private.jour_fr(new.debut), 2) || ' ' || private.heure_fr(new.debut) || ', ' || new.lieu
        || case when new.commune <> '' then ' (' || new.commune || ')' else '' end || '.',
      jsonb_build_object('type', 'nouvelle_session', 'session', new.id)
    );
  end if;
  return new;
end;
$$;

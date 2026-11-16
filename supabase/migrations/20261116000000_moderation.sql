-- Signalement, blocage et suppression de compte (étape 10).
-- Rien n'est supprimé dans cette migration : on ajoute des tables et on remplace des vues et fonctions.

-- ---------------------------------------------------------------------------
-- Blocages : « je ne veux plus voir cette personne ».
-- ---------------------------------------------------------------------------
create table public.blocages (
  bloqueur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  bloque_id uuid not null references public.profils (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (bloqueur_id, bloque_id),
  check (bloqueur_id <> bloque_id)
);
create index blocages_bloque_idx on public.blocages (bloque_id);

alter table public.blocages enable row level security;
revoke all on public.blocages from anon, authenticated;
-- `anon` a besoin du droit de lecture pour que la vue des sessions reste lisible sans compte ;
-- la politique ci-dessous ne lui montre aucune ligne.
grant select on public.blocages to anon, authenticated;
grant insert (bloque_id) on public.blocages to authenticated;
grant delete on public.blocages to authenticated;

create policy "On voit ses blocages" on public.blocages
  for select to authenticated using (bloqueur_id = (select auth.uid()));
create policy "On bloque en son nom" on public.blocages
  for insert to authenticated with check (bloqueur_id = (select auth.uid()));
create policy "On débloque ses blocages" on public.blocages
  for delete to authenticated using (bloqueur_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Signalements : lus par l'équipe depuis le site Supabase, jamais par l'app.
-- ---------------------------------------------------------------------------
create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  -- Si l'auteur supprime son compte, le signalement reste (auteur_id devient vide)
  auteur_id uuid default auth.uid() references public.profils (id) on delete set null,
  cible text not null check (cible in ('session', 'joueur', 'message')),
  cible_id uuid not null,
  motif text not null check (motif in ('comportement', 'contenu', 'faux', 'danger', 'autre')),
  details text check (details is null or char_length(details) <= 500),
  cree_le timestamptz not null default now(),
  traite boolean not null default false
);
-- Un même compte ne signale pas deux fois la même chose (évite le spam)
create unique index signalements_une_fois_idx on public.signalements (auteur_id, cible, cible_id);
create index signalements_a_traiter_idx on public.signalements (cree_le) where not traite;

alter table public.signalements enable row level security;
revoke all on public.signalements from anon, authenticated;
grant insert (cible, cible_id, motif, details) on public.signalements to authenticated;

create policy "On signale en son nom" on public.signalements
  for insert to authenticated with check (auteur_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Ce que le blocage change : la personne bloquée disparaît pour celui qui bloque.
-- ---------------------------------------------------------------------------

-- Ses messages ne s'affichent plus dans les conversations.
alter policy "Les inscrits lisent la conversation" on public.messages
  using (
    exists (
      select 1 from public.participations p
      where p.session_id = messages.session_id and p.joueur_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = (select auth.uid()) and b.bloque_id = messages.auteur_id
    )
  );

-- Ses sessions ne s'affichent plus sur la carte ni dans la liste.
create or replace view public.sessions_visibles with (security_invoker = true) as
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
where i.inscrits is not null
  and not exists (
    select 1 from public.blocages b
    where b.bloqueur_id = (select auth.uid()) and b.bloque_id = s.organisateur_id
  );

-- Ses messages ne comptent plus ni comme « dernier message » ni comme non lus.
create or replace view public.conversations with (security_invoker = true) as
select
  s.id as session_id, s.titre, s.sport, s.lieu, s.commune, s.lat, s.lng, s.debut, s.fin,
  moi.cree_le as inscrit_le,
  (select count(*) from public.participations x where x.session_id = s.id) as inscrits,
  d.texte as dernier_texte, d.cree_le as dernier_le, d.auteur_id as dernier_auteur, d.prenom as dernier_prenom,
  (
    select count(*) from public.messages m
    where m.session_id = s.id
      and m.auteur_id <> moi.joueur_id
      and m.cree_le > coalesce(l.lu_le, moi.cree_le)
      and not exists (
        select 1 from public.blocages b
        where b.bloqueur_id = moi.joueur_id and b.bloque_id = m.auteur_id
      )
  ) as non_lus
from public.participations moi
join public.sessions s on s.id = moi.session_id
left join public.lectures l on l.session_id = s.id and l.joueur_id = moi.joueur_id
left join lateral (
  select m.texte, m.cree_le, m.auteur_id, p.prenom
  from public.messages m join public.profils p on p.id = m.auteur_id
  where m.session_id = s.id
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = moi.joueur_id and b.bloque_id = m.auteur_id
    )
  order by m.cree_le desc limit 1
) d on true
where moi.joueur_id = (select auth.uid()) and s.fin > now() - interval '7 days';

-- Pas de notification « nouveau message » pour ceux qui ont bloqué l'auteur.
create or replace function private.prevenir_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  joueurs uuid[];
  titre_session text;
  prenom_auteur text;
begin
  select array_agg(p.joueur_id) into joueurs
  from public.participations p
  left join public.reglages_notifications r on r.joueur_id = p.joueur_id
  where p.session_id = new.session_id
    and p.joueur_id <> new.auteur_id
    and coalesce(r.message, true)
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = p.joueur_id and b.bloque_id = new.auteur_id
    );
  if joueurs is null then return new; end if;
  select titre into titre_session from public.sessions where id = new.session_id;
  select prenom into prenom_auteur from public.profils where id = new.auteur_id;
  perform private.pousser(
    joueurs,
    titre_session || ' · ' || coalesce(nullif(prenom_auteur, ''), 'Quelqu’un'),
    left(new.texte, 140),
    jsonb_build_object('type', 'message', 'session', new.session_id)
  );
  return new;
end;
$$;

-- Une personne bloquée ne peut pas rejoindre les sessions de celui qui l'a bloquée :
-- pour elle, la session est « introuvable ».
create or replace function public.catcher(p_session uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  places int;
  fin_session timestamptz;
  organisateur uuid;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  select joueurs, fin, organisateur_id into places, fin_session, organisateur
  from public.sessions where id = p_session for update;
  if not found then return 'introuvable'; end if;
  if exists (
    select 1 from public.blocages where bloqueur_id = organisateur and bloque_id = moi
  ) then
    return 'introuvable';
  end if;
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

-- ---------------------------------------------------------------------------
-- Suppression de compte, par la personne elle-même.
-- Tout part avec le compte (profil, Catchs, messages, appareils, réglages, blocages)
-- et ses sessions à venir sont annulées : toutes les tables sont liées en « on delete cascade ».
-- ---------------------------------------------------------------------------
create function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  delete from auth.users where id = moi;
end;
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;

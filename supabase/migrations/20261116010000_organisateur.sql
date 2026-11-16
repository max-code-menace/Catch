-- L'organisateur peut annuler ou modifier sa session ; les inscrits sont prévenus (« changement sur ma session »).
-- Rien n'est supprimé : une session annulée garde sa ligne, avec la date d'annulation.

alter table public.sessions add column annulee_le timestamptz;

-- Notification « changement sur ma session » : réglable, activée par défaut.
alter table public.reglages_notifications add column changement boolean not null default true;
grant insert (changement) on public.reglages_notifications to authenticated;
grant update (changement) on public.reglages_notifications to authenticated;

-- Une session annulée ne s'affiche plus nulle part.
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
  and s.annulee_le is null
  and not exists (
    select 1 from public.blocages b
    where b.bloqueur_id = (select auth.uid()) and b.bloque_id = s.organisateur_id
  );

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
where moi.joueur_id = (select auth.uid())
  and s.fin > now() - interval '7 days'
  and s.annulee_le is null;

-- On ne catche pas une session annulée.
create or replace function public.catcher(p_session uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  places int;
  fin_session timestamptz;
  organisateur uuid;
  annulee timestamptz;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  select joueurs, fin, organisateur_id, annulee_le into places, fin_session, organisateur, annulee
  from public.sessions where id = p_session for update;
  if not found then return 'introuvable'; end if;
  if exists (
    select 1 from public.blocages where bloqueur_id = organisateur and bloque_id = moi
  ) then
    return 'introuvable';
  end if;
  if annulee is not null or fin_session <= now() then return 'terminee'; end if;
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

-- Pas de rappel pour une session annulée.
create or replace function private.envoyer_rappels() returns void
language plpgsql security definer set search_path = '' as $$
declare
  ligne record;
begin
  for ligne in
    with dus as (
      update public.participations p set rappel_envoye_le = now()
      from public.sessions s
      where s.id = p.session_id
        and s.annulee_le is null
        and p.rappel_envoye_le is null
        and s.debut > now() + interval '30 minutes'
        and s.debut <= now() + interval '3 hours'
        and p.cree_le < s.debut - interval '3 hours'
      returning p.joueur_id, s.id as session_id, s.titre, s.lieu, s.debut
    )
    select d.session_id, d.titre, d.lieu, d.debut, array_agg(d.joueur_id) as joueurs
    from dus d
    left join public.reglages_notifications r on r.joueur_id = d.joueur_id
    where coalesce(r.rappel, true)
    group by d.session_id, d.titre, d.lieu, d.debut
  loop
    perform private.pousser(
      ligne.joueurs,
      ligne.titre || ' à ' || private.heure_fr(ligne.debut),
      'C’est ' || private.jour_fr(ligne.debut) || ', ' || ligne.lieu || '. Tu viens toujours ?',
      jsonb_build_object('type', 'rappel', 'session', ligne.session_id),
      'rappel'
    );
  end loop;
end;
$$;

-- Prévient les inscrits d'une session (sauf l'organisateur) qui veulent être prévenus des changements.
create function private.prevenir_inscrits(p_session uuid, p_titre text, p_corps text, p_type text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  joueurs uuid[];
begin
  select array_agg(p.joueur_id) into joueurs
  from public.participations p
  join public.sessions s on s.id = p.session_id
  left join public.reglages_notifications r on r.joueur_id = p.joueur_id
  where p.session_id = p_session
    and p.joueur_id <> s.organisateur_id
    and coalesce(r.changement, true);
  if joueurs is null then return; end if;
  perform private.pousser(joueurs, p_titre, p_corps, jsonb_build_object('type', p_type, 'session', p_session));
end;
$$;

-- Annuler sa session. Renvoie 'ok', 'introuvable' ou 'refuse' (ce n'est pas la sienne).
create function public.annuler_session(p_session uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  s public.sessions%rowtype;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  select * into s from public.sessions where id = p_session for update;
  if not found then return 'introuvable'; end if;
  if s.organisateur_id <> moi then return 'refuse'; end if;
  if s.annulee_le is not null then return 'ok'; end if;
  update public.sessions set annulee_le = now() where id = p_session;
  if s.fin > now() then
    perform private.prevenir_inscrits(
      p_session,
      'Session annulée : ' || s.titre,
      upper(left(private.jour_fr(s.debut), 1)) || substr(private.jour_fr(s.debut), 2) || ' '
        || private.heure_fr(s.debut) || ', ' || s.lieu || '. L’organisateur l’a annulée.',
      'annulation'
    );
  end if;
  return 'ok';
end;
$$;

-- Modifier sa session : horaire, lieu, nombre de joueurs.
-- Renvoie 'ok', 'introuvable', 'refuse', 'trop_petit' (moins de places que d'inscrits) ou 'invalide'.
create function public.modifier_session(
  p_session uuid, p_debut timestamptz, p_fin timestamptz,
  p_lieu text, p_commune text, p_lat double precision, p_lng double precision, p_joueurs int
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  s public.sessions%rowtype;
  quoi text := '';
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  select * into s from public.sessions where id = p_session for update;
  if not found or s.annulee_le is not null then return 'introuvable'; end if;
  if s.organisateur_id <> moi then return 'refuse'; end if;
  if p_fin <= now() or p_fin <= p_debut or p_fin - p_debut > interval '12 hours'
     or p_debut > now() + interval '60 days'
     or p_joueurs not between 2 and 60
     or char_length(coalesce(p_lieu, '')) not between 1 and 80
     or char_length(coalesce(p_commune, '')) > 60
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    return 'invalide';
  end if;
  if (select count(*) from public.participations where session_id = p_session) > p_joueurs then
    return 'trop_petit';
  end if;

  update public.sessions
  set debut = p_debut, fin = p_fin, lieu = p_lieu, commune = coalesce(p_commune, ''),
      lat = p_lat, lng = p_lng, joueurs = p_joueurs
  where id = p_session;

  -- On ne prévient que si l'heure ou le lieu change : c'est ce qui compte pour venir
  if p_debut <> s.debut then
    quoi := 'Nouvel horaire : ' || private.jour_fr(p_debut) || ' ' || private.heure_fr(p_debut) || '.';
    -- Le rappel 3h avant repartira pour le nouvel horaire
    update public.participations set rappel_envoye_le = null where session_id = p_session;
  end if;
  if p_lieu <> s.lieu or p_lat <> s.lat or p_lng <> s.lng then
    quoi := trim(quoi || ' Nouveau lieu : ' || p_lieu || '.');
  end if;
  if quoi <> '' then
    perform private.prevenir_inscrits(p_session, 'Changement : ' || s.titre, quoi, 'changement');
  end if;
  return 'ok';
end;
$$;

revoke all on function public.annuler_session(uuid) from public, anon;
revoke all on function public.modifier_session(uuid, timestamptz, timestamptz, text, text, double precision, double precision, int) from public, anon;
grant execute on function public.annuler_session(uuid) to authenticated;
grant execute on function public.modifier_session(uuid, timestamptz, timestamptz, text, text, double precision, double precision, int) to authenticated;

-- Supprimer son compte : les inscrits de ses sessions à venir sont prévenus avant que tout parte.
create or replace function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  ligne record;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  for ligne in
    select id, titre, debut, lieu from public.sessions
    where organisateur_id = moi and annulee_le is null and fin > now()
  loop
    perform private.prevenir_inscrits(
      ligne.id,
      'Session annulée : ' || ligne.titre,
      upper(left(private.jour_fr(ligne.debut), 1)) || substr(private.jour_fr(ligne.debut), 2) || ' '
        || private.heure_fr(ligne.debut) || ', ' || ligne.lieu || '. L’organisateur l’a annulée.',
      'annulation'
    );
  end loop;
  delete from auth.users where id = moi;
end;
$$;

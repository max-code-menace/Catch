-- Audit du 19 novembre 2026, points S1 à S3. Ne supprime rien (ni table, ni ligne, ni règle : les règles sont modifiées).
-- S1. Un compte connecté ne voit plus, dans les tables, que ce qui le concerne :
--     ses sessions (organisées ou rejointes), les inscrits de ces sessions, et les prénoms des gens
--     qu'il croise (mêmes sessions, auteurs de messages dans ses conversations, personnes qu'il a bloquées).
--     La carte ne change pas : elle lit la vue `sessions_visibles`, qui garde ses propres droits.
-- S2. La date de création d'une session est toujours celle du serveur : la limite de 6 par 24 h ne se contourne plus.
-- S3. Pas plus de 10 sessions à venir rejointes en même temps par compte (`catcher` renvoie 'limite').

-- ---------------------------------------------------------------------------
-- S1. Deux questions que les règles posent à la base, sans tourner en rond
-- (une règle sur `participations` ne peut pas relire `participations` elle-même).
-- ---------------------------------------------------------------------------

-- Suis-je inscrit à cette session ?
create or replace function public.est_inscrit(p_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.participations
    where session_id = p_session and joueur_id = (select auth.uid())
  );
$$;

-- Ai-je le droit de voir le prénom de cette personne ?
create or replace function public.peut_voir_profil(p_autre uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_autre = (select auth.uid())
    -- on est dans une même session
    or exists (
      select 1 from public.participations moi
      join public.participations autre on autre.session_id = moi.session_id
      where moi.joueur_id = (select auth.uid()) and autre.joueur_id = p_autre
    )
    -- elle a écrit dans une de mes conversations (même si elle est partie depuis)
    or exists (
      select 1 from public.messages m
      join public.participations moi on moi.session_id = m.session_id
      where moi.joueur_id = (select auth.uid()) and m.auteur_id = p_autre
    )
    -- je l'ai bloquée (liste « Personnes bloquées »)
    or exists (
      select 1 from public.blocages b
      where b.bloqueur_id = (select auth.uid()) and b.bloque_id = p_autre
    );
$$;

revoke all on function public.est_inscrit(uuid) from public, anon;
revoke all on function public.peut_voir_profil(uuid) from public, anon;
grant execute on function public.est_inscrit(uuid) to authenticated;
grant execute on function public.peut_voir_profil(uuid) to authenticated;

alter policy "Tout le monde voit les sessions" on public.sessions
  to authenticated
  using (organisateur_id = (select auth.uid()) or public.est_inscrit(id));

alter policy "Tout le monde voit les inscrits" on public.participations
  to authenticated
  using (joueur_id = (select auth.uid()) or public.est_inscrit(session_id));

alter policy "Tout le monde voit les prénoms" on public.profils
  to authenticated
  using (public.peut_voir_profil(id));

-- ---------------------------------------------------------------------------
-- S2. Créer une session : seulement les champs du formulaire.
-- Identifiant, organisateur, date de création et annulation sont remplis par le serveur.
-- ---------------------------------------------------------------------------
revoke insert on public.sessions from authenticated;
grant insert (
  sport, titre, lieu, commune, lat, lng, debut, fin, joueurs,
  debutants_bienvenus, a_savoir_titre, a_savoir_detail, evenement_id
) on public.sessions to authenticated;

-- ---------------------------------------------------------------------------
-- S3. Catcher : au plus 10 sessions à venir en même temps (organisées comprises).
-- Renvoie 'ok', 'complete', 'terminee', 'introuvable' ou 'limite'.
-- ---------------------------------------------------------------------------
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
  if (
    select count(*) from public.participations p
    join public.sessions s on s.id = p.session_id
    where p.joueur_id = moi and s.fin > now() and s.annulee_le is null
  ) >= 10 then
    return 'limite';
  end if;
  if (select count(*) from public.participations where session_id = p_session) >= places then
    return 'complete';
  end if;
  insert into public.participations (session_id, joueur_id) values (p_session, moi);
  return 'ok';
end;
$$;

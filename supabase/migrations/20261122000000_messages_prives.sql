-- Messages privés (22 novembre 2026, demande de Maxime) : une conversation à deux, à côté des groupes de session.
-- Exemple : écrire seulement à l'organisateur, ou à un joueur croisé dans une session.
-- Qui peut ouvrir une conversation avec qui :
--   - l'organisateur d'une session à venir, depuis son détail, même sans l'avoir catchée (comme BlaBlaCar) ;
--   - quelqu'un avec qui on est (ou était) inscrit à une même session.
-- Une fois ouverte, la conversation reste (c'est le début des « potes »), sauf blocage.
-- Ne supprime rien.

-- ---------------------------------------------------------------------------
-- Les conversations : une seule par paire de personnes (joueur_a < joueur_b).
-- ---------------------------------------------------------------------------
create table public.prives (
  id uuid primary key default gen_random_uuid(),
  joueur_a uuid not null references public.profils (id) on delete cascade,
  joueur_b uuid not null references public.profils (id) on delete cascade,
  -- Qui l'a ouverte (limite anti-spam : 20 nouvelles conversations par 24 h)
  ouverte_par uuid not null references public.profils (id) on delete cascade,
  -- La session où ils se sont croisés (pour « Voir la session ») ; vide si elle a été effacée
  session_id uuid references public.sessions (id) on delete set null,
  -- Recopiés à l'ouverture : la session peut ne pas être lisible par l'autre (pas inscrit) ou disparaître
  sujet text,
  sport text,
  cree_le timestamptz not null default now(),
  check (joueur_a < joueur_b),
  unique (joueur_a, joueur_b)
);
create index prives_b_idx on public.prives (joueur_b);
create index prives_ouverte_idx on public.prives (ouverte_par, cree_le);
create index prives_session_idx on public.prives (session_id);

alter table public.prives enable row level security;
revoke all on public.prives from anon, authenticated;
grant select on public.prives to authenticated;

create policy "On voit ses conversations privées" on public.prives
  for select to authenticated using ((select auth.uid()) in (joueur_a, joueur_b));

-- ---------------------------------------------------------------------------
-- Les messages
-- ---------------------------------------------------------------------------
create table public.messages_prives (
  id uuid primary key default gen_random_uuid(),
  prive_id uuid not null references public.prives (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  texte text not null check (char_length(btrim(texte)) between 1 and 1000),
  cree_le timestamptz not null default now()
);
create index messages_prives_conversation_idx on public.messages_prives (prive_id, cree_le);
create index messages_prives_auteur_idx on public.messages_prives (auteur_id, cree_le);

-- Puis-je écrire dans cette conversation ? J'en fais partie, et personne n'a bloqué l'autre.
-- (Une règle ne peut pas lire les blocages de l'autre personne : d'où cette fonction.)
create function public.peut_ecrire_prive(p_prive uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.prives c
    where c.id = p_prive
      and (select auth.uid()) in (c.joueur_a, c.joueur_b)
      and not exists (
        select 1 from public.blocages b
        where (b.bloqueur_id = c.joueur_a and b.bloque_id = c.joueur_b)
           or (b.bloqueur_id = c.joueur_b and b.bloque_id = c.joueur_a)
      )
  );
$$;
revoke all on function public.peut_ecrire_prive(uuid) from public, anon;
grant execute on function public.peut_ecrire_prive(uuid) to authenticated;

alter table public.messages_prives enable row level security;
revoke all on public.messages_prives from anon, authenticated;
grant select on public.messages_prives to authenticated;
grant insert (prive_id, texte) on public.messages_prives to authenticated;

create policy "On lit ses messages privés" on public.messages_prives
  for select to authenticated using (
    exists (
      select 1 from public.prives c
      where c.id = messages_prives.prive_id and (select auth.uid()) in (c.joueur_a, c.joueur_b)
    )
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = (select auth.uid()) and b.bloque_id = messages_prives.auteur_id
    )
  );

create policy "On écrit en son nom" on public.messages_prives
  for insert to authenticated with check (
    auteur_id = (select auth.uid()) and public.peut_ecrire_prive(prive_id)
  );

-- Pas plus de 20 messages privés par minute (comme dans les groupes)
create function private.limiter_messages_prives() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.messages_prives
    where auteur_id = new.auteur_id and cree_le > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'limite_messages' using hint = 'Pas plus de 20 messages par minute.';
  end if;
  return new;
end;
$$;
create trigger limiter_messages_prives
  before insert on public.messages_prives
  for each row execute function private.limiter_messages_prives();

-- Les nouveaux messages arrivent en direct
alter publication supabase_realtime add table public.messages_prives;

-- ---------------------------------------------------------------------------
-- Jusqu'où chacun a lu
-- ---------------------------------------------------------------------------
create table public.lectures_privees (
  prive_id uuid not null references public.prives (id) on delete cascade,
  joueur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  lu_le timestamptz not null default now(),
  primary key (prive_id, joueur_id)
);
create index lectures_privees_joueur_idx on public.lectures_privees (joueur_id);

alter table public.lectures_privees enable row level security;
revoke all on public.lectures_privees from anon, authenticated;
grant select, insert, update on public.lectures_privees to authenticated;

create policy "On lit ses lectures privées" on public.lectures_privees
  for select to authenticated using (joueur_id = (select auth.uid()));
create policy "On note ses lectures privées" on public.lectures_privees
  for insert to authenticated with check (
    joueur_id = (select auth.uid())
    and exists (
      select 1 from public.prives c
      where c.id = lectures_privees.prive_id and (select auth.uid()) in (c.joueur_a, c.joueur_b)
    )
  );
create policy "On met à jour ses lectures privées" on public.lectures_privees
  for update to authenticated
  using (joueur_id = (select auth.uid())) with check (joueur_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Ouvrir (ou retrouver) une conversation avec quelqu'un.
-- Renvoie l'identifiant de la conversation. Erreurs : 'interdit', 'limite_prives'.
-- ---------------------------------------------------------------------------
create function public.ouvrir_prive(p_autre uuid, p_session uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  a uuid;
  b uuid;
  trouvee uuid;
  s_id uuid;
  s_titre text;
  s_sport text;
  s_organisateur uuid;
  s_annulee timestamptz;
  s_fin timestamptz;
begin
  if moi is null then
    raise exception 'Connexion requise';
  end if;
  if p_autre is null or p_autre = moi then
    raise exception 'interdit';
  end if;
  -- Un blocage, dans un sens ou dans l'autre : rien
  if exists (
    select 1 from public.blocages
    where (bloqueur_id = moi and bloque_id = p_autre) or (bloqueur_id = p_autre and bloque_id = moi)
  ) then
    raise exception 'interdit';
  end if;

  a := least(moi, p_autre);
  b := greatest(moi, p_autre);
  select id into trouvee from public.prives where joueur_a = a and joueur_b = b;
  if trouvee is not null then
    return trouvee;
  end if;

  if p_session is not null then
    select id, titre, sport, organisateur_id, annulee_le, fin
    into s_id, s_titre, s_sport, s_organisateur, s_annulee, s_fin
    from public.sessions where id = p_session;
  end if;

  if not (
    -- L'organisateur d'une session à venir, depuis son détail
    (s_id is not null and s_organisateur = p_autre and s_annulee is null and s_fin > now())
    -- Ou quelqu'un avec qui on partage (ou a partagé) une session
    or exists (
      select 1 from public.participations moi_p
      join public.participations autre_p on autre_p.session_id = moi_p.session_id
      where moi_p.joueur_id = moi and autre_p.joueur_id = p_autre
    )
  ) then
    raise exception 'interdit';
  end if;

  if (
    select count(*) from public.prives where ouverte_par = moi and cree_le > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'limite_prives' using hint = 'Pas plus de 20 nouvelles conversations par 24 heures.';
  end if;

  -- Sans session précisée, on retient la dernière session partagée
  if s_id is null then
    select x.id, x.titre, x.sport into s_id, s_titre, s_sport
    from public.participations moi_p
    join public.participations autre_p on autre_p.session_id = moi_p.session_id
    join public.sessions x on x.id = moi_p.session_id
    where moi_p.joueur_id = moi and autre_p.joueur_id = p_autre
    order by x.debut desc limit 1;
  end if;

  insert into public.prives (joueur_a, joueur_b, ouverte_par, session_id, sujet, sport)
  values (a, b, moi, s_id, s_titre, s_sport)
  on conflict (joueur_a, joueur_b) do nothing
  returning id into trouvee;
  if trouvee is null then
    select id into trouvee from public.prives where joueur_a = a and joueur_b = b;
  end if;
  return trouvee;
end;
$$;
revoke all on function public.ouvrir_prive(uuid, uuid) from public, anon;
grant execute on function public.ouvrir_prive(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- On voit le prénom de quelqu'un avec qui on a une conversation privée.
-- (Reprend la fonction du 19 novembre, avec une condition en plus.)
-- ---------------------------------------------------------------------------
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
    -- on a une conversation privée
    or exists (
      select 1 from public.prives c
      where (c.joueur_a = (select auth.uid()) and c.joueur_b = p_autre)
         or (c.joueur_b = (select auth.uid()) and c.joueur_a = p_autre)
    )
    -- je l'ai bloquée (liste « Personnes bloquées »)
    or exists (
      select 1 from public.blocages b
      where b.bloqueur_id = (select auth.uid()) and b.bloque_id = p_autre
    );
$$;

-- ---------------------------------------------------------------------------
-- Les conversations privées du compte connecté : l'autre personne, le dernier message, les non lus.
-- Celles avec quelqu'un que j'ai bloqué n'apparaissent plus.
-- ---------------------------------------------------------------------------
create view public.conversations_privees with (security_invoker = true) as
select
  c.id,
  autre.id as autre_id,
  autre.prenom as autre_prenom,
  c.session_id,
  c.sujet,
  c.sport,
  c.cree_le,
  d.texte as dernier_texte,
  d.cree_le as dernier_le,
  d.auteur_id as dernier_auteur,
  (
    select count(*) from public.messages_prives m
    where m.prive_id = c.id
      and m.auteur_id <> (select auth.uid())
      and m.cree_le > coalesce(l.lu_le, '-infinity'::timestamptz)
  ) as non_lus
from public.prives c
join public.profils autre
  on autre.id = case when c.joueur_a = (select auth.uid()) then c.joueur_b else c.joueur_a end
left join public.lectures_privees l on l.prive_id = c.id and l.joueur_id = (select auth.uid())
left join lateral (
  select m.texte, m.cree_le, m.auteur_id
  from public.messages_prives m
  where m.prive_id = c.id
  order by m.cree_le desc limit 1
) d on true
where (select auth.uid()) in (c.joueur_a, c.joueur_b)
  and not exists (
    select 1 from public.blocages b
    where b.bloqueur_id = (select auth.uid()) and b.bloque_id = autre.id
  );

revoke all on public.conversations_privees from anon, authenticated;
grant select on public.conversations_privees to authenticated;

-- ---------------------------------------------------------------------------
-- Notification « nouveau message » (même réglage que les groupes), sans rafale :
-- au premier message, puis plus rien tant que la personne n'a pas lu, ou 10 minutes.
-- ---------------------------------------------------------------------------
create table private.avis_prives (
  joueur_id uuid not null references auth.users (id) on delete cascade,
  prive_id uuid not null references public.prives (id) on delete cascade,
  envoye_le timestamptz not null default now(),
  primary key (joueur_id, prive_id)
);
alter table private.avis_prives enable row level security;
revoke all on private.avis_prives from public, anon, authenticated;

create function private.prevenir_message_prive() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  conversation public.prives;
  destinataire uuid;
  prenom_auteur text;
  deja timestamptz;
  lu timestamptz;
begin
  select * into conversation from public.prives where id = new.prive_id;
  destinataire := case when conversation.joueur_a = new.auteur_id then conversation.joueur_b else conversation.joueur_a end;

  if not coalesce((select message from public.reglages_notifications where joueur_id = destinataire), true) then
    return new;
  end if;
  if exists (
    select 1 from public.blocages where bloqueur_id = destinataire and bloque_id = new.auteur_id
  ) then
    return new;
  end if;

  select envoye_le into deja from private.avis_prives where joueur_id = destinataire and prive_id = new.prive_id;
  select lu_le into lu from public.lectures_privees where joueur_id = destinataire and prive_id = new.prive_id;
  if deja is not null and deja >= now() - interval '10 minutes' and (lu is null or lu < deja) then
    return new;
  end if;

  insert into private.avis_prives (joueur_id, prive_id, envoye_le)
  values (destinataire, new.prive_id, now())
  on conflict (joueur_id, prive_id) do update set envoye_le = excluded.envoye_le;

  select prenom into prenom_auteur from public.profils where id = new.auteur_id;
  perform private.pousser(
    array[destinataire],
    coalesce(nullif(prenom_auteur, ''), 'Quelqu’un'),
    left(new.texte, 140),
    jsonb_build_object('type', 'prive', 'prive', new.prive_id)
  );
  return new;
end;
$$;

create trigger prevenir_message_prive
  after insert on public.messages_prives
  for each row execute function private.prevenir_message_prive();

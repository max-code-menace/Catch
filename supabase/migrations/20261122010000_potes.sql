-- Potes (22 novembre 2026, demande de Maxime, maquette K) : on devient potes sans demande d'ami.
-- Après une session, chacun choisit avec qui il rejouerait. Si c'est réciproque, ils sont potes.
-- Personne ne voit qui l'a choisi ni qui ne l'a pas choisi : on ne voit que ses propres choix et ses potes.
-- Entre potes, on voit la semaine de l'autre (ses sessions des 7 prochains jours) et s'il est « dispo ce soir ».
-- Bloquer quelqu'un coupe tout ça dans les deux sens.
-- Ne supprime rien.

-- ---------------------------------------------------------------------------
-- « Je rejouerais avec toi » : une ligne par choix, une seule par paire et par sens.
-- ---------------------------------------------------------------------------
create table public.rejouer (
  choisisseur_id uuid not null references public.profils (id) on delete cascade,
  choisi_id uuid not null references public.profils (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (choisisseur_id, choisi_id),
  check (choisisseur_id <> choisi_id)
);
create index rejouer_choisi_idx on public.rejouer (choisi_id);

alter table public.rejouer enable row level security;
revoke all on public.rejouer from anon, authenticated;
grant select on public.rejouer to authenticated;
-- On ne lit que ses propres choix : jamais qui nous a choisis
create policy "On voit ses propres choix" on public.rejouer
  for select to authenticated using (choisisseur_id = (select auth.uid()));

-- Les sessions pour lesquelles on a déjà répondu (pour ne plus poser la question)
create table public.rejouer_reponses (
  joueur_id uuid not null references public.profils (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  repondu_le timestamptz not null default now(),
  primary key (joueur_id, session_id)
);
alter table public.rejouer_reponses enable row level security;
revoke all on public.rejouer_reponses from anon, authenticated;

-- « Dispo ce soir » : jusqu'à minuit (heure de Bruxelles), visible seulement par ses potes
create table public.dispos (
  joueur_id uuid primary key references public.profils (id) on delete cascade,
  jusqu_a timestamptz not null
);
alter table public.dispos enable row level security;
revoke all on public.dispos from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sont-ils potes ? Choix dans les deux sens, et personne n'a bloqué l'autre.
-- ---------------------------------------------------------------------------
create function private.sont_potes(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rejouer where choisisseur_id = p_a and choisi_id = p_b)
     and exists (select 1 from public.rejouer where choisisseur_id = p_b and choisi_id = p_a)
     and not exists (
       select 1 from public.blocages b
       where (b.bloqueur_id = p_a and b.bloque_id = p_b) or (b.bloqueur_id = p_b and b.bloque_id = p_a)
     );
$$;
revoke all on function private.sont_potes(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- La question « Tu rejouerais avec qui ? » : la dernière session terminée (moins de 7 jours)
-- où il reste des joueurs à qui on n'a pas encore répondu.
-- ---------------------------------------------------------------------------
create function public.question_rejouer()
returns table (session_id uuid, sport text, titre text, lieu text, fin timestamptz, joueurs jsonb)
language sql stable security definer set search_path = '' as $$
  select s.id, s.sport, s.titre, s.lieu, s.fin,
    jsonb_agg(jsonb_build_object('id', p.id, 'prenom', p.prenom) order by pa.cree_le)
  from public.sessions s
  join public.participations moi on moi.session_id = s.id and moi.joueur_id = (select auth.uid())
  join public.participations pa on pa.session_id = s.id and pa.joueur_id <> (select auth.uid())
  join public.profils p on p.id = pa.joueur_id
  where s.annulee_le is null
    and s.fin <= now() and s.fin > now() - interval '7 days'
    and not exists (
      select 1 from public.rejouer_reponses r
      where r.joueur_id = (select auth.uid()) and r.session_id = s.id
    )
    -- déjà choisi (donc déjà pote ou en attente) : pas besoin de redemander
    and not exists (
      select 1 from public.rejouer r
      where r.choisisseur_id = (select auth.uid()) and r.choisi_id = pa.joueur_id
    )
    and not exists (
      select 1 from public.blocages b
      where (b.bloqueur_id = (select auth.uid()) and b.bloque_id = pa.joueur_id)
         or (b.bloqueur_id = pa.joueur_id and b.bloque_id = (select auth.uid()))
    )
  group by s.id
  order by s.fin desc
  limit 1;
$$;
revoke all on function public.question_rejouer() from public, anon;
grant execute on function public.question_rejouer() to authenticated;

-- Répondre : on enregistre ses choix (seulement des joueurs de cette session) et on renvoie
-- les nouveaux potes (ceux qui nous avaient déjà choisis). Une liste vide = « Personne cette fois ».
create function public.repondre_rejouer(p_session uuid, p_joueurs uuid[])
returns table (id uuid, prenom text)
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
begin
  if moi is null then
    raise exception 'connexion';
  end if;
  if not exists (
    select 1 from public.participations pa
    join public.sessions s on s.id = pa.session_id
    where pa.session_id = p_session and pa.joueur_id = moi
      and s.fin <= now() and s.fin > now() - interval '14 days'
  ) then
    raise exception 'introuvable';
  end if;

  insert into public.rejouer_reponses (joueur_id, session_id) values (moi, p_session)
  on conflict do nothing;

  insert into public.rejouer (choisisseur_id, choisi_id)
  select moi, pa.joueur_id
  from public.participations pa
  where pa.session_id = p_session
    and pa.joueur_id <> moi
    and pa.joueur_id = any (coalesce(p_joueurs, '{}'))
  on conflict do nothing;

  return query
  select p.id, p.prenom
  from public.profils p
  where p.id = any (coalesce(p_joueurs, '{}'))
    and private.sont_potes(moi, p.id);
end;
$$;
revoke all on function public.repondre_rejouer(uuid, uuid[]) from public, anon;
grant execute on function public.repondre_rejouer(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Mes potes, avec « dispo ce soir »
-- ---------------------------------------------------------------------------
create function public.mes_potes()
returns table (id uuid, prenom text, dispo boolean, depuis timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.prenom,
    coalesce(d.jusqu_a > now(), false),
    greatest(r1.cree_le, r2.cree_le)
  from public.rejouer r1
  join public.rejouer r2 on r2.choisisseur_id = r1.choisi_id and r2.choisi_id = r1.choisisseur_id
  join public.profils p on p.id = r1.choisi_id
  left join public.dispos d on d.joueur_id = p.id
  where r1.choisisseur_id = (select auth.uid())
    and not exists (
      select 1 from public.blocages b
      where (b.bloqueur_id = r1.choisisseur_id and b.bloque_id = r1.choisi_id)
         or (b.bloqueur_id = r1.choisi_id and b.bloque_id = r1.choisisseur_id)
    )
  order by p.prenom;
$$;
revoke all on function public.mes_potes() from public, anon;
grant execute on function public.mes_potes() to authenticated;

-- La semaine des potes : leurs sessions des 7 prochains jours (pas les annulées, pas celles
-- d'un organisateur avec qui il y a un blocage).
create function public.semaine_des_potes()
returns table (
  pote_id uuid, session_id uuid, sport text, titre text, lieu text,
  debut timestamptz, fin timestamptz, organise boolean, joueurs int, inscrits int, j_y_suis boolean
)
language sql stable security definer set search_path = '' as $$
  select pa.joueur_id, s.id, s.sport, s.titre, s.lieu, s.debut, s.fin,
    s.organisateur_id = pa.joueur_id,
    s.joueurs,
    (select count(*) from public.participations x where x.session_id = s.id)::int,
    exists (select 1 from public.participations x where x.session_id = s.id and x.joueur_id = (select auth.uid()))
  from public.participations pa
  join public.sessions s on s.id = pa.session_id
  where private.sont_potes((select auth.uid()), pa.joueur_id)
    and s.annulee_le is null
    and s.fin > now() and s.debut < now() + interval '7 days'
    and not exists (
      select 1 from public.blocages b
      where (b.bloqueur_id = (select auth.uid()) and b.bloque_id = s.organisateur_id)
         or (b.bloqueur_id = s.organisateur_id and b.bloque_id = (select auth.uid()))
    )
  order by s.debut;
$$;
revoke all on function public.semaine_des_potes() from public, anon;
grant execute on function public.semaine_des_potes() to authenticated;

-- ---------------------------------------------------------------------------
-- « Je suis dispo ce soir » : jusqu'à minuit, heure de Bruxelles. Faux = plus dispo.
-- ---------------------------------------------------------------------------
create function public.regler_dispo(p_dispo boolean) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
  minuit timestamptz := (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '1 day')
    at time zone 'Europe/Brussels';
  jusqu timestamptz := case when p_dispo then minuit else now() end;
begin
  if moi is null then
    raise exception 'connexion';
  end if;
  insert into public.dispos (joueur_id, jusqu_a) values (moi, jusqu)
  on conflict (joueur_id) do update set jusqu_a = excluded.jusqu_a;
  return case when p_dispo then jusqu else null end;
end;
$$;
revoke all on function public.regler_dispo(boolean) from public, anon;
grant execute on function public.regler_dispo(boolean) to authenticated;

create function public.ma_dispo() returns timestamptz
language sql stable security definer set search_path = '' as $$
  select jusqu_a from public.dispos where joueur_id = (select auth.uid()) and jusqu_a > now();
$$;
revoke all on function public.ma_dispo() from public, anon;
grant execute on function public.ma_dispo() to authenticated;

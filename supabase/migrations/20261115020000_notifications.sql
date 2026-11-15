-- Notifications (étape 8) : appareils, réglages par type, rappel 3h avant, nouvelle session d'un sport suivi.
-- Les envois partent de la base vers le service push d'Expo (pg_net), le rappel est programmé (pg_cron).

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Un téléphone = un jeton push Expo, rattaché au compte connecté dessus (personne si on s'est déconnecté).
create table public.appareils (
  jeton text primary key check (jeton ~ '^Expo(nent)?PushToken\[.+\]$'),
  joueur_id uuid references public.profils (id) on delete cascade,
  plateforme text not null default '' check (char_length(plateforme) <= 20),
  maj_le timestamptz not null default now()
);
create index appareils_joueur_idx on public.appareils (joueur_id);
alter table public.appareils enable row level security;
revoke all on public.appareils from anon, authenticated;
-- Aucun accès direct : tout passe par les deux fonctions ci-dessous.

create function public.enregistrer_appareil(p_jeton text, p_plateforme text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise';
  end if;
  insert into public.appareils (jeton, joueur_id, plateforme)
  values (p_jeton, (select auth.uid()), left(coalesce(p_plateforme, ''), 20))
  on conflict (jeton) do update
    set joueur_id = excluded.joueur_id, plateforme = excluded.plateforme, maj_le = now();
end;
$$;

-- À la déconnexion : le téléphone ne reçoit plus rien pour ce compte.
create function public.oublier_appareil(p_jeton text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.appareils set joueur_id = null, maj_le = now()
  where jeton = p_jeton and joueur_id = (select auth.uid());
end;
$$;

revoke all on function public.enregistrer_appareil(text, text) from public, anon;
revoke all on function public.oublier_appareil(text) from public, anon;
grant execute on function public.enregistrer_appareil(text, text) to authenticated;
grant execute on function public.oublier_appareil(text) to authenticated;

-- Réglages par type. Pas de ligne = réglages par défaut (rappel oui, nouvelles sessions non).
create table public.reglages_notifications (
  joueur_id uuid primary key default auth.uid() references public.profils (id) on delete cascade,
  rappel boolean not null default true,
  -- Sur accord explicite seulement, et pour les sports choisis
  nouvelle_session boolean not null default false,
  sports text[] not null default '{}' check (
    sports <@ array['foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre']
  ),
  -- Rempli par le serveur : pas plus d'une notification « nouvelle session » par jour
  derniere_nouvelle_session timestamptz
);
alter table public.reglages_notifications enable row level security;
revoke all on public.reglages_notifications from anon, authenticated;
grant select on public.reglages_notifications to authenticated;
grant insert (joueur_id, rappel, nouvelle_session, sports) on public.reglages_notifications to authenticated;
grant update (rappel, nouvelle_session, sports) on public.reglages_notifications to authenticated;

create policy "On lit ses réglages" on public.reglages_notifications
  for select to authenticated using (joueur_id = (select auth.uid()));
create policy "On crée ses réglages" on public.reglages_notifications
  for insert to authenticated with check (joueur_id = (select auth.uid()));
create policy "On change ses réglages" on public.reglages_notifications
  for update to authenticated using (joueur_id = (select auth.uid())) with check (joueur_id = (select auth.uid()));

alter table public.participations add column rappel_envoye_le timestamptz;

-- « 19h », « 19h30 », à l'heure belge
create function private.heure_fr(moment timestamptz) returns text
language sql stable set search_path = '' as $$
  select replace(to_char(moment at time zone 'Europe/Brussels', 'FMHH24"h"MI'), 'h00', 'h');
$$;

-- « ce soir », « demain », « jeudi »
create function private.jour_fr(moment timestamptz) returns text
language sql stable set search_path = '' as $$
  select case (moment at time zone 'Europe/Brussels')::date - (now() at time zone 'Europe/Brussels')::date
    when 0 then case when extract(hour from moment at time zone 'Europe/Brussels') >= 18 then 'ce soir' else 'aujourd’hui' end
    when 1 then 'demain'
    else (array['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'])[extract(dow from moment at time zone 'Europe/Brussels')::int + 1]
  end;
$$;

-- Envoie une notification aux téléphones de ces joueurs, par le service push d'Expo.
create function private.pousser(p_joueurs uuid[], p_titre text, p_corps text, p_donnees jsonb, p_categorie text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  messages jsonb;
begin
  select jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'to', a.jeton, 'title', p_titre, 'body', p_corps, 'data', p_donnees,
      'sound', 'default', 'categoryId', p_categorie
    ))
  ) into messages
  from public.appareils a where a.joueur_id = any (p_joueurs);
  if messages is null then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
end;
$$;

-- Rappel 3h avant, une seule fois par inscrit, avec « Je viens » / « Je ne peux plus ».
-- Pas de rappel si on s'est inscrit à moins de 3h du début (on vient de décider) ni si la session commence dans moins de 30 min.
create function private.envoyer_rappels() returns void
language plpgsql security definer set search_path = '' as $$
declare
  ligne record;
begin
  for ligne in
    with dus as (
      update public.participations p set rappel_envoye_le = now()
      from public.sessions s
      where s.id = p.session_id
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

select cron.schedule('catch-rappels', '*/5 * * * *', 'select private.envoyer_rappels()');

-- Nouvelle session d'un sport suivi : seulement pour ceux qui l'ont demandé, une par jour au maximum, jamais à l'organisateur.
create function private.prevenir_nouvelle_session() returns trigger
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

create trigger prevenir_nouvelle_session
  after insert on public.sessions
  for each row execute function private.prevenir_nouvelle_session();

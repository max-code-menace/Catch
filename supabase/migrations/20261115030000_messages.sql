-- Messagerie interne (étape 9) : une conversation par session, lisible et utilisable par ses inscrits seulement.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  auteur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  texte text not null check (char_length(btrim(texte)) between 1 and 1000),
  cree_le timestamptz not null default now()
);
create index messages_session_idx on public.messages (session_id, cree_le);
create index messages_auteur_idx on public.messages (auteur_id);

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (session_id, texte) on public.messages to authenticated;

create policy "Les inscrits lisent la conversation" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.participations p
      where p.session_id = messages.session_id and p.joueur_id = (select auth.uid())
    )
  );

create policy "Les inscrits écrivent en leur nom" on public.messages
  for insert to authenticated with check (
    auteur_id = (select auth.uid())
    and exists (
      select 1 from public.participations p
      where p.session_id = messages.session_id and p.joueur_id = (select auth.uid())
    )
  );

-- Jusqu'où chacun a lu chaque conversation (pour le nombre de messages non lus).
create table public.lectures (
  session_id uuid not null references public.sessions (id) on delete cascade,
  joueur_id uuid not null default auth.uid() references public.profils (id) on delete cascade,
  lu_le timestamptz not null default now(),
  primary key (session_id, joueur_id)
);
create index lectures_joueur_idx on public.lectures (joueur_id);

alter table public.lectures enable row level security;
revoke all on public.lectures from anon, authenticated;
grant select, insert, update on public.lectures to authenticated;

create policy "On lit ses lectures" on public.lectures
  for select to authenticated using (joueur_id = (select auth.uid()));
create policy "On note ses lectures" on public.lectures
  for insert to authenticated with check (joueur_id = (select auth.uid()));
create policy "On met à jour ses lectures" on public.lectures
  for update to authenticated using (joueur_id = (select auth.uid())) with check (joueur_id = (select auth.uid()));

-- Les conversations du compte connecté : ses sessions (jusqu'à 7 jours après la fin), le dernier message, les non lus.
create view public.conversations with (security_invoker = true) as
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
  ) as non_lus
from public.participations moi
join public.sessions s on s.id = moi.session_id
left join public.lectures l on l.session_id = s.id and l.joueur_id = moi.joueur_id
left join lateral (
  select m.texte, m.cree_le, m.auteur_id, p.prenom
  from public.messages m join public.profils p on p.id = m.auteur_id
  where m.session_id = s.id
  order by m.cree_le desc limit 1
) d on true
where moi.joueur_id = (select auth.uid()) and s.fin > now() - interval '7 days';

revoke all on public.conversations from anon, authenticated;
grant select on public.conversations to authenticated;

-- Les nouveaux messages arrivent en direct dans l'app.
alter publication supabase_realtime add table public.messages;

-- Notification « nouveau message » : réglable, activée par défaut.
alter table public.reglages_notifications add column message boolean not null default true;
grant insert (message) on public.reglages_notifications to authenticated;
grant update (message) on public.reglages_notifications to authenticated;

create function private.prevenir_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  joueurs uuid[];
  titre_session text;
  prenom_auteur text;
begin
  select array_agg(p.joueur_id) into joueurs
  from public.participations p
  left join public.reglages_notifications r on r.joueur_id = p.joueur_id
  where p.session_id = new.session_id and p.joueur_id <> new.auteur_id and coalesce(r.message, true);
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

create trigger prevenir_message
  after insert on public.messages
  for each row execute function private.prevenir_message();

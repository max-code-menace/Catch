-- S5 de l'audit : plus de rafale de notifications « nouveau message ».
-- Dans une conversation, on prévient une personne au premier message, puis plus rien
-- tant qu'elle n'a pas ouvert la conversation, ou au plus une fois toutes les 10 minutes.
-- Rien n'est supprimé par cette migration.

create table if not exists private.avis_messages (
  joueur_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  envoye_le timestamptz not null default now(),
  primary key (joueur_id, session_id)
);
alter table private.avis_messages enable row level security;
revoke all on private.avis_messages from public, anon, authenticated;

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
  left join private.avis_messages a on a.joueur_id = p.joueur_id and a.session_id = p.session_id
  left join public.lectures l on l.joueur_id = p.joueur_id and l.session_id = p.session_id
  where p.session_id = new.session_id
    and p.joueur_id <> new.auteur_id
    and coalesce(r.message, true)
    and not exists (
      select 1 from public.blocages b
      where b.bloqueur_id = p.joueur_id and b.bloque_id = new.auteur_id
    )
    -- Déjà prévenu : on attend qu'il ait lu, ou 10 minutes
    and (
      a.envoye_le is null
      or a.envoye_le < now() - interval '10 minutes'
      or (l.lu_le is not null and l.lu_le >= a.envoye_le)
    );
  if joueurs is null then return new; end if;

  insert into private.avis_messages (joueur_id, session_id, envoye_le)
  select unnest(joueurs), new.session_id, now()
  on conflict (joueur_id, session_id) do update set envoye_le = excluded.envoye_le;

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

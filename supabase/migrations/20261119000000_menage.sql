-- Ménage automatique, une fois par heure (pg_cron, tâche `catch-menage`).
-- 1. Téléphones morts : quand le service push d'Expo répond « DeviceNotRegistered » (app supprimée,
--    notifications coupées pour de bon), on oublie ce jeton.
-- 2. Sessions : on efface les sessions vides, les sessions annulées 7 jours après leur fin, et toutes
--    les sessions 30 jours après leur fin (avec leur conversation : messages, lectures, participations
--    partent en cascade). Une session qui a un signalement pas encore traité (sur elle ou sur un de
--    ses messages) est gardée, pour que l'équipe puisse le lire.
-- Cette migration n'efface rien elle-même : elle crée la fonction et la programme.

-- Chaque envoi au service push garde la liste des jetons, dans l'ordre des messages envoyés,
-- pour relire la réponse d'Expo (un « ticket » par message, dans le même ordre).
create table private.envois_push (
  requete bigint primary key,
  jetons text[] not null,
  envoye_le timestamptz not null default now()
);
alter table private.envois_push enable row level security;

create or replace function private.pousser(p_joueurs uuid[], p_titre text, p_corps text, p_donnees jsonb, p_categorie text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  messages jsonb;
  jetons text[];
  requete bigint;
begin
  select
    jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object(
        'to', a.jeton, 'title', p_titre, 'body', p_corps, 'data', p_donnees,
        'sound', 'default', 'categoryId', p_categorie
      )) order by a.jeton
    ),
    array_agg(a.jeton order by a.jeton)
  into messages, jetons
  from public.appareils a where a.joueur_id = any (p_joueurs);
  if messages is null then return; end if;
  requete := net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
  insert into private.envois_push (requete, jetons) values (requete, jetons);
end;
$$;

create function private.faire_le_menage() returns void
language plpgsql security definer set search_path = '' as $$
declare
  envoi record;
  reponse text;
  ticket jsonb;
  n int;
begin
  -- 1. Téléphones morts (on laisse 2 minutes à Expo pour répondre)
  for envoi in
    select e.requete, e.jetons from private.envois_push e where e.envoye_le < now() - interval '2 minutes'
  loop
    select r.content into reponse from net._http_response r where r.id = envoi.requete and r.status_code = 200;
    if reponse is not null then
      begin
        for ticket, n in
          select t.valeur, t.rang::int
          from jsonb_array_elements(reponse::jsonb -> 'data') with ordinality as t(valeur, rang)
        loop
          if ticket #>> '{details,error}' = 'DeviceNotRegistered' then
            delete from public.appareils where jeton = envoi.jetons[n];
          end if;
        end loop;
      exception when others then
        null; -- réponse illisible : on passe à la suivante
      end;
    end if;
    delete from private.envois_push where requete = envoi.requete;
  end loop;

  -- 2. Sessions
  delete from public.sessions s
  where (
      -- vide (l'organisateur est inscrit à la création : une session sans personne est abandonnée)
      (s.cree_le < now() - interval '1 hour'
        and not exists (select 1 from public.participations p where p.session_id = s.id))
      or (s.annulee_le is not null and s.fin < now() - interval '7 days')
      or s.fin < now() - interval '30 days'
    )
    and not exists (
      select 1 from public.signalements g
      where not g.traite
        and (
          (g.cible = 'session' and g.cible_id = s.id)
          or (g.cible = 'message' and g.cible_id in (select m.id from public.messages m where m.session_id = s.id))
        )
    );
end;
$$;

select cron.schedule('catch-menage', '17 * * * *', 'select private.faire_le_menage()');

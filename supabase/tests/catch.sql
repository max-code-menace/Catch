-- Tests des règles de la base : Catch, création, annulation (B6 de l'audit).
-- À coller dans le SQL Editor de Supabase (ou lancé par Claude). Crée de faux comptes et de fausses sessions,
-- vérifie chaque règle en se mettant à la place d'un compte connecté, puis ANNULE TOUT :
-- le bloc se termine toujours par une erreur « BILAN », qui défait tout ce qu'il a écrit.
-- Lire le bilan : une ligne ✓ par règle respectée, ✗ si une règle ne tient pas.
do $tests$
declare
  a uuid := gen_random_uuid(); -- organisatrice
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid(); -- joueur très actif (limite de 10)
  e uuid := gen_random_uuid(); -- organisateur très actif (limite de 6 par 24 h)
  f uuid := gen_random_uuid();
  g uuid := gen_random_uuid(); -- bloqué par a
  s uuid; s2 uuid; t uuid;
  ids uuid[] := '{}';
  r text; n int; ok boolean;
  bilan text := '';
begin
  -- Faux comptes (le prénom est recopié dans profils)
  insert into auth.users (id, email, raw_user_meta_data)
  select x, x || '@test.invalid', jsonb_build_object('prenom', 'Test')
  from unnest(array[a, b, c, d, e, f, g]) x;
  insert into public.profils (id, prenom) select x, 'Test' from unnest(array[a, b, c, d, e, f, g]) x
  on conflict do nothing;

  -- ——— Création (en tant que a) ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.sessions (sport, titre, lieu, lat, lng, debut, fin, joueurs)
  values ('foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 90 minutes', 2)
  returning id into s;
  select organisateur_id = a into ok from public.sessions where id = s;
  bilan := bilan || case when ok then '✓' else '✗' end || ' la session créée appartient à celui qui la crée' || E'\n';
  select count(*) into n from public.participations where session_id = s and joueur_id = a;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' l’organisatrice est inscrite d’office' || E'\n';
  begin
    insert into public.sessions (sport, titre, lieu, lat, lng, debut, fin, joueurs, cree_le)
    values ('foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 1 hour', 4, now() - interval '2 days');
    bilan := bilan || '✗ on peut écrire soi-même la date de création (S2)' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ impossible d’écrire soi-même la date de création (S2)' || E'\n';
  end;
  execute 'reset role';

  -- ——— Catch ———
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s);
  bilan := bilan || case when r = 'ok' then '✓' else '✗ (' || r || ')' end || ' b catche une place libre' || E'\n';
  r := public.catcher(s);
  select count(*) into n from public.participations where session_id = s and joueur_id = b;
  bilan := bilan || case when r = 'ok' and n = 1 then '✓' else '✗' end || ' catcher deux fois ne prend pas deux places' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s);
  bilan := bilan || case when r = 'complete' then '✓' else '✗ (' || r || ')' end || ' session pleine : « complete »' || E'\n';
  -- c essaie de retirer b
  delete from public.participations where session_id = s and joueur_id = b;
  get diagnostics n = row_count;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' on ne peut pas retirer quelqu’un d’autre' || E'\n';
  execute 'reset role';

  -- ——— Annulation par un inscrit ———
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  delete from public.participations where session_id = s and joueur_id = b;
  get diagnostics n = row_count;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' b peut quitter la session' || E'\n';
  r := public.annuler_session(s);
  bilan := bilan || case when r = 'refuse' then '✓' else '✗ (' || r || ')' end || ' seul l’organisateur peut annuler la session' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s);
  bilan := bilan || case when r = 'ok' then '✓' else '✗ (' || r || ')' end || ' la place libérée peut être reprise' || E'\n';
  execute 'reset role';

  -- ——— L'organisatrice ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  delete from public.participations where session_id = s and joueur_id = a;
  get diagnostics n = row_count;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' l’organisatrice ne peut pas quitter sa propre session (S6)' || E'\n';
  r := public.annuler_session(s);
  bilan := bilan || case when r = 'ok' then '✓' else '✗ (' || r || ')' end || ' l’organisatrice annule sa session' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s);
  bilan := bilan || case when r = 'terminee' then '✓' else '✗ (' || r || ')' end || ' une session annulée ne se catche plus' || E'\n';
  execute 'reset role';

  -- ——— Blocage (posé directement : dans l'app, il passe par la fonction bloquer) ———
  insert into public.blocages (bloqueur_id, bloque_id) values (a, g);
  insert into public.sessions (organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
  values (a, 'foot', 'Test', 'Test', 50.84, 4.35, now() + interval '2 days', now() + interval '2 days 1 hour', 10)
  returning id into s2;
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s2);
  bilan := bilan || case when r = 'introuvable' then '✓' else '✗ (' || r || ')' end || ' une personne bloquée ne peut pas rejoindre' || E'\n';
  execute 'reset role';

  -- ——— Session terminée ———
  insert into public.sessions (organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
  values (f, 'foot', 'Test', 'Test', 50.84, 4.35, now() - interval '3 hours', now() - interval '1 hour', 10)
  returning id into t;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(t);
  bilan := bilan || case when r = 'terminee' then '✓' else '✗ (' || r || ')' end || ' une session finie ne se catche plus' || E'\n';
  execute 'reset role';

  -- ——— Limite de 10 sessions à venir (S3) ———
  for i in 1..6 loop
    insert into public.sessions (organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
    values (e, 'foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 1 hour', 10)
    returning id into t;
    ids := ids || t;
  end loop;
  for i in 1..5 loop
    insert into public.sessions (organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
    values (f, 'foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 1 hour', 10)
    returning id into t;
    ids := ids || t;
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  n := 0;
  for i in 1..10 loop
    if public.catcher(ids[i]) = 'ok' then n := n + 1; end if;
  end loop;
  r := public.catcher(ids[11]);
  bilan := bilan || case when n = 10 and r = 'limite' then '✓' else '✗ (' || n || ', ' || r || ')' end
    || ' 10 sessions à venir maximum, la 11ᵉ répond « limite » (S3)' || E'\n';
  execute 'reset role';

  -- ——— Limite de 6 créations par 24 h ———
  begin
    insert into public.sessions (organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
    values (e, 'foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 1 hour', 10);
    bilan := bilan || '✗ une 7ᵉ session en 24 h a été acceptée' || E'\n';
  exception when others then
    bilan := bilan || case when sqlerrm like '%limite_sessions%' then '✓' else '✗ (' || sqlerrm || ')' end
      || ' pas plus de 6 sessions créées par 24 h' || E'\n';
  end;

  -- ——— Sans compte ———
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
  begin
    r := public.catcher(s2);
    bilan := bilan || '✗ on peut catcher sans compte' || E'\n';
  exception when others then
    bilan := bilan || '✓ il faut un compte pour catcher' || E'\n';
  end;
  execute 'reset role';

  raise exception E'BILAN (tout est annulé)\n%', bilan;
end
$tests$;

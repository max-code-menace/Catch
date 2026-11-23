-- Tests des potes (22 novembre 2026). Même principe que catch.sql :
-- à coller dans le SQL Editor (ou lancé par Claude), crée de faux comptes, vérifie chaque règle
-- en se mettant à la place d'un compte connecté, puis ANNULE TOUT avec une erreur « BILAN ».
do $tests$
declare
  a uuid := gen_random_uuid(); -- organisatrice
  b uuid := gen_random_uuid(); -- a joué avec a
  c uuid := gen_random_uuid(); -- a joué aussi, personne ne le choisit
  d uuid := gen_random_uuid(); -- n'a jamais joué avec eux
  s uuid := gen_random_uuid(); -- session terminée hier
  s2 uuid := gen_random_uuid(); -- session de a demain
  n int; t timestamptz; x uuid;
  bilan text := '';
begin
  insert into auth.users (id, email, raw_user_meta_data)
  select u, u || '@test.invalid', jsonb_build_object('prenom', 'Test')
  from unnest(array[a, b, c, d]) u;
  insert into public.profils (id, prenom) select u, 'Test' from unnest(array[a, b, c, d]) u
  on conflict do nothing;

  insert into public.sessions (id, organisateur_id, sport, titre, lieu, lat, lng, debut, fin, joueurs)
  values (s, a, 'foot', 'Test', 'Test', 50.84, 4.35, now() - interval '1 day 2 hours', now() - interval '1 day', 6),
         (s2, a, 'padel', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 90 minutes', 4);
  insert into public.participations (session_id, joueur_id)
  values (s, a), (s, b), (s, c), (s2, a)
  on conflict do nothing;

  -- ——— b répond : il rejouerait avec a ———
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select jsonb_array_length(joueurs) into n from public.question_rejouer() where session_id = s;
  bilan := bilan || case when n = 2 then '✓' else '✗' end || ' b voit la question avec les 2 autres joueurs' || E'\n';
  select count(*) into n from public.repondre_rejouer(s, array[a]);
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' pas encore potes tant que a n’a pas répondu' || E'\n';
  select count(*) into n from public.question_rejouer();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' une fois répondu, la question disparaît' || E'\n';
  execute 'reset role';

  -- ——— a répond : elle rejouerait avec b → potes ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.repondre_rejouer(s, array[b]) where id = b;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' choix réciproque : a et b deviennent potes' || E'\n';
  select count(*) into n from public.mes_potes() where id = b;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' b est dans les potes de a' || E'\n';
  t := public.regler_dispo(true);
  bilan := bilan || case when t > now() then '✓' else '✗' end || ' a se met dispo ce soir' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.mes_potes() where id = a and dispo;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' b voit a dans ses potes, dispo ce soir' || E'\n';
  select count(*) into n from public.semaine_des_potes() where session_id = s2 and organise;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' b voit la session de demain de a' || E'\n';
  execute 'reset role';

  -- ——— c ne voit rien de tout ça ———
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.rejouer;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' c ne voit pas les choix des autres' || E'\n';
  select count(*) into n from public.mes_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' c n’a pas de potes' || E'\n';
  select count(*) into n from public.semaine_des_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' c ne voit la semaine de personne' || E'\n';
  begin
    insert into public.rejouer (choisisseur_id, choisi_id) values (c, a);
    bilan := bilan || '✗ on peut choisir quelqu’un sans passer par repondre_rejouer' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ impossible d’écrire un choix à la main' || E'\n';
  end;
  begin
    select count(*) into n from public.dispos;
    bilan := bilan || '✗ on peut lire les dispos directement' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ les dispos ne se lisent que par mes_potes' || E'\n';
  end;
  begin
    select count(*) into n from public.repondre_rejouer(s2, array[a]);
    bilan := bilan || '✗ on peut répondre pour une session où on n’était pas' || E'\n';
  exception when others then
    bilan := bilan || case when sqlerrm = 'introuvable' then '✓' else '✗ (' || sqlerrm || ')' end
      || ' impossible de répondre pour une session où on n’était pas' || E'\n';
  end;
  select count(*) into n from public.repondre_rejouer(s, array[a, d]);
  execute 'reset role';
  select count(*) into n from public.rejouer where choisisseur_id = c and choisi_id = d;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' on ne peut choisir que des joueurs de la session' || E'\n';

  -- ——— a n'est plus dispo, puis b bloque a ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  t := public.regler_dispo(false);
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.mes_potes() where id = a and not dispo;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' a n’est plus dispo' || E'\n';
  insert into public.blocages (bloque_id) values (a);
  select count(*) into n from public.mes_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' bloquer retire des potes' || E'\n';
  select count(*) into n from public.semaine_des_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' bloquer cache la semaine' || E'\n';
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.mes_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' dans les deux sens' || E'\n';
  execute 'reset role';

  raise exception E'BILAN (tout est annulé)\n%', bilan;
end;
$tests$;

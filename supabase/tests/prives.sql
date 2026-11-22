-- Tests des messages privés (22 novembre 2026). Même principe que catch.sql :
-- à coller dans le SQL Editor (ou lancé par Claude), crée de faux comptes, vérifie chaque règle
-- en se mettant à la place d'un compte connecté, puis ANNULE TOUT avec une erreur « BILAN ».
do $tests$
declare
  a uuid := gen_random_uuid(); -- organisatrice
  b uuid := gen_random_uuid(); -- inscrit à la session de a
  c uuid := gen_random_uuid(); -- regarde la session sans l'avoir catchée
  s uuid; ca uuid; ba uuid; x uuid;
  r text; n int;
  bilan text := '';
begin
  insert into auth.users (id, email, raw_user_meta_data)
  select u, u || '@test.invalid', jsonb_build_object('prenom', 'Test')
  from unnest(array[a, b, c]) u;
  insert into public.profils (id, prenom) select u, 'Test' from unnest(array[a, b, c]) u
  on conflict do nothing;

  -- a crée une session, b la catche
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.sessions (sport, titre, lieu, lat, lng, debut, fin, joueurs)
  values ('foot', 'Test', 'Test', 50.84, 4.35, now() + interval '1 day', now() + interval '1 day 90 minutes', 4)
  returning id into s;
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.catcher(s);
  execute 'reset role';

  -- ——— c écrit à l'organisatrice sans avoir catché ———
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  ca := public.ouvrir_prive(a, s);
  bilan := bilan || case when ca is not null then '✓' else '✗' end || ' on peut écrire à l’organisateur sans avoir catché' || E'\n';
  x := public.ouvrir_prive(a, s);
  bilan := bilan || case when x = ca then '✓' else '✗' end || ' rouvrir donne la même conversation' || E'\n';
  begin
    x := public.ouvrir_prive(b, s);
    bilan := bilan || '✗ on peut écrire à un inscrit qu’on n’a jamais croisé' || E'\n';
  exception when others then
    bilan := bilan || case when sqlerrm = 'interdit' then '✓' else '✗ (' || sqlerrm || ')' end
      || ' impossible d’écrire à un inscrit qu’on n’a jamais croisé' || E'\n';
  end;
  begin
    insert into public.prives (joueur_a, joueur_b, ouverte_par) values (least(b, c), greatest(b, c), c);
    bilan := bilan || '✗ on peut créer une conversation sans passer par ouvrir_prive' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ impossible de créer une conversation à la main' || E'\n';
  end;
  insert into public.messages_prives (prive_id, texte) values (ca, 'Salut, il faut des crampons ?');
  bilan := bilan || '✓ c écrit dans sa conversation' || E'\n';
  select count(*) into n from public.profils where id = a and prenom is not null;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' c voit le prénom de l’organisatrice' || E'\n';
  execute 'reset role';

  -- ——— a reçoit, b ne voit rien ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select non_lus into n from public.conversations_privees where id = ca;
  bilan := bilan || case when n = 1 then '✓' else '✗ (' || coalesce(n::text, 'absente') || ')' end || ' a voit 1 message non lu de c' || E'\n';
  insert into public.lectures_privees (prive_id, lu_le) values (ca, now());
  select non_lus into n from public.conversations_privees where id = ca;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' après lecture : 0 non lu' || E'\n';
  insert into public.messages_prives (prive_id, texte) values (ca, 'Non, des baskets suffisent');
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.messages_prives where prive_id = ca;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' b ne lit pas la conversation de c et a' || E'\n';
  select count(*) into n from public.prives where id = ca;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' b ne voit même pas qu’elle existe' || E'\n';
  begin
    insert into public.messages_prives (prive_id, texte) values (ca, 'intrus');
    bilan := bilan || '✗ b peut écrire dans la conversation de c et a' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ b ne peut pas écrire dans la conversation de c et a' || E'\n';
  end;
  -- b a joué avec a : il peut lui écrire sans préciser de session
  ba := public.ouvrir_prive(a);
  select count(*) into n from public.prives where id = ba and session_id = s;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' un coéquipier peut écrire (session retenue)' || E'\n';
  execute 'reset role';

  -- ——— a bloque c ———
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.blocages (bloque_id) values (c);
  select count(*) into n from public.conversations_privees where id = ca;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' la conversation disparaît pour celle qui bloque' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    insert into public.messages_prives (prive_id, texte) values (ca, 'encore moi');
    bilan := bilan || '✗ une personne bloquée peut encore écrire' || E'\n';
  exception when insufficient_privilege then
    bilan := bilan || '✓ une personne bloquée ne peut plus écrire' || E'\n';
  end;
  begin
    x := public.ouvrir_prive(a, s);
    bilan := bilan || '✗ une personne bloquée peut rouvrir la conversation' || E'\n';
  exception when others then
    bilan := bilan || case when sqlerrm = 'interdit' then '✓' else '✗ (' || sqlerrm || ')' end
      || ' une personne bloquée ne peut pas rouvrir' || E'\n';
  end;
  execute 'reset role';

  raise exception E'BILAN (tout est annulé)\n%', bilan;
end;
$tests$;

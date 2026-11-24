-- Tests du signalement d'une photo de profil (24 novembre 2026). Même principe que catch.sql :
-- tout est annulé à la fin (« BILAN »). Ne supprime rien.
do $tests$
declare
  b uuid := gen_random_uuid();  -- a une photo
  a uuid := gen_random_uuid();  -- pote de b, signale la photo
  f uuid := gen_random_uuid();  -- autre pote de b
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  n int;
  bilan text := '';
begin
  insert into auth.users (id, email) select u, u || '@test.invalid' from unnest(array[a, b, c, d, f]) u;
  insert into public.profils (id, prenom) select u, 'Test' from unnest(array[a, b, c, d, f]) u on conflict do nothing;
  insert into public.rejouer (choisisseur_id, choisi_id) values (a, b), (b, a), (f, b), (b, f);
  update public.profils set photo = 'https://x.supabase.co/storage/v1/object/public/photos/' || b || '/photo.jpg' where id = b;

  -- a signale la photo de b
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.signalements (cible, cible_id, motif) values ('photo', b, 'contenu');
  bilan := bilan || '✓ on peut signaler une photo' || E'\n';
  select count(*) into n from public.photos_des_potes() where id = b;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' celui qui signale ne voit plus la photo' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.photos_des_potes() where id = b;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' un autre pote la voit encore (1 signalement)' || E'\n';
  execute 'reset role';

  -- c et d la signalent aussi : 3 personnes
  foreach n in array array[1, 2] loop
    perform set_config('request.jwt.claims',
      json_build_object('sub', case n when 1 then c else d end, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.signalements (cible, cible_id, motif) values ('photo', b, 'contenu');
    execute 'reset role';
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.photos_des_potes() where id = b;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' 3 signalements : cachée pour tout le monde' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  bilan := bilan || case when public.ma_photo() is not null then '✓' else '✗' end || ' son propriétaire la voit toujours' || E'\n';
  begin
    perform private.retirer_photo(b);
    bilan := bilan || '✗ un compte peut appeler retirer_photo' || E'\n';
  exception when others then
    bilan := bilan || '✓ un compte ne peut pas appeler retirer_photo' || E'\n';
  end;
  execute 'reset role';

  -- L'équipe retire la photo
  perform private.retirer_photo(b);
  select count(*) into n from public.profils where id = b and photo is null;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' retirer_photo efface la photo' || E'\n';
  select count(*) into n from public.signalements where cible = 'photo' and cible_id = b and not traite;
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' et classe les signalements' || E'\n';

  raise exception E'BILAN (tout est annulé)\n%', bilan;
end;
$tests$;

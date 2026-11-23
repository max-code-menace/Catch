-- Tests de la photo de profil (23 novembre 2026). Même principe que catch.sql : tout est annulé à la fin (« BILAN »).
do $tests$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  n int; t text;
  bilan text := '';
begin
  insert into auth.users (id, email) select u, u || '@test.invalid' from unnest(array[a, b, c]) u;
  insert into public.profils (id, prenom) select u, 'Test' from unnest(array[a, b, c]) u on conflict do nothing;
  insert into public.rejouer (choisisseur_id, choisi_id) values (a, b), (b, a);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.regler_photo('https://x.supabase.co/storage/v1/object/public/photos/' || b || '/photo.jpg');
    bilan := bilan || '✗ on peut mettre la photo de quelqu’un d’autre' || E'\n';
  exception when others then
    bilan := bilan || case when sqlerrm = 'interdit' then '✓' else '✗ (' || sqlerrm || ')' end || ' impossible de prendre la photo de quelqu’un d’autre' || E'\n';
  end;
  perform public.regler_photo('https://x.supabase.co/storage/v1/object/public/photos/' || a || '/photo.jpg?v=1');
  t := public.ma_photo();
  bilan := bilan || case when t like '%' || a || '%' then '✓' else '✗' end || ' a enregistre sa photo' || E'\n';
  begin
    insert into storage.objects (bucket_id, name, owner) values ('photos', b || '/photo.jpg', a);
    bilan := bilan || '✗ on peut déposer dans le dossier de quelqu’un d’autre' || E'\n';
  exception when others then
    bilan := bilan || '✓ impossible de déposer dans le dossier de quelqu’un d’autre' || E'\n';
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.photos_des_potes() where id = a;
  bilan := bilan || case when n = 1 then '✓' else '✗' end || ' un pote voit la photo' || E'\n';
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.photos_des_potes();
  bilan := bilan || case when n = 0 then '✓' else '✗' end || ' quelqu’un d’autre ne la voit pas par les potes' || E'\n';
  execute 'reset role';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.regler_photo(null);
  bilan := bilan || case when public.ma_photo() is null then '✓' else '✗' end || ' retirer sa photo' || E'\n';
  execute 'reset role';

  raise exception E'BILAN (tout est annulé)\n%', bilan;
end;
$tests$;

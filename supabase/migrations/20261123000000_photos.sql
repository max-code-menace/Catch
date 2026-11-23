-- Photo de profil (23 novembre 2026, demande de Maxime) : facultative, l'initiale reste par défaut.
-- Rangée dans le stockage Supabase, dossier « photos/<id du compte>/ ». Chacun ne peut déposer,
-- remplacer ou retirer que dans son propre dossier. L'adresse de la photo est enregistrée dans profils.photo.
-- Qui la voit : soi-même, et ses potes. Ne supprime rien.

alter table public.profils add column photo text check (photo is null or char_length(photo) <= 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Chacun dépose sa photo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Chacun remplace sa photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Chacun relit sa photo" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Chacun retire sa photo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Enregistre (ou efface, avec null) l'adresse de sa photo. Seulement une adresse de son propre dossier.
create function public.regler_photo(p_photo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := (select auth.uid());
begin
  if moi is null then
    raise exception 'connexion';
  end if;
  if p_photo is not null and position('/storage/v1/object/public/photos/' || moi::text || '/' in p_photo) = 0 then
    raise exception 'interdit';
  end if;
  update public.profils set photo = p_photo where id = moi;
end;
$$;
revoke all on function public.regler_photo(text) from public, anon;
grant execute on function public.regler_photo(text) to authenticated;

-- Ma photo, et celles de mes potes
create function public.ma_photo() returns text
language sql stable security definer set search_path = '' as $$
  select photo from public.profils where id = (select auth.uid());
$$;
revoke all on function public.ma_photo() from public, anon;
grant execute on function public.ma_photo() to authenticated;

create function public.photos_des_potes() returns table (id uuid, photo text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.photo from public.profils p
  where p.photo is not null and private.sont_potes((select auth.uid()), p.id);
$$;
revoke all on function public.photos_des_potes() from public, anon;
grant execute on function public.photos_des_potes() to authenticated;

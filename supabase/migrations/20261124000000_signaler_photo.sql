-- Signaler une photo de profil (24 novembre 2026). Ne supprime aucune donnée : la seule « suppression »
-- est celle de l'ancienne règle sur la colonne `cible`, remplacée tout de suite par une règle plus large.
--
-- 1. On peut signaler une photo (cible 'photo', cible_id = la personne).
-- 2. Celui qui signale ne voit plus cette photo, tout de suite (l'initiale revient).
-- 3. Signalée par 3 personnes différentes et pas encore traitée : la photo est cachée pour tout le monde
--    (sauf pour son propriétaire) en attendant que l'équipe regarde.
-- 4. L'équipe est prévenue « Sur une photo de profil ». Pour retirer la photo : dans le SQL Editor,
--    `select private.retirer_photo('<id de la personne>');` (le fichier reste dans le stockage,
--    à effacer dans Storage > photos si besoin).

alter table public.signalements drop constraint signalements_cible_check;
alter table public.signalements
  add constraint signalements_cible_check check (cible in ('session', 'joueur', 'message', 'photo'));

-- Photo cachée pour tout le monde : 3 signalements de personnes différentes, pas encore traités
create function private.photo_cachee(p_personne uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(distinct g.auteur_id) >= 3
  from public.signalements g
  where g.cible = 'photo' and g.cible_id = p_personne and not g.traite;
$$;
revoke all on function private.photo_cachee(uuid) from public, anon, authenticated;

create or replace function public.photos_des_potes() returns table (id uuid, photo text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.photo from public.profils p
  where p.photo is not null
    and private.sont_potes((select auth.uid()), p.id)
    -- Une photo que j'ai signalée, je ne la vois plus
    and not exists (
      select 1 from public.signalements g
      where g.cible = 'photo' and g.cible_id = p.id and g.auteur_id = (select auth.uid())
    )
    and not private.photo_cachee(p.id);
$$;
revoke all on function public.photos_des_potes() from public, anon;
grant execute on function public.photos_des_potes() to authenticated;

-- Alerte à l'équipe : même texte qu'avant, avec « une photo de profil » en plus
create or replace function private.prevenir_signalement() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  equipe uuid[];
  motifs constant jsonb := '{"comportement": "Comportement déplacé", "contenu": "Contenu inapproprié", "faux": "Fausse session ou arnaque", "danger": "Quelqu’un se sent en danger", "autre": "Autre"}';
begin
  select array_agg(joueur_id) into equipe from private.moderateurs;
  if equipe is null then return new; end if;
  perform private.pousser(
    equipe,
    'Signalement : ' || coalesce(motifs ->> new.motif, new.motif),
    'Sur ' || case new.cible
        when 'session' then 'une session'
        when 'message' then 'un message'
        when 'photo' then 'une photo de profil'
        else 'une personne' end
      || coalesce(' · ' || left(new.details, 120), '') || '. À lire dans la table signalements.',
    jsonb_build_object('type', 'signalement')
  );
  return new;
end;
$$;

-- Pour l'équipe, depuis le SQL Editor seulement : retire la photo d'une personne et classe ses signalements
create function private.retirer_photo(p_personne uuid) returns void
language sql security definer set search_path = '' as $$
  update public.profils set photo = null where id = p_personne;
  update public.signalements set traite = true where cible = 'photo' and cible_id = p_personne;
$$;
revoke all on function private.retirer_photo(uuid) from public, anon, authenticated;

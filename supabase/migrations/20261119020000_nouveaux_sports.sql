-- Étape 12 : 8 nouveaux sports (squash, ping-pong, boxe, course, vélo, ultimate, pétanque, street workout).
-- On élargit la liste des sports permis pour les sessions et les sports suivis.
-- Seules les anciennes contraintes de liste sont retirées (aucune donnée supprimée).

alter table public.sessions drop constraint if exists sessions_sport_check1;
alter table public.sessions drop constraint if exists sessions_sport_check;
alter table public.sessions add constraint sessions_sport_check check (sport in (
  'foot','basket','volley','tennis','padel','badminton','squash','pingpong','escalade','boxe',
  'course','velo','ultimate','spikeball','petanque','streetworkout','rugby','autre'));

alter table public.reglages_notifications drop constraint if exists reglages_notifications_sports_check;
alter table public.reglages_notifications add constraint reglages_notifications_sports_check check (sports <@ array[
  'foot','basket','volley','tennis','padel','badminton','squash','pingpong','escalade','boxe',
  'course','velo','ultimate','spikeball','petanque','streetworkout','rugby','autre']::text[]);

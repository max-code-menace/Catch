-- S7 de l'audit : les visiteurs et les comptes ne font que lire les lieux et les événements.
-- On retire les droits inutiles donnés par défaut (vider la table, s'y référencer, y poser un déclencheur),
-- et on ne les donne plus aux prochaines tables. Rien n'est supprimé.

revoke truncate, references, trigger on public.lieux, public.evenements from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

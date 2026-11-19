-- Audit du 19 novembre 2026, point S6 (filet de sécurité du point B2).
-- L'organisateur ne peut plus quitter sa propre session : il l'annule pour tout le monde (fonction `annuler_session`).
-- Ne supprime rien : la règle existante est modifiée.
alter policy "On annule sa propre participation" on public.participations
  using (
    joueur_id = (select auth.uid())
    and not exists (
      select 1 from public.sessions s
      where s.id = participations.session_id and s.organisateur_id = (select auth.uid())
    )
  );

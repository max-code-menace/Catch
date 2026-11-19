-- Liens « Réserver » des autres salles payantes, relevés le 19 novembre 2026 sur leurs propres sites.
-- Mounier : une seule page de réservation (Big Captain) pour tous ses terrains, celle de ses boutons « Réserver un terrain ».
-- Escalade : pas de réservation de créneau, on renvoie vers la page utile pour une première venue.
-- Boxe : cours d'essai ou réservation de cours. Ne supprime rien.

update public.lieux set reservations = reservations || jsonb_build_object(
    'padel', 'https://my.big-captain.com/site/mounier/bookings/online-booking',
    'tennis', 'https://my.big-captain.com/site/mounier/bookings/online-booking',
    'badminton', 'https://my.big-captain.com/site/mounier/bookings/online-booking',
    'squash', 'https://my.big-captain.com/site/mounier/bookings/online-booking')
  where nom = 'Centre sportif Mounier';
update public.lieux set reservations = reservations || jsonb_build_object('badminton', 'https://www.iclub.be/register6_public.asp?ClubID=4&ActiviteID=6&LG=FR')
  where nom = 'Brussels Badminton Club';
update public.lieux set reservations = reservations || jsonb_build_object('escalade', 'https://petite-ile.be/premiere-visite/')
  where nom = 'Petite Île';
update public.lieux set reservations = reservations || jsonb_build_object('escalade', 'https://abloc.brussels/tarifs')
  where nom = 'À Bloc';
update public.lieux set reservations = reservations || jsonb_build_object('escalade', 'https://www.maniak.club/padoue')
  where nom = 'Maniak Padoue';
update public.lieux set reservations = reservations || jsonb_build_object('boxe', 'https://www.nbsboxing.com/cours-essai-gratuit/')
  where nom = 'NBS Boxing';
update public.lieux set reservations = reservations || jsonb_build_object('boxe', 'https://vsboxing.com/reservation-en-ligne/')
  where nom = 'VS Boxing';
update public.lieux set reservations = reservations || jsonb_build_object('boxe', 'https://www.champions-academy.be/contact#essai')
  where nom = 'Champion''s Academy';

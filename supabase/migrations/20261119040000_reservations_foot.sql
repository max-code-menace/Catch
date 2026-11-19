-- Liens « Réserver » pour le foot, relevés le 19 novembre 2026 sur les sites des salles :
-- Fitfive et City Five renvoient vers leur page de réservation Sport-finder, Royal Foot Indoor
-- vers sa page « Réservez un terrain » (téléphone et e-mail, pas de réservation en ligne). Ne supprime rien.

update public.lieux set reservations = reservations || jsonb_build_object('foot', 'https://www.sport-finder.com/fr/center/fit-five/booking/field_rental/116/book?sport=1')
  where nom = 'Fitfive';
update public.lieux set reservations = reservations || jsonb_build_object('foot', 'https://www.sport-finder.com/fr/center/urban-foot5-molenbeek/booking/field_rental/43/configure')
  where nom = 'City Five';
update public.lieux set reservations = reservations || jsonb_build_object('foot', 'https://royalfootindoor.be/?page_id=2562')
  where nom = 'Royal Foot Indoor';

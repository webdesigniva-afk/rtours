alter table offer_itinerary_days
  add column if not exists accommodation text,
  add column if not exists meals text,
  add column if not exists transport text;

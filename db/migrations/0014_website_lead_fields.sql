alter table inquiries
  add column if not exists destination text,
  add column if not exists departure text,
  add column if not exists adults integer,
  add column if not exists children integer,
  add column if not exists room_type text,
  add column if not exists budget text,
  add column if not exists lead_source text;

update inquiries inquiry
set
  destination = coalesce(
    inquiry.destination,
    nullif(trim(concat_ws(', ', nullif(offer.country, ''), nullif(offer.region, ''))), '')
  ),
  departure = coalesce(inquiry.departure, inquiry.travel_period),
  adults = coalesce(inquiry.adults, inquiry.travelers_count),
  children = coalesce(inquiry.children, 0),
  lead_source = coalesce(inquiry.lead_source, 'website')
from offers offer
where offer.id = inquiry.offer_id;

update inquiries
set
  departure = coalesce(departure, travel_period),
  adults = coalesce(adults, travelers_count),
  children = coalesce(children, 0),
  lead_source = coalesce(lead_source, 'website')
where offer_id is null;

alter table inquiries
  drop constraint if exists inquiries_status_check,
  add constraint inquiries_status_check
    check (status in ('new', 'contacted', 'offer_sent', 'option', 'booked', 'lost')),
  drop constraint if exists inquiries_adults_check,
  add constraint inquiries_adults_check check (adults is null or adults >= 0),
  drop constraint if exists inquiries_children_check,
  add constraint inquiries_children_check check (children is null or children >= 0);

create index if not exists inquiries_status_idx on inquiries(status);
create index if not exists inquiries_created_at_idx on inquiries(created_at desc);
create index if not exists inquiries_offer_id_idx on inquiries(offer_id);

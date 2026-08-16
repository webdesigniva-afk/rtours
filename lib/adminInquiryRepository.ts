import { dbQuery } from "./db";
import { normalizeDateLabel } from "./dateFormat";

export type AdminInquiryListItem = {
  id: string;
  offerId: string | null;
  offerSlug: string | null;
  offerTitle: string;
  destination: string;
  departure: string;
  adults: number | null;
  children: number | null;
  roomType: string | null;
  budget: string | null;
  travelersCount: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  sourcePage: string | null;
  leadSource: string | null;
  assignedToName: string | null;
  nextActionAt: string | null;
  lastContactedAt: string | null;
  lostReason: string | null;
  internalNote: string | null;
  statusUpdatedAt: string;
  matchingContactsCount: number;
  status: string;
  createdAt: string;
};

type AdminInquiryRow = {
  id: string;
  offer_id: string | null;
  offer_slug: string | null;
  offer_title: string | null;
  destination: string | null;
  departure: string | null;
  first_offer_departure: string | null;
  adults: number | null;
  children: number | null;
  room_type: string | null;
  budget: string | null;
  travelers_count: number | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  notes: string | null;
  source_page: string | null;
  lead_source: string | null;
  assigned_to_name: string | null;
  next_action_at: string | null;
  last_contacted_at: string | null;
  lost_reason: string | null;
  internal_note: string | null;
  status_updated_at: string;
  matching_contacts_count: number;
  status: string;
  created_at: string;
};

export async function listAdminInquiries(): Promise<AdminInquiryListItem[]> {
  const result = await dbQuery<AdminInquiryRow>(
    `
      select
        inquiry.id,
        inquiry.offer_id,
        offer.slug as offer_slug,
        coalesce(nullif(inquiry.offer_title, ''), offer.title, 'Общо запитване') as offer_title,
        coalesce(
          nullif(inquiry.destination, ''),
          nullif(trim(concat_ws(', ', nullif(offer.country, ''), nullif(offer.region, ''))), '')
        ) as destination,
        coalesce(nullif(inquiry.departure, ''), nullif(inquiry.travel_period, '')) as departure,
        first_date.label as first_offer_departure,
        inquiry.adults,
        inquiry.children,
        inquiry.room_type,
        inquiry.budget,
        inquiry.travelers_count,
        inquiry.contact_name,
        inquiry.contact_email,
        inquiry.contact_phone,
        inquiry.notes,
        inquiry.source_page,
        inquiry.lead_source,
        inquiry.assigned_to_name,
        inquiry.next_action_at::text,
        inquiry.last_contacted_at::text,
        inquiry.lost_reason,
        inquiry.internal_note,
        inquiry.status_updated_at::text,
        (
          select count(*)::int
          from inquiries duplicate
          where duplicate.id <> inquiry.id
            and (
              lower(duplicate.contact_email) = lower(inquiry.contact_email)
              or (
                nullif(duplicate.contact_phone, '') is not null
                and duplicate.contact_phone = inquiry.contact_phone
              )
            )
        ) as matching_contacts_count,
        inquiry.status,
        inquiry.created_at::text
      from inquiries inquiry
      left join offers offer on offer.id = inquiry.offer_id
      left join lateral (
        select coalesce(nullif(label, ''), start_date::text) as label
        from offer_dates
        where offer_dates.offer_id = offer.id
        order by sort_order, start_date nulls last
        limit 1
      ) first_date on true
      order by inquiry.created_at desc
      limit 200
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    offerId: row.offer_id,
    offerSlug: row.offer_slug,
    offerTitle: row.offer_title || "Общо запитване",
    destination: row.destination || "Непосочена дестинация",
    departure: normalizeDateLabel(
      row.departure && !row.departure.includes("?") ? row.departure : row.first_offer_departure,
      undefined,
      undefined,
      "Не е посочено отпътуване"
    ),
    adults: row.adults,
    children: row.children,
    roomType: row.room_type,
    budget: row.budget,
    travelersCount: row.travelers_count,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    notes: row.notes,
    sourcePage: row.source_page,
    leadSource: row.lead_source,
    assignedToName: row.assigned_to_name,
    nextActionAt: row.next_action_at,
    lastContactedAt: row.last_contacted_at,
    lostReason: row.lost_reason,
    internalNote: row.internal_note,
    statusUpdatedAt: row.status_updated_at,
    matchingContactsCount: row.matching_contacts_count,
    status: row.status || "new",
    createdAt: row.created_at
  }));
}

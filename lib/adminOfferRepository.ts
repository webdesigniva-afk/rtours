import { dbQuery } from "./db";

export type AdminOfferRecord = {
  id: string;
  slug: string;
  product_type: string;
  title: string;
  summary: string | null;
  description: string | null;
  country: string | null;
  region: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  transport: string;
  price_from: string | null;
  currency: "EUR" | "BGN";
  source: string;
  status: string;
  hero_image_url: string | null;
  is_author_program: boolean;
  itinerary_days: Array<{
    day: number;
    title: string;
    description: string;
  }> | null;
  created_at: string;
  updated_at: string;
};

export async function getAdminOfferBySlug(slug: string) {
  const result = await dbQuery<AdminOfferRecord>(
    `
      select
        id,
        slug,
        product_type::text,
        title,
        summary,
        description,
        country,
        region,
        duration_days,
        duration_nights,
        transport::text,
        price_from::text,
        currency,
        source::text,
        status::text,
        hero_image_url,
        is_author_program,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'day', itinerary.day_number,
                'title', itinerary.title,
                'description', itinerary.description
              )
              order by itinerary.sort_order, itinerary.day_number
            )
            from offer_itinerary_days itinerary
            where itinerary.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as itinerary_days,
        created_at::text,
        updated_at::text
      from offers
      where slug = $1
      limit 1
    `,
    [slug]
  );

  return result.rows[0] ?? null;
}

export type AdminOfferListItem = {
  slug: string;
  title: string;
  destination: string;
  type: "Екскурзия" | "Почивка" | "Круиз";
  source: string;
  departures: number;
  price: string;
  status: "Публикувана" | "За преглед" | "Импортирана" | "Чернова" | "Архивирана";
  publication: "site" | "draft";
  collection: "Red Signature" | "Red Escape" | "Red Moments" | "Без колекция";
  image: string;
};

function mapProductType(productType: string): AdminOfferListItem["type"] {
  if (productType === "holiday") return "Почивка";
  return "Екскурзия";
}

function mapSource(source: string) {
  if (source === "xml") return "XML импорт";
  if (source === "api") return "API синхронизация";
  if (source === "erp") return "ERP";
  return "RedTours";
}

function mapStatus(status: string): AdminOfferListItem["status"] {
  if (status === "published") return "Публикувана";
  if (status === "review") return "За преглед";
  if (status === "archived") return "Архивирана";
  if (status === "needs_changes") return "За преглед";
  return "Чернова";
}

export async function listAdminOfferItems() {
  const result = await dbQuery<AdminOfferRecord>(
    `
      select
        id,
        slug,
        product_type::text,
        title,
        summary,
        description,
        country,
        region,
        duration_days,
        duration_nights,
        transport::text,
        price_from::text,
        currency,
        source::text,
        status::text,
        hero_image_url,
        is_author_program,
        '[]'::jsonb as itinerary_days,
        created_at::text,
        updated_at::text
      from offers
      order by updated_at desc
      limit 100
    `
  );

  return result.rows.map((offer): AdminOfferListItem => ({
    slug: offer.slug,
    title: offer.title,
    destination: [offer.country, offer.region].filter(Boolean).join(", ") || "Без дестинация",
    type: mapProductType(offer.product_type),
    source: mapSource(offer.source),
    departures: 0,
    price: offer.price_from ? `${Number(offer.price_from).toLocaleString("bg-BG")} ${offer.currency}` : "не е въведена",
    status: mapStatus(offer.status),
    publication: offer.status === "published" ? "site" : "draft",
    collection: "Без колекция",
    image: offer.hero_image_url || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=220&q=72"
  }));
}

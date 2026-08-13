import fs from "node:fs";
import { Pool } from "pg";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const slug = "yaponiya-sakura-red-signature-2027";

function slugify(label) {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-я]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `term-${Date.now()}`;
}

async function upsertTerm(client, offerId, type, label, sortOrder = 100) {
  const term = await client.query(
    `
      insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
      values ($1::taxonomy_term_type, $2, $3, $3, '#b52b26', 'tag', $4)
      on conflict (type, slug) do update
      set name = excluded.name,
          public_label = excluded.public_label,
          updated_at = now()
      returning id
    `,
    [type, slugify(label), label, sortOrder]
  );

  await client.query(
    `
      insert into offer_taxonomy_terms (offer_id, term_id, source, confidence)
      values ($1, $2, 'manual', 100)
      on conflict (offer_id, term_id) do update
      set source = excluded.source,
          confidence = excluded.confidence
    `,
    [offerId, term.rows[0].id]
  );
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const offerResult = await client.query(
      `
        insert into offers (
          slug, product_type, product_type_label, title, summary, description,
          country, region, city, duration_days, duration_nights, transport,
          price_from, currency, price_note, price_includes_taxes, source, status,
          hero_image_url, seo_meta_title, seo_meta_description, seo_keywords,
          seo_canonical_url, seo_structured_data_type, is_author_program,
          publish_at, reviewed_at, review_notes, updated_at
        ) values (
          $1, 'package', 'Standard Red tours Program', $2, $3, $4,
          'Япония', 'Токио, Хаконе, Киото, Нара, Осака', 'Токио', 10, 8, 'flight',
          4890, 'EUR', $5, true, 'manual', 'published',
          $6, $7, $8, $9,
          $10, 'TouristTrip', true,
          now(), now(), $11, now()
        )
        on conflict (slug) do update set
          product_type = excluded.product_type,
          product_type_label = excluded.product_type_label,
          title = excluded.title,
          summary = excluded.summary,
          description = excluded.description,
          country = excluded.country,
          region = excluded.region,
          city = excluded.city,
          duration_days = excluded.duration_days,
          duration_nights = excluded.duration_nights,
          transport = excluded.transport,
          price_from = excluded.price_from,
          currency = excluded.currency,
          price_note = excluded.price_note,
          price_includes_taxes = excluded.price_includes_taxes,
          source = excluded.source,
          status = excluded.status,
          hero_image_url = excluded.hero_image_url,
          seo_meta_title = excluded.seo_meta_title,
          seo_meta_description = excluded.seo_meta_description,
          seo_keywords = excluded.seo_keywords,
          seo_canonical_url = excluded.seo_canonical_url,
          seo_structured_data_type = excluded.seo_structured_data_type,
          is_author_program = excluded.is_author_program,
          publish_at = excluded.publish_at,
          reviewed_at = excluded.reviewed_at,
          review_notes = excluded.review_notes,
          updated_at = now()
        returning id
      `,
      [
        slug,
        "Япония по време на сакура",
        "Премиум авторска програма през Токио, Хаконе, Киото и Осака с подбран ритъм, силни визуални моменти и достатъчно време за лично преживяване.",
        [
          "Това пътуване е създадено за клиенти, които искат Япония да бъде преживяна спокойно, красиво и с контекст, а не като списък от отметки.",
          "Програмата комбинира големия градски ритъм на Токио, гледките към Фуджи, храмовете и градините на Киото, среща с Нара и финал в Осака.",
          "Акцентът е върху сезона на сакура, внимателно подбрани квартали, удобна логистика, добри хотели и баланс между организирана програма и свободно време."
        ].join("\n\n"),
        "Цена от човек при двойно настаняване. Потвърждение след проверка на самолетните места и хотелите.",
        "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1800&q=86",
        "Япония по време на сакура | Red Tours",
        "Премиум авторска програма до Япония през сезона на сакура: Токио, Хаконе, Киото, Нара и Осака с включена логистика и Red Tours селекция.",
        ["Япония", "сакура", "Токио", "Киото", "авторска програма", "Red Signature"],
        `/offers/${slug}`,
        "Реалистична тестова ръчна оферта за проверка на публичния дизайн и publish flow."
      ]
    );

    const offerId = offerResult.rows[0].id;
    for (const table of ["offer_destinations", "offer_dates", "offer_media", "offer_itinerary_days", "offer_services", "offer_highlights", "offer_taxonomy_terms", "offer_visibility_rules"]) {
      await client.query(`delete from ${table} where offer_id = $1`, [offerId]);
    }

    const destinations = [
      ["Япония", "Канто", "Токио", true, 0],
      ["Япония", "Хаконе и Фуджи", "Хаконе", false, 1],
      ["Япония", "Кансай", "Киото", false, 2],
      ["Япония", "Кансай", "Нара", false, 3],
      ["Япония", "Кансай", "Осака", false, 4]
    ];
    for (const row of destinations) {
      await client.query("insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order) values ($1,$2,$3,$4,$5,$6)", [offerId, ...row]);
    }

    const media = [
      ["https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1800&q=86", "Сакура в Япония", "Сезонът на цъфналите вишни", true, 0],
      ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=84", "Киото и традиционна японска архитектура", "Киото", false, 1],
      ["https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1600&q=84", "Токио вечер", "Токио", false, 2],
      ["https://images.unsplash.com/photo-1570459027562-4a916cc6113f?auto=format&fit=crop&w=1600&q=84", "Фуджи и японски пейзаж", "Фуджи", false, 3]
    ];
    for (const row of media) {
      await client.query("insert into offer_media (offer_id, url, alt, caption, is_primary, sort_order, source) values ($1,$2,$3,$4,$5,$6,'redtours')", [offerId, ...row]);
    }

    const dates = [
      ["Сакура сезон, 22 март 2027", "2027-03-22", "2027-03-31", "София / Истанбул / Токио", "limited", 28, 16, 6, 6, 4890, "EUR", "option_until", "2026-09-15T18:00:00+03:00", 900, 45, "Ограничен блок места. Препотвърждение на самолетни места и хотели при заявка.", 0],
      ["Сакура сезон, 5 април 2027", "2027-04-05", "2027-04-14", "София / Истанбул / Токио", "available", 28, 10, 8, 10, 4970, "EUR", "budgetary", null, 900, 45, "Ориентировъчна цена до финално потвърждение на авиотарифата.", 1]
    ];
    for (const row of dates) {
      await client.query(
        `
          insert into offer_dates (
            offer_id, label, start_date, end_date, departure_points, availability,
            seats_total, seats_confirmed, seats_option, seats_available,
            price_from, currency, price_status, option_until, deposit_amount, payment_due_days, notes, sort_order
          ) values ($1,$2,$3,$4,$5,$6::availability_status,$7,$8,$9,$10,$11,$12,$13::price_status,$14,$15,$16,$17,$18)
        `,
        [offerId, ...row]
      );
    }

    const itinerary = [
      [1, "Полет от София към Токио", "Среща на летището, международен полет с прекачване и нощувка на борда.", null, "Хранене на борда", "Самолет"],
      [2, "Първа среща с Токио", "Пристигане, трансфер и настаняване. Следобедна разходка в района на хотела и спокойна вечеря за адаптация.", "хотел 4* в Токио", "вечеря", "частен трансфер"],
      [3, "Сакура, храмове и квартали на Токио", "Асакуса, Сумида парк и Гинза. Включена е пауза за чай и време за снимки при най-красивите места със сакура според сезона.", "хотел 4* в Токио", "закуска", "метро и пешеходна програма"],
      [4, "Модерно Токио: Шибуя, Хараджуку и Омотесандо", "Ден за съвременната страна на града: Шибуя, Мейджи, Хараджуку и дизайнерските улици около Омотесандо.", "хотел 4* в Токио", "закуска", "обществен транспорт"],
      [5, "Хаконе и гледки към Фуджи", "Отпътуване към Хаконе. При подходящо време - гледки към Фуджи, езерото Аши и музей на открито.", "риокан или хотел в Хаконе", "закуска и вечеря", "частен автобус"],
      [6, "С шинкансен към Киото", "Пътуване с бърз влак до Киото. Следобедна програма в Гион и първа среща с традиционните улици и чайни къщи.", "хотел 4* в Киото", "закуска", "шинкансен"],
      [7, "Киото: златни храмове, градини и бамбукова гора", "Кинкакуджи, Арашияма и избрани градини с плавен ритъм, време за снимки и лично преживяване.", "хотел 4* в Киото", "закуска", "частен автобус"],
      [8, "Нара и светилището Фушими Инари", "Полудневна екскурзия до Нара с парка и храма Тодайджи. Следобед - Фушими Инари и червените тории.", "хотел 4* в Киото", "закуска", "влак и пешеходна програма"],
      [9, "Осака: вкусове, светлини и финална вечер", "Пътуване до Осака, разходка в Дотонбори и свободно време за последни покупки. Финална вечеря с местни вкусове.", "хотел 4* в Осака", "закуска и вечеря", "влак"],
      [10, "Полет към България", "Трансфер до летището и полет към София с прекачване. Пристигане според разписанието на авиокомпанията.", null, "закуска / хранене на борда", "самолет"]
    ];
    for (let index = 0; index < itinerary.length; index += 1) {
      await client.query("insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order) values ($1,$2,$3,$4,$5,$6,$7,$8)", [offerId, ...itinerary[index], index]);
    }

    const highlights = [
      "Сакура сезон с подбрани места според реалния цъфтеж",
      "Токио, Хаконе, Киото, Нара и Осака в балансиран маршрут",
      "Шинкансен преживяване между Токио и Киото",
      "Гледки към Фуджи при подходящо време",
      "Малка група и премиум Red Tours селекция"
    ];
    for (let index = 0; index < highlights.length; index += 1) {
      await client.query("insert into offer_highlights (offer_id, label, sort_order) values ($1,$2,$3)", [offerId, highlights[index], index]);
    }

    const included = ["самолетен билет с включен чекиран багаж", "летищни такси", "8 нощувки в хотели 4* или сходни", "закуски по програма", "2 вечери по програма", "трансфери и транспорт по маршрута", "билет за шинкансен", "местни екскурзоводи за ключови посещения", "представител/водач от Red Tours при минимум група", "медицинска застраховка"];
    const excluded = ["лични разходи", "допълнителни хранения и напитки", "бакшиши за местни водачи и шофьори", "входни такси извън описаните", "доплащане за единична стая", "разходи при промяна на авиотарифи след изтичане на опцията"];
    for (let index = 0; index < included.length; index += 1) {
      await client.query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1,'included',$2,$3)", [offerId, included[index], index]);
    }
    for (let index = 0; index < excluded.length; index += 1) {
      await client.query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1,'excluded',$2,$3)", [offerId, excluded[index], index]);
    }

    const terms = [
      ["badge", "АВТОРСКА ПРОГРАМА"], ["badge", "НАШ ИЗБОР"], ["badge", "ГАРАНТИРАНО ОТПЪТУВАНЕ"],
      ["collection", "Red Signature"], ["collection", "Red Moments"],
      ["audience", "Двойки"], ["audience", "Приятели"], ["audience", "Малки групи"], ["audience", "Премиум клиенти"],
      ["mood", "Култура"], ["mood", "Нови вкусове"], ["mood", "Лукс и комфорт"], ["mood", "Да открия нов свят"],
      ["theme", "История"], ["theme", "Гастрономия"], ["theme", "Фотография"], ["theme", "Архитектура"], ["theme", "Местен живот"],
      ["category", "Екскурзия"], ["category", "Групово"], ["category", "Самолет"], ["category", "Пакет"]
    ];
    for (let index = 0; index < terms.length; index += 1) {
      await upsertTerm(client, offerId, terms[index][0], terms[index][1], index);
    }

    const visibility = [["offers_index", true, 90], ["search", true, 90], ["homepage", true, 90], ["collection_page", true, 90], ["promo_section", false, 90]];
    for (const row of visibility) {
      await client.query(
        `
          insert into offer_visibility_rules (offer_id, placement, is_enabled, priority)
          values ($1, $2::offer_visibility_placement, $3, $4)
          on conflict (offer_id, placement) do update
          set is_enabled = excluded.is_enabled,
              priority = excluded.priority,
              updated_at = now()
        `,
        [offerId, ...row]
      );
    }

    await client.query("commit");
    console.log(JSON.stringify({ ok: true, slug, admin: `/admin/offers/${slug}?tab=publishing`, public: `/offers/${slug}` }, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

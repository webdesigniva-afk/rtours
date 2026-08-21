import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key] ??= rawValue.replace(/^["']|["']$/g, "");
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running this script.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

const image = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=84`;

function createSlug(value) {
  const transliterationMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sht",
    ъ: "a",
    ь: "y",
    ю: "yu",
    я: "ya"
  };

  const transliterated = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 100) || `offer-${Date.now()}`;
}

const offers = [
  {
    title: "Бали и островите Гили - спокойствие, храмове и океан",
    productType: "holiday",
    productTypeLabel: "Почивка",
    summary: "Екзотична почивка с плажове, оризови тераси, балийски храмове и няколко дни на островите Гили.",
    description:
      "Пътуване за хора, които искат топъл океан, зелени пейзажи и мек ритъм. Комбинираме Убуд, южното крайбрежие на Бали и островите Гили с достатъчно свободно време за плаж, масажи, красиви залези и малки местни преживявания.",
    country: "Индонезия",
    region: "Бали",
    city: "Убуд",
    durationDays: 12,
    durationNights: 10,
    transport: "flight",
    priceFrom: 3290,
    currency: "EUR",
    heroImage: image("1537996194471-e657df975ab4"),
    gallery: [
      image("1518548419970-58e3b4079ab2"),
      image("1555400038-63f5ba517a47"),
      image("1507525428034-b723cf961d3e")
    ],
    dates: [
      ["2027-05-08", "2027-05-19", "София", 3290],
      ["2027-09-12", "2027-09-23", "София", 3450]
    ],
    highlights: ["Храмът Танах Лот по залез", "Оризовите тераси Тегалаланг", "Плажове и шнорхелинг на Гили"],
    included: ["Самолетен билет", "10 нощувки в подбрани хотели", "Трансфери по програмата", "Местен водач на избрани посещения", "Медицинска застраховка"],
    excluded: ["Лични разходи", "Допълнителни екскурзии", "Храна извън описаната по програма"],
    services: ["Полети с включен багаж", "Хотели 4 звезди или бутикови места за настаняване", "Всички основни трансфери между островите"],
    info: ["Препоръчителен международен паспорт с валидност минимум 6 месеца.", "Програмата е подходяща за спокоен ритъм и плажна почивка.", "Редът на посещенията може да бъде променен според полетното разписание."],
    taxonomy: {
      audience: ["Двойки", "Младоженци", "Премиум клиенти"],
      mood: ["Море и релакс", "Романтика", "Пълно спокойствие"],
      theme: ["Плаж", "Природа", "Спа и уелнес", "Острови"],
      category: ["Почивка", "Самолет", "Пакет", "All Inclusive"]
    }
  },
  {
    title: "Япония в цвят - Токио, Киото и планината Фуджи",
    productType: "excursion",
    productTypeLabel: "Екскурзия",
    summary: "Класическа културна програма през Токио, Киото, Нара и района на Фуджи с внимателно подбран ритъм.",
    description:
      "Пътешествие за любители на култура, дизайн, храмове, градски ритъм и японска кухня. Маршрутът съчетава модерното лице на Токио, спокойствието на Киото, елените в Нара и гледките към Фуджи.",
    country: "Япония",
    region: "Канто и Кансай",
    city: "Токио",
    durationDays: 11,
    durationNights: 9,
    transport: "flight",
    priceFrom: 4290,
    currency: "EUR",
    heroImage: image("1528164344705-47542687000d"),
    gallery: [
      image("1493976040374-85c8e12f0c0e"),
      image("1542051841857-5f90071e7989"),
      image("1503899036084-c55cdd92da26")
    ],
    dates: [
      ["2027-03-24", "2027-04-03", "София", 4290],
      ["2027-10-18", "2027-10-28", "София", 4390]
    ],
    highlights: ["Киото и храмът Фушими Инари", "Панорама към планината Фуджи", "Кварталите Шибуя и Гинза"],
    included: ["Самолетен билет", "9 нощувки със закуски", "ЖП билети по маршрута", "Водач от България", "Местни екскурзии по програма"],
    excluded: ["Градски такси", "Допълнителни посещения", "Разходи от личен характер"],
    services: ["Самолетен билет София - Токио - София", "Настаняване в хотели 3/4 звезди", "Билети за влак между основните градове"],
    info: ["Необходим е международен паспорт.", "Програмата включва повече ходене пеша в градска среда.", "Цената е калкулирана при минимум 16 туристи."],
    taxonomy: {
      audience: ["Приятели", "Соло пътешественици", "Малки групи"],
      mood: ["Култура", "Нов свят", "Градски ритъм"],
      theme: ["История", "Архитектура", "Гастрономия", "Фотография", "Музеи"],
      category: ["Екскурзия", "Самолет", "Групово", "Обиколна програма"]
    }
  },
  {
    title: "Кения сафари и плаж - Масай Мара и Диани",
    productType: "package",
    productTypeLabel: "Пакет",
    summary: "Комбинация от сафари в Масай Мара и релакс на Индийския океан с контрастни преживявания в едно пътуване.",
    description:
      "Създадено за любители на природата и силните гледки. Първо следваме дивия ритъм на саваната, после завършваме с няколко дни плаж в Диани. Подходящо е за двойки, приятели и малки групи.",
    country: "Кения",
    region: "Масай Мара и Диани",
    city: "Найроби",
    durationDays: 10,
    durationNights: 8,
    transport: "flight",
    priceFrom: 3890,
    currency: "EUR",
    heroImage: image("1516426122078-c23e76319801"),
    gallery: [
      image("1547471080-7cc2caa01a7e"),
      image("1534177616072-ef7dc120449d"),
      image("1500530855697-b586d89ba3ee")
    ],
    dates: [
      ["2027-02-14", "2027-02-23", "София", 3890],
      ["2027-07-11", "2027-07-20", "София", 4150]
    ],
    highlights: ["Два дни сафари в Масай Мара", "Плаж Диани", "Възможност за наблюдение на Голямата петорка"],
    included: ["Самолетен билет", "8 нощувки", "Сафари с джипове 4x4", "Входни такси за резервати", "Трансфери"],
    excluded: ["Виза за Кения", "Напитки и бакшиши", "Допълнителни морски активности"],
    services: ["Сафари водач на английски език", "Настаняване в лодж и хотел на брега", "Вътрешни трансфери по програмата"],
    info: ["Препоръчва се консултация за здравни изисквания преди пътуване.", "Сафарито е с ранни сутрешни излизания.", "Багажът за вътрешни трансфери може да бъде ограничен."],
    taxonomy: {
      audience: ["Двойки", "Приятели", "Малки групи"],
      mood: ["Приключение", "Екзотика", "Море и релакс"],
      theme: ["Сафари", "Природа", "Плаж", "Фотография"],
      category: ["Пакет", "Самолет", "Групово", "Почивка на море"]
    }
  },
  {
    title: "Дунавска коледна магия - Виена, Братислава и Будапеща",
    productType: "excursion",
    productTypeLabel: "Екскурзия",
    summary: "Празнична автобусна програма с коледни базари, класическа архитектура и топла централноевропейска атмосфера.",
    description:
      "Кратко, уютно и богато пътуване за декемврийско настроение. Посещаваме три столици с различен характер, време за базари, кафе-салони, разходки край Дунав и красиви вечерни светлини.",
    country: "Австрия",
    region: "Виена, Братислава, Будапеща",
    city: "Виена",
    durationDays: 5,
    durationNights: 4,
    transport: "bus",
    priceFrom: 690,
    currency: "EUR",
    heroImage: image("1519671482749-fd09be7ccebf"),
    gallery: [
      image("1516550893923-42d28e5677af"),
      image("1549877452-9c387954fbc2"),
      image("1513622470522-26c3c8a854bc")
    ],
    dates: [
      ["2026-12-03", "2026-12-07", "София", 690],
      ["2026-12-10", "2026-12-14", "София", 720]
    ],
    highlights: ["Коледните базари във Виена", "Старият град на Братислава", "Панорама към Будапеща"],
    included: ["Транспорт с туристически автобус", "4 нощувки със закуски", "Пешеходни турове", "Водач от България"],
    excluded: ["Входни такси", "Градски такси", "Разходи от личен характер"],
    services: ["Комфортен автобус", "Хотели 3/4 звезди", "Водач от България през цялото пътуване"],
    info: ["Необходима е валидна лична карта или паспорт.", "Програмата е подходяща за всички възрасти.", "Възможни са промени в реда на посещенията според трафика."],
    taxonomy: {
      audience: ["Семейства", "Приятели", "55+ пътешественици"],
      mood: ["Празнично пътуване", "Градски ритъм", "Култура"],
      theme: ["Коледни базари", "Архитектура", "История", "Местен живот"],
      category: ["Екскурзия", "Автобус", "Уикенд", "Групово"]
    }
  },
  {
    title: "Лисабон и Порто - вино, фадо и атлантически гледки",
    productType: "excursion",
    productTypeLabel: "Авторско пътуване",
    summary: "Авторска програма в Португалия с Лисабон, Синтра, Порто и долината Доуро.",
    description:
      "Пътуване с мек ритъм, красиви градове и много вкус. Подходящо за хора, които обичат история, малки квартали, гледки към океана, местна кухня и вино.",
    country: "Португалия",
    region: "Лисабон и Порто",
    city: "Лисабон",
    durationDays: 8,
    durationNights: 7,
    transport: "flight",
    priceFrom: 1790,
    currency: "EUR",
    heroImage: image("1509356843151-3e7d96241e11"),
    gallery: [
      image("1513735492246-483525079686"),
      image("1529154036614-a60975f5c760"),
      image("1528127269322-539801943592")
    ],
    dates: [
      ["2027-04-17", "2027-04-24", "София", 1790],
      ["2027-09-25", "2027-10-02", "София", 1890]
    ],
    highlights: ["Фадо вечер в Лисабон", "Дегустация в Порто", "Синтра и Кабо да Рока"],
    included: ["Самолетен билет", "7 нощувки със закуски", "Вътрешен транспорт", "Дегустация на портвайн", "Водач"],
    excluded: ["Вечери извън програмата", "Входни такси по желание", "Лични разходи"],
    services: ["Бутикови градски хотели", "Дегустация в изба", "Пешеходни маршрути с местни акценти"],
    info: ["Пътуването е с умерено ходене пеша.", "Подходящо е за малки групи и двойки.", "Цената е при минимум 12 записани туристи."],
    taxonomy: {
      audience: ["Двойки", "Приятели", "Малки групи"],
      mood: ["Нови вкусове", "Бавно пътуване", "Авторско пътуване"],
      theme: ["Гастрономия", "Вино", "История", "Фотография", "Местен живот"],
      category: ["Екскурзия", "Самолет", "Авторско пътуване", "Обиколна програма"]
    },
    isAuthorProgram: true
  },
  {
    title: "Исландия - северно сияние, лагуни и вулканични пейзажи",
    productType: "package",
    productTypeLabel: "Пакет",
    summary: "Зимно приключение в Исландия с Рейкявик, Златния кръг, лагуни и шанс за северно сияние.",
    description:
      "Контрастно пътуване сред лед, геотермални извори, водопади и черни плажове. Подходящо за активни пътешественици, фотографи и хора, които търсят различна природа.",
    country: "Исландия",
    region: "Южна Исландия",
    city: "Рейкявик",
    durationDays: 6,
    durationNights: 5,
    transport: "flight",
    priceFrom: 2190,
    currency: "EUR",
    heroImage: image("1500534314209-a25ddb2bd429"),
    gallery: [
      image("1520769945061-0a448c463865"),
      image("1504829857797-ddff29c27927"),
      image("1517411032315-54ef2cb783bb")
    ],
    dates: [
      ["2027-01-21", "2027-01-26", "София", 2190],
      ["2027-02-18", "2027-02-23", "София", 2290]
    ],
    highlights: ["Златният кръг", "Черният плаж Рейнисфяра", "Вечерно търсене на северно сияние"],
    included: ["Самолетен билет", "5 нощувки със закуски", "Транспорт по маршрута", "Екскурзии по програма", "Водач"],
    excluded: ["Вход за лагуна", "Застраховка с по-високо покритие", "Лични разходи"],
    services: ["Малка група", "Автобус или миниван според броя туристи", "Подбрани хотели в Рейкявик и района"],
    info: ["Северното сияние е природно явление и не може да бъде гарантирано.", "Необходима е топла и водоустойчива екипировка.", "Програмата може да се адаптира според зимните условия."],
    taxonomy: {
      audience: ["Приятели", "Соло пътешественици", "Малки групи"],
      mood: ["Приключение", "Планина и природа", "Нов свят"],
      theme: ["Природа", "Фотография", "Пешеходни маршрути", "Забележителности"],
      category: ["Пакет", "Самолет", "Активна почивка", "Групово"]
    }
  }
];

async function query(text, values = []) {
  return pool.query(text, values);
}

async function uniqueSlug(title) {
  const base = createSlug(title);
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await query("select 1 from offers where slug = $1 limit 1", [candidate]);
    if (!existing.rowCount) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function slugifyLabel(label) {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-я]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function addTaxonomy(offerId, type, labels) {
  for (const [index, label] of labels.entries()) {
    const slug = slugifyLabel(label);
    const term = await query(
      `
        insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
        values ($1::taxonomy_term_type, $2, $3, $3, '#d9463f', 'tag', $4)
        on conflict (type, slug) do update
          set name = excluded.name,
              public_label = excluded.public_label,
              is_public = true,
              is_filterable = true,
              is_searchable = true
        returning id
      `,
      [type, slug, label, 100 + index]
    );

    await query(
      `
        insert into offer_taxonomy_terms (offer_id, term_id, source, is_primary, confidence)
        values ($1, $2, 'manual', $3, 100)
        on conflict (offer_id, term_id) do update
          set source = excluded.source,
              is_primary = excluded.is_primary,
              confidence = excluded.confidence
      `,
      [offerId, term.rows[0].id, index === 0]
    );
  }
}

function itineraryForOffer(offer) {
  if (offer.country === "Индонезия") {
    return [
      {
        day: 1,
        title: "Полет към Бали",
        description: "Среща на летище София и отпътуване към Денпасар с прекачване. Нощувка на борда.",
        accommodation: "В самолета",
        meals: "Храна според авиокомпанията",
        transport: "Самолет"
      },
      {
        day: 2,
        title: "Пристигане в Убуд",
        description: "Посрещане на летището, трансфер към Убуд и настаняване. Свободно време за първа разходка сред галерии, кафенета и малки храмове.",
        accommodation: "Убуд",
        meals: "Без включено хранене",
        transport: "Самолет, автобус"
      },
      {
        day: 3,
        title: "Оризови тераси и балийски храмове",
        description: "Посещение на оризовите тераси Тегалаланг, местен храм и занаятчийски селища. Следобед за почивка или масаж.",
        accommodation: "Убуд",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 5,
        title: "Южно Бали и залез при Танах Лот",
        description: "Пътуване към южното крайбрежие. По пътя спираме за гледки и завършваме деня с храм Танах Лот по залез.",
        accommodation: "Южно Бали",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 8,
        title: "Островите Гили",
        description: "Трансфер с лодка към Гили. Настаняване и свободно време за плаж, шнорхелинг или разходка с велосипед.",
        accommodation: "Гили",
        meals: "Закуска",
        transport: "Лодка"
      },
      {
        day: 12,
        title: "Отпътуване към България",
        description: "Трансфер до летището и полет обратно към София.",
        accommodation: "",
        meals: "Закуска",
        transport: "Самолет"
      }
    ];
  }

  if (offer.country === "Япония") {
    return [
      {
        day: 1,
        title: "Полет София - Токио",
        description: "Отпътуване от София към Япония с международен полет и прекачване.",
        accommodation: "В самолета",
        meals: "Храна според авиокомпанията",
        transport: "Самолет"
      },
      {
        day: 2,
        title: "Токио - първа среща с мегаполиса",
        description: "Пристигане, трансфер и настаняване. Вечерна разходка в района на Шинджуку или Шибуя според часа на пристигане.",
        accommodation: "Токио",
        meals: "Без включено хранене",
        transport: "Самолет, метро"
      },
      {
        day: 3,
        title: "Токио - традиции и модерност",
        description: "Посещение на Асакуса, храм Сенсо-джи, квартал Гинза и панорамна гледка към града.",
        accommodation: "Токио",
        meals: "Закуска",
        transport: "Метро"
      },
      {
        day: 5,
        title: "Фуджи и езерата",
        description: "Еднодневна екскурзия към района на Фуджи с гледки към планината при подходящо време.",
        accommodation: "Токио",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 7,
        title: "Киото - храмове и градини",
        description: "Пътуване с влак към Киото. Посещение на Фушими Инари и разходка в старите квартали.",
        accommodation: "Киото",
        meals: "Закуска",
        transport: "Влак"
      },
      {
        day: 10,
        title: "Нара и завръщане",
        description: "Посещение на Нара, паркът с елените и храм Тодай-джи. Подготовка за обратния полет.",
        accommodation: "Осака или Киото",
        meals: "Закуска",
        transport: "Влак"
      }
    ];
  }

  if (offer.country === "Кения") {
    return [
      {
        day: 1,
        title: "Полет към Найроби",
        description: "Отпътуване от София към Кения с международен полет.",
        accommodation: "В самолета",
        meals: "Храна според авиокомпанията",
        transport: "Самолет"
      },
      {
        day: 2,
        title: "Найроби",
        description: "Пристигане, посрещане и трансфер до хотела. Кратка почивка и информационна среща за сафари частта.",
        accommodation: "Найроби",
        meals: "Закуска според часа на пристигане",
        transport: "Автобус"
      },
      {
        day: 3,
        title: "Към Масай Мара",
        description: "Пътуване към резервата Масай Мара. Следобедно сафари при подходящи условия.",
        accommodation: "Лодж в района на Масай Мара",
        meals: "Закуска, вечеря",
        transport: "Джип 4x4"
      },
      {
        day: 4,
        title: "Сафари в Масай Мара",
        description: "Ранно сутрешно и следобедно сафари с възможност за наблюдение на диви животни и красиви пейзажи.",
        accommodation: "Лодж в района на Масай Мара",
        meals: "Закуска, обяд, вечеря",
        transport: "Джип 4x4"
      },
      {
        day: 6,
        title: "Диани бийч",
        description: "Трансфер към крайбрежието и настаняване в хотел на Индийския океан. Свободно време за плаж.",
        accommodation: "Диани",
        meals: "Закуска",
        transport: "Самолет или автобус"
      },
      {
        day: 10,
        title: "Обратен полет",
        description: "Свободно време според полетното разписание и трансфер до летището.",
        accommodation: "",
        meals: "Закуска",
        transport: "Самолет"
      }
    ];
  }

  if (offer.country === "Австрия") {
    return [
      {
        day: 1,
        title: "София - Виена",
        description: "Отпътуване с туристически автобус. Пристигане във Виена вечерта и настаняване.",
        accommodation: "Виена",
        meals: "Без включено хранене",
        transport: "Автобус"
      },
      {
        day: 2,
        title: "Виена и коледните базари",
        description: "Панорамна и пешеходна разходка във Виена. Свободно време около Ратхаусплац и централните коледни базари.",
        accommodation: "Виена",
        meals: "Закуска",
        transport: "Автобус, пеша"
      },
      {
        day: 3,
        title: "Братислава",
        description: "Пътуване до Братислава, разходка в стария град и време за базари и местни специалитети.",
        accommodation: "Братислава или района",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 4,
        title: "Будапеща",
        description: "Посещение на Будапеща с панорамни спирки при Буда, Пеща и Дунав. Вечерна разходка по желание.",
        accommodation: "Будапеща",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 5,
        title: "Завръщане в България",
        description: "Отпътуване към София с кратки почивки по маршрута.",
        accommodation: "",
        meals: "Закуска",
        transport: "Автобус"
      }
    ];
  }

  if (offer.country === "Португалия") {
    return [
      {
        day: 1,
        title: "Полет до Лисабон",
        description: "Пристигане в Лисабон, трансфер и първа вечерна разходка в центъра.",
        accommodation: "Лисабон",
        meals: "Без включено хранене",
        transport: "Самолет"
      },
      {
        day: 2,
        title: "Лисабон - квартали, гледки и фадо",
        description: "Разходка през Алфама, Байша и Шиаду. Вечерта - фадо преживяване по желание или включено според групата.",
        accommodation: "Лисабон",
        meals: "Закуска",
        transport: "Пеша, трамвай"
      },
      {
        day: 3,
        title: "Синтра и Кабо да Рока",
        description: "Екскурзия до Синтра, крайбрежни гледки и най-западната точка на континентална Европа.",
        accommodation: "Лисабон",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 5,
        title: "Порто",
        description: "Пътуване към Порто. Разходка по Рибейра и дегустация на портвайн в традиционна изба.",
        accommodation: "Порто",
        meals: "Закуска",
        transport: "Влак или автобус"
      },
      {
        day: 6,
        title: "Долината Доуро",
        description: "Ден сред лозята на Доуро с панорамни гледки и време за местна кухня.",
        accommodation: "Порто",
        meals: "Закуска",
        transport: "Автобус"
      },
      {
        day: 8,
        title: "Отпътуване",
        description: "Свободно време според полетното разписание и трансфер до летището.",
        accommodation: "",
        meals: "Закуска",
        transport: "Самолет"
      }
    ];
  }

  return [
    {
      day: 1,
      title: "Полет до Рейкявик",
      description: "Отпътуване към Исландия, пристигане и трансфер до хотела.",
      accommodation: "Рейкявик",
      meals: "Без включено хранене",
      transport: "Самолет"
    },
    {
      day: 2,
      title: "Златният кръг",
      description: "Посещение на национален парк Тингвелир, гейзерите и водопада Гълфос.",
      accommodation: "Рейкявик",
      meals: "Закуска",
      transport: "Автобус"
    },
    {
      day: 3,
      title: "Южното крайбрежие",
      description: "Водопадите Селяландсфос и Скогафос, черният плаж Рейнисфяра и вулканични пейзажи.",
      accommodation: "Южна Исландия",
      meals: "Закуска",
      transport: "Автобус"
    },
    {
      day: 4,
      title: "Лагуна и северно сияние",
      description: "Време за геотермална лагуна по желание. Вечерта - излизане за наблюдение на северно сияние при подходящи условия.",
      accommodation: "Рейкявик",
      meals: "Закуска",
      transport: "Автобус"
    },
    {
      day: 5,
      title: "Рейкявик",
      description: "Свободен ден за музеи, градски разходки, местни ресторанти или допълнителна екскурзия.",
      accommodation: "Рейкявик",
      meals: "Закуска",
      transport: "Пеша"
    },
    {
      day: 6,
      title: "Обратен полет",
      description: "Трансфер до летището и полет обратно към България.",
      accommodation: "",
      meals: "Закуска",
      transport: "Самолет"
    }
  ];
}

async function addManualSections(offerId, offer) {
  const importResult = await query(
    `
      insert into offer_imports (offer_id, provider, external_id, source, change_state, checksum, raw_payload, last_synced_at)
      values ($1, 'redtours-manual', $4, 'manual', 'unchanged', $2, $3::jsonb, now())
      on conflict (provider, external_id) do update
        set offer_id = excluded.offer_id,
            checksum = excluded.checksum,
            raw_payload = excluded.raw_payload,
            last_synced_at = now()
      returning id
    `,
    [offerId, `manual-test-${offer.title}`, JSON.stringify({ services: offer.services, importantInfo: offer.info }), `manual-test-${offerId}`]
  );

  const rows = [
    ...offer.services.map((label, index) => ({ type: "service", section: "services", label, sortOrder: index })),
    ...offer.info.map((label, index) => ({ type: "useful_info", section: "conditions", label, sortOrder: index }))
  ];

  for (const [index, row] of rows.entries()) {
    await query(
      `
        insert into supplier_import_entities (
          import_id, offer_id, provider, external_id, entity_type, entity_key,
          title, sort_order, raw_data, is_enabled, editorial_title, editorial_data
        )
        values ($1, $2, 'redtours-manual', $9, $3, $4, $5, $6, $7::jsonb, true, $5, $8::jsonb)
      `,
      [
        importResult.rows[0].id,
        offerId,
        row.type,
        `manual-test-${row.type}-${index + 1}`,
        row.label,
        row.sortOrder,
        JSON.stringify({ public_section: row.section, label: row.label }),
        JSON.stringify({ public_section: row.section, label: row.label }),
        `${offerId}-${row.type}-${index + 1}`
      ]
    );
  }
}

async function seedOffer(offer) {
  const slug = await uniqueSlug(offer.title);
  const result = await query(
    `
      insert into offers (
        slug, product_type, product_type_label, title, summary, description,
        country, region, city, duration_days, duration_nights, transport,
        price_from, currency, source, status, hero_image_url, is_author_program,
        seo_meta_title, seo_meta_description, seo_keywords, seo_canonical_url, seo_structured_data_type,
        review_notes, price_note, price_includes_taxes
      )
      values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12::transport_type,
        $13, $14, 'manual', 'published', $15, $16,
        $4, $5, $17::text[], $18, 'TouristTrip',
        '[seed-test-offer] Реалистична тестова ръчна оферта.', 'Цена при запитване и потвърждение', true
      )
      returning id
    `,
    [
      slug,
      offer.productType,
      offer.productTypeLabel,
      offer.title,
      offer.summary,
      offer.description,
      offer.country,
      offer.region,
      offer.city,
      offer.durationDays,
      offer.durationNights,
      offer.transport,
      offer.priceFrom,
      offer.currency,
      offer.heroImage,
      offer.isAuthorProgram || false,
      [offer.country, offer.region, ...Object.values(offer.taxonomy).flat()].slice(0, 24),
      `/offers/${slug}`
    ]
  );
  const offerId = result.rows[0].id;

  await query(
    `
      insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
      values ($1, $2, $3, $4, true, 0)
    `,
    [offerId, offer.country, offer.region, offer.city]
  );

  const media = [{ url: offer.heroImage, alt: offer.title, isPrimary: true }, ...offer.gallery.map((url, index) => ({ url, alt: `${offer.title} - снимка ${index + 1}`, isPrimary: false }))];
  for (const [index, item] of media.entries()) {
    await query(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, 'redtours', $4, $5)
      `,
      [offerId, item.url, item.alt, item.isPrimary, index]
    );
  }

  for (const [index, date] of offer.dates.entries()) {
    await query(
      `
        insert into offer_dates (
          offer_id, label, start_date, end_date, departure_points, availability,
          seats_total, seats_available, price_from, currency, payment_due_days, sort_order
        )
        values ($1, $2, $3, $4, $5, 'available', 24, 12, $6, $7, 30, $8)
      `,
      [offerId, `${date[0]} - ${date[1]}`, date[0], date[1], date[2], date[3], offer.currency, index]
    );
  }

  for (const [index, day] of itineraryForOffer(offer).entries()) {
    await query(
      `
        insert into offer_itinerary_days (
          offer_id, day_number, title, description, accommodation, meals, transport, sort_order
        )
        values ($1, $2, $3, $4, nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
      `,
      [offerId, day.day, day.title, day.description, day.accommodation, day.meals, day.transport, index]
    );
  }

  for (const [index, label] of offer.highlights.entries()) {
    await query("insert into offer_highlights (offer_id, label, sort_order) values ($1, $2, $3)", [offerId, label, index]);
  }

  for (const [index, label] of offer.included.entries()) {
    await query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1, 'included', $2, $3)", [offerId, label, index]);
  }

  for (const [index, label] of offer.excluded.entries()) {
    await query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1, 'excluded', $2, $3)", [offerId, label, index]);
  }

  await addManualSections(offerId, offer);
  await addTaxonomy(offerId, "audience", offer.taxonomy.audience);
  await addTaxonomy(offerId, "mood", offer.taxonomy.mood);
  await addTaxonomy(offerId, "theme", offer.taxonomy.theme);
  await addTaxonomy(offerId, "category", offer.taxonomy.category);
  await addTaxonomy(offerId, "badge", ["НАШ ИЗБОР"]);

  await query(
    `
      insert into offer_visibility_rules (offer_id, placement, is_enabled, priority, notes)
      values
        ($1, 'offers_index', true, 20, 'Seed test offer'),
        ($1, 'search', true, 20, 'Seed test offer'),
        ($1, 'homepage', true, 5, 'Seed test offer')
      on conflict (offer_id, placement) do update
        set is_enabled = excluded.is_enabled,
            priority = excluded.priority
    `,
    [offerId]
  );

  return { slug, title: offer.title };
}

try {
  await query("delete from offer_imports where provider = 'redtours-manual' and checksum like 'manual-test-%'");
  await query("delete from offers where review_notes = '[seed-test-offer] Реалистична тестова ръчна оферта.'");

  const created = [];
  for (const offer of offers) {
    created.push(await seedOffer(offer));
  }
  console.log(`Created ${created.length} manual test offers:`);
  for (const item of created) {
    console.log(`- ${item.title} -> /admin/offers/${item.slug} | /offers/${item.slug}`);
  }
} finally {
  await pool.end();
}

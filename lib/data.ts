import type { Collection, Destination, Offer } from "./types";

export const destinations: Destination[] = [
  {
    slug: "italy",
    name: "Италия",
    country: "Италия",
    region: "Южна Европа",
    summary: "Класически градове, малки винени маршрути и програми с богата културна линия.",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "vietnam",
    name: "Виетнам",
    country: "Виетнам",
    region: "Югоизточна Азия",
    summary: "Пътувания с ритъм, кухня, природа и внимателно подредени преживявания.",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "jordan",
    name: "Йордания",
    country: "Йордания",
    region: "Близък Изток",
    summary: "Петра, пустинята Вади Рум и маршрути с история, простор и силна атмосфера.",
    image: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1200&q=82"
  }
];

export const collections: Collection[] = [
  {
    slug: "red-icons",
    name: "Red Icons",
    summary: "Емблематични маршрути и преживявания, които поне веднъж си заслужава да бъдат изживени.",
    mood: "signature",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "red-hidden",
    name: "Red Hidden",
    summary: "По-малко познати места, истории и кътчета на Европа извън утъпканите маршрути.",
    mood: "calm",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "red-taste",
    name: "Red Taste",
    summary: "Пътувания през местната кухня, виното и вкусовете, които разказват една дестинация.",
    mood: "food",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "red-wild",
    name: "Red Wild",
    summary: "Впечатляващи пейзажи, природни феномени и срещи с дивия свят.",
    mood: "adventure",
    image: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "red-live",
    name: "Red Live",
    summary: "Концерти, фестивали и културни събития, около които си заслужава да построите цяло пътуване.",
    mood: "culture",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=82"
  },
  {
    slug: "red-circle",
    name: "Red Circle",
    summary: "Внимателно подбрани маршрути за малки групи и по-личен начин на пътуване.",
    mood: "private",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=82"
  }
];

export const offers: Offer[] = [
  {
    slug: "vietnam-culture-food",
    title: "Виетнам: култура, кухня и заливи",
    summary: "Дълго пътуване през Ханой, Хой Ан и залива Ха Лонг с фокус върху местната кухня.",
    description:
      "Програма за пътешественици, които искат да усетят Виетнам отвъд стандартния маршрут: пазари, малки ресторанти, градски разходки и спокойни дни край водата.",
    destinationSlug: "vietnam",
    collectionSlugs: ["red-icons", "red-taste"],
    country: "Виетнам",
    region: "Югоизточна Азия",
    durationDays: 12,
    transport: "flight",
    priceFrom: 2490,
    currency: "EUR",
    priceNote: "цена от човек в двойна стая",
    source: "manual",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=84",
    gallery: [
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=82"
    ],
    dates: [
      { label: "Март 2027", startDate: "2027-03-08", endDate: "2027-03-19", availability: "available" },
      { label: "Октомври 2027", startDate: "2027-10-10", endDate: "2027-10-21", availability: "limited" }
    ],
    moods: ["culture", "food", "signature"],
    tags: ["авторска програма", "кулинарно пътуване", "малка група"],
    included: ["Самолетен билет", "Хотели 4 звезди", "Закуски", "Местен водач", "Подбрани дегустации"],
    excluded: ["Лични разходи", "Застраховка Отмяна на пътуване", "Допълнителни екскурзии"],
    itinerary: [
      {
        day: 1,
        title: "Отпътуване към Ханой",
        description: "Среща на летището, полет и подготовка за програмата."
      },
      {
        day: 3,
        title: "Старият Ханой",
        description: "Пешеходен маршрут през стария квартал, пазари и първи кулинарни спирки."
      },
      {
        day: 8,
        title: "Хой Ан",
        description: "Свободно време, работилници, вечерна разходка и локални вкусове."
      }
    ],
    seo: {
      metaTitle: "Виетнам с RedTours - култура, кухня и Ха Лонг",
      metaDescription: "Авторска програма до Виетнам с Ханой, Хой Ан, Ха Лонг и кулинарни преживявания.",
      keywords: ["Виетнам", "екскурзия Виетнам", "RedTours"]
    }
  },
  {
    slug: "italy-tuscany-weekend",
    title: "Тоскана: уикенд с вкус и гледки",
    summary: "Кратко пътуване с винени маршрути, малки градове и достатъчно време за бавни разходки.",
    description:
      "Тоскана в компактен, но балансиран формат: градчета, пейзажи, кухня и места, които оставят усещане за лекота.",
    destinationSlug: "italy",
    collectionSlugs: ["red-taste", "red-hidden"],
    country: "Италия",
    region: "Южна Европа",
    durationDays: 4,
    transport: "flight",
    priceFrom: 790,
    currency: "EUR",
    priceNote: "ориентировъчна цена от човек",
    source: "manual",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=84",
    gallery: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=82"
    ],
    dates: [
      { label: "Май 2027", startDate: "2027-05-14", endDate: "2027-05-17", availability: "on_request" }
    ],
    moods: ["food", "romance", "calm"],
    tags: ["уикенд", "вино", "романтика"],
    included: ["Самолетен билет", "3 нощувки", "Закуски", "Винен тур", "Представител на RedTours"],
    excluded: ["Градски такси", "Лични разходи", "Допълнителни дегустации"],
    itinerary: [
      {
        day: 1,
        title: "Пристигане и първа вечер",
        description: "Настаняване и вечерна разходка с кратък въвеждащ маршрут."
      },
      {
        day: 2,
        title: "Винени пътища",
        description: "Посещение на подбрана изба и свободно време в малък тоскански град."
      }
    ],
    seo: {
      metaTitle: "Уикенд в Тоскана - винени маршрути и романтика",
      metaDescription: "Кратка програма до Тоскана с RedTours: вино, гледки, малки градове и подбрани хотели.",
      keywords: ["Тоскана", "уикенд Италия", "винен тур"]
    }
  },
  {
    slug: "jordan-petra-wadi-rum",
    title: "Йордания: Петра и Вади Рум",
    summary: "Пътуване през най-силните места на Йордания с балансиран ритъм и пустинна нощ.",
    description:
      "Класическа, но внимателно подредена програма за Йордания: Петра, Вади Рум, Мъртво море и културни спирки по маршрута.",
    destinationSlug: "jordan",
    collectionSlugs: ["red-icons", "red-wild"],
    country: "Йордания",
    region: "Близък Изток",
    durationDays: 8,
    transport: "flight",
    priceFrom: 1390,
    currency: "EUR",
    priceNote: "цена от човек при минимум група",
    source: "xml",
    status: "review",
    heroImage: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1600&q=84",
    gallery: [
      "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=82"
    ],
    dates: [
      { label: "Април 2027", startDate: "2027-04-04", endDate: "2027-04-11", availability: "available" }
    ],
    moods: ["culture", "adventure", "signature"],
    tags: ["Петра", "пустиня", "история"],
    included: ["Самолетен билет", "Хотели", "Трансфери", "Входни такси по програма", "Местен водач"],
    excluded: ["Бакшиши", "Напитки", "Лични разходи"],
    itinerary: [
      {
        day: 2,
        title: "Аман и Джераш",
        description: "Културна програма с антични обекти и първи поглед към страната."
      },
      {
        day: 4,
        title: "Петра",
        description: "Цял ден за скалния град с водач и време за самостоятелно разглеждане."
      },
      {
        day: 6,
        title: "Вади Рум",
        description: "Пустинен маршрут, залез и нощувка в лагер."
      }
    ],
    seo: {
      metaTitle: "Екскурзия до Йордания - Петра и Вади Рум",
      metaDescription: "Пътуване до Йордания с RedTours: Петра, Вади Рум, Мъртво море и културна програма.",
      keywords: ["Йордания", "Петра", "Вади Рум"]
    }
  }
];

export function getPublishedOffers() {
  return offers.filter((offer) => offer.status === "published");
}

export function getOfferBySlug(slug: string) {
  return offers.find((offer) => offer.slug === slug);
}

export function getPublishedOfferBySlug(slug: string) {
  return getPublishedOffers().find((offer) => offer.slug === slug);
}

export function getDestinationBySlug(slug: string) {
  return destinations.find((destination) => destination.slug === slug);
}

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

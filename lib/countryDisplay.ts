const countryNameByCode: Record<string, string> = {
  AD: "Андора",
  AE: "Обединени арабски емирства",
  AL: "Албания",
  AM: "Армения",
  AR: "Аржентина",
  AT: "Австрия",
  AU: "Австралия",
  AZ: "Азербайджан",
  BA: "Босна и Херцеговина",
  BE: "Белгия",
  BG: "България",
  BR: "Бразилия",
  CA: "Канада",
  CH: "Швейцария",
  CN: "Китай",
  CY: "Кипър",
  CZ: "Чехия",
  DE: "Германия",
  DK: "Дания",
  EG: "Египет",
  ES: "Испания",
  FI: "Финландия",
  FR: "Франция",
  GB: "Великобритания",
  GE: "Грузия",
  GR: "Гърция",
  HR: "Хърватия",
  HU: "Унгария",
  ID: "Индонезия",
  IE: "Ирландия",
  IL: "Израел",
  IN: "Индия",
  IS: "Исландия",
  IT: "Италия",
  JP: "Япония",
  JO: "Йордания",
  KE: "Кения",
  KR: "Южна Корея",
  LK: "Шри Ланка",
  MA: "Мароко",
  MC: "Монако",
  ME: "Черна гора",
  MK: "Северна Македония",
  MT: "Малта",
  MV: "Малдиви",
  MX: "Мексико",
  MY: "Малайзия",
  NL: "Нидерландия",
  NO: "Норвегия",
  NZ: "Нова Зеландия",
  PE: "Перу",
  PL: "Полша",
  PT: "Португалия",
  QA: "Катар",
  RO: "Румъния",
  RS: "Сърбия",
  SE: "Швеция",
  SG: "Сингапур",
  SI: "Словения",
  SK: "Словакия",
  TH: "Тайланд",
  TN: "Тунис",
  TR: "Турция",
  US: "САЩ",
  VN: "Виетнам",
  ZA: "Южна Африка"
};

export function displayCountryName(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) return "";

  const code = raw.toUpperCase();
  if (countryNameByCode[code]) {
    return countryNameByCode[code];
  }

  if (/^[A-Z]{2}$/.test(code)) {
    try {
      return new Intl.DisplayNames(["bg"], { type: "region" }).of(code) || raw;
    } catch {
      return raw;
    }
  }

  return raw;
}

export function displayCurrency(value: string | null | undefined): "EUR" | "BGN" {
  return value === "BGN" ? "BGN" : "EUR";
}

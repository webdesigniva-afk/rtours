"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { travelTypeTaxonomyLabels } from "@/lib/offerTaxonomy";
import { CalendarDays, ChevronDown, MapPin, Search, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";

const moods = [
  {
    label: "Култура и история",
    params: { experience: "Култура", interest: "История" },
    description: "Маршрути, които разказват за цивилизации, градове, изкуство и хора.",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Природа и приключения",
    params: { experience: "Приключение", interest: "Природа" },
    description: "Впечатляващи пейзажи, диви места и преживявания извън обичайното.",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Гастрономия и вино",
    params: { experience: "Нови вкусове", interest: "Гастрономия" },
    description: "Дестинации, които се опознават чрез местната кухня, традициите и вкусовете.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Музика и събития",
    params: { interest: "Театър и музика" },
    description: "Концерти, фестивали и специални поводи, превърнати в цялостно пътуване.",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Luxury Escapes",
    params: { experience: "Лукс и комфорт" },
    description: "Внимателно подбрани хотели, лично обслужване и повече пространство за удоволствие.",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Малки групи",
    params: { audience: "Малки групи" },
    description: "Споделено пътуване с повече гъвкавост, лично внимание и пълноценно преживяване.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80"
  }
];

const finderTravelTypes = ["Всички", ...travelTypeTaxonomyLabels.filter((label) => ["Почивка", "Екскурзия", "Уикенд", "Групово", "Индивидуално"].includes(label))];

export function TravelFinder() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [tripType, setTripType] = useState(finderTravelTypes[0]);
  const [budget, setBudget] = useState("");
  const [pace, setPace] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const openResults = () => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (departureDate) params.set("from", departureDate);
    if (returnDate) params.set("to", returnDate);
    if (travelers) params.set("travelers", travelers);
    if (tripType !== finderTravelTypes[0]) params.set("travelType", tripType);
    const selectedMoodConfig = moods.find((mood) => mood.label === selectedMood);
    if (selectedMoodConfig) {
      for (const [key, value] of Object.entries(selectedMoodConfig.params)) {
        params.set(key, value);
      }
    }
    if (budget) params.set("budget", budget);
    if (pace) params.set("pace", pace);

    router.push(`/offers${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="travel-finder-section" aria-label="Търсене на пътуване">
      <div className="container">
        <div className="travel-finder">
          <form
            className="travel-ai-bar"
            onSubmit={(event) => {
              event.preventDefault();
              openResults();
            }}
          >
            <Sparkles size={22} aria-hidden="true" />
            <label>
              <span>Опиши какво търсиш с естествени думи...</span>
              <input
                aria-label="Опиши какво пътуване търсиш"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Напр. "Искам топло място през октомври, спокойствие и хубава храна"'
              />
            </label>
            <button type="submit" aria-label="Подбери пътуване">
              <Search size={24} aria-hidden="true" />
            </button>
          </form>

          <div className="finder-divider">
            <span>или избери от опциите по-долу</span>
            <ChevronDown size={18} aria-hidden="true" />
          </div>

          <div className="mood-picker" aria-label="Избор по усещане">
            <h2>Как искате да преживеете света?</h2>
            <div className="mood-list">
              {moods.map((mood) => {
                const active = mood.label === selectedMood;

                return (
                  <button
                    aria-pressed={active}
                    className={active ? "is-selected" : undefined}
                    type="button"
                    key={mood.label}
                    onClick={() => setSelectedMood(mood.label)}
                  >
                    <img src={mood.image} alt="" />
                    <span>{mood.label}</span>
                    <p>{mood.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            className="finder-panel"
            onSubmit={(event) => {
              event.preventDefault();
              openResults();
            }}
          >
            <h3>Знаеш къде искаш да отидеш?</h3>
            <div className="finder-fields">
              <label className="finder-field">
                <MapPin size={22} aria-hidden="true" />
                <span>
                  <strong>Дестинация</strong>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Град, държава или регион"
                  />
                </span>
              </label>
              <label className="finder-field finder-field-period">
                <CalendarDays size={22} aria-hidden="true" />
                <span>
                  <strong>Период</strong>
                  <span className="date-range-fields">
                    <span className="date-control">
                      <span>Отиване</span>
                      <input
                        aria-label="Дата на отиване"
                        value={departureDate}
                        onChange={(event) => setDepartureDate(event.target.value)}
                        type="date"
                      />
                    </span>
                    <span className="date-control">
                      <span>Връщане</span>
                      <input
                        aria-label="Дата на връщане"
                        min={departureDate || undefined}
                        value={returnDate}
                        onChange={(event) => setReturnDate(event.target.value)}
                        type="date"
                      />
                    </span>
                  </span>
                </span>
              </label>
              <label className="finder-field">
                <UsersRound size={22} aria-hidden="true" />
                <span>
                  <strong>Пътуващи</strong>
                  <input min="1" value={travelers} onChange={(event) => setTravelers(event.target.value)} type="number" />
                </span>
              </label>
              <label className="finder-field">
                <SlidersHorizontal size={22} aria-hidden="true" />
                <span>
                  <strong>Вид пътуване</strong>
                  <select value={tripType} onChange={(event) => setTripType(event.target.value)}>
                    {finderTravelTypes.map((label) => (
                      <option key={label}>{label}</option>
                    ))}
                  </select>
                </span>
              </label>
              <button className="finder-submit" type="submit">
                Подбери
              </button>
            </div>
            {advancedOpen ? (
              <div className="advanced-panel">
                <label>
                  <span>Бюджет</span>
                  <select value={budget} onChange={(event) => setBudget(event.target.value)}>
                    <option value="">Без предпочитание</option>
                    <option>до 1000 EUR</option>
                    <option>1000 - 2500 EUR</option>
                    <option>над 2500 EUR</option>
                  </select>
                </label>
                <label>
                  <span>Ритъм</span>
                  <select value={pace} onChange={(event) => setPace(event.target.value)}>
                    <option value="">Без предпочитание</option>
                    <option>Спокойно</option>
                    <option>Балансирано</option>
                    <option>Интензивно</option>
                  </select>
                </label>
              </div>
            ) : null}
            <button
              aria-expanded={advancedOpen}
              className="advanced-search"
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              Разширено търсене
              <ChevronDown className={advancedOpen ? "is-open" : undefined} size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

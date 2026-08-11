"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, MapPin, Search, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";

const moods = [
  {
    label: "Пълно спокойствие",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Приключение",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Нови вкусове",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Романтика",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "С деца",
    image: "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=320&q=80"
  },
  {
    label: "Нов свят",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=320&q=80"
  }
];

export function TravelFinder() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState(moods[0].label);
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [tripType, setTripType] = useState("Всички");
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
    if (tripType !== "Всички") params.set("type", tripType);
    if (selectedMood) params.set("mood", selectedMood);
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
            <h2>Как искаш да се почувстваш?</h2>
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
                    <option>Всички</option>
                    <option>Почивка</option>
                    <option>Екскурзия</option>
                    <option>Корпоративно</option>
                    <option>Индивидуално</option>
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

"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, Heart, MapPin, Route as RouteIcon, Send, Signpost, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { submitInquiry } from "@/app/inquiries/actions";

const steps = ["ИДЕЯ", "КОГА", "С КОГО", "КАК", "ГОТОВО"];

const destinationChoices = [
  { label: "Да, знам къде.", value: "known", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=84", icon: MapPin },
  { label: "Имам няколко идеи.", value: "ideas", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=84", icon: Signpost },
  { label: "Не. Изненадайте ме.", value: "surprise", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=84", icon: Compass }
];

const destinationImages = [
  { country: "Япония", terms: ["япония", "japan", "токио", "tokyo", "фуджи", "fuji"], image: "/images/destinations/japan.jpg" },
  { country: "Египет", terms: ["египет", "egypt", "кайро", "cairo", "шарм", "sharm"], image: "/images/destinations/egypt.jpg" },
  { country: "Франция", terms: ["франция", "france", "париж", "paris", "ницца", "nice"], image: "/images/destinations/france.avif" },
  { country: "Испания", terms: ["испания", "spain", "барселона", "barcelona", "мадрид", "madrid"], image: "/images/destinations/spain.avif" },
  { country: "Турция", terms: ["турция", "turkey", "истанбул", "istanbul", "анталия", "antalya"], image: "/images/destinations/turkey.avif" },
  { country: "Албания", terms: ["албания", "albania", "тирана", "tirana"], image: "/images/destinations/albania.avif" },
  { country: "Аржентина", terms: ["аржентина", "argentina", "буенос айрес", "buenos aires"], image: "/images/destinations/argentina.avif" },
  { country: "Австралия", terms: ["австралия", "australia", "сидни", "sydney", "мелбърн", "melbourne"], image: "/images/destinations/australia.avif" },
  { country: "Австрия", terms: ["австрия", "austria", "виена", "vienna"], image: "/images/destinations/austria.avif" },
  { country: "Белгия", terms: ["белгия", "belgium", "брюксел", "brussels"], image: "/images/destinations/belgium.avif" },
  { country: "Бразилия", terms: ["бразилия", "brasil", "brazil", "рио", "rio"], image: "/images/destinations/brasil.avif" },
  { country: "Камбоджа", terms: ["камбоджа", "cambodia", "сием рийп", "siem reap"], image: "/images/destinations/cambodia.avif" },
  { country: "Канада", terms: ["канада", "canada", "торонто", "toronto", "ванкувър", "vancouver"], image: "/images/destinations/canada.avif" },
  { country: "Кариби", terms: ["кариби", "caribbean", "барбадос", "barbados", "бахами", "bahamas"], image: "/images/destinations/caribbean.avif" },
  { country: "Дания", terms: ["дания", "denmark", "копенхаген", "copenhagen"], image: "/images/destinations/denmark.avif" },
  { country: "Доминиканска република", terms: ["доминикана", "доминиканска република", "dominican", "punta cana", "пунта кана"], image: "/images/destinations/dominican-republic.avif" },
  { country: "Англия", terms: ["англия", "england", "лондон", "london"], image: "/images/destinations/england.avif" },
  { country: "Етиопия", terms: ["етиопия", "etiopia", "ethiopia", "адис абеба", "addis ababa"], image: "/images/destinations/etiopia.avif" },
  { country: "Грузия", terms: ["грузия", "georgia", "тбилиси", "tbilisi", "батум", "batumi"], image: "/images/destinations/georgia.avif" },
  { country: "Германия", terms: ["германия", "germany", "берлин", "berlin", "мюнхен", "munich"], image: "/images/destinations/germany.avif" },
  { country: "Гърция", terms: ["гърция", "greece", "атина", "athens", "санторини", "santorini", "крит", "crete"], image: "/images/destinations/greece.avif" },
  { country: "Исландия", terms: ["исландия", "iceland", "рейкявик", "reykjavik"], image: "/images/destinations/iceland.avif" },
  { country: "Индия", terms: ["индия", "india", "делхи", "delhi", "мумбай", "mumbai"], image: "/images/destinations/india.avif" },
  { country: "Индонезия", terms: ["индонезия", "indonesia", "бали", "bali", "явa", "java"], image: "/images/destinations/indonesia.avif" },
  { country: "Ирландия", terms: ["ирландия", "ireland", "дъблин", "dublin"], image: "/images/destinations/ireland.avif" },
  { country: "Йордания", terms: ["йордания", "jordan", "петра", "petra", "амман", "amman"], image: "/images/destinations/jordan.avif" },
  { country: "Казахстан", terms: ["казахстан", "kazakhstan", "алмати", "almaty", "астана", "astana"], image: "/images/destinations/kazakhstan.avif" },
  { country: "Кения", terms: ["кения", "kenya", "найроби", "nairobi", "сафари", "safari"], image: "/images/destinations/kenya.avif" },
  { country: "Катар", terms: ["катар", "qatar", "доха", "doha"], image: "/images/destinations/qatar.avif" },
  { country: "Румъния", terms: ["румъния", "romania", "бухарест", "bucharest", "трансилвания", "transylvania"], image: "/images/destinations/romania.avif" },
  { country: "Виетнам", terms: ["виетнам", "vietnam", "ханой", "hanoi", "хошимин", "ho chi minh"], image: "/images/destinations/vietnam.avif" },
  { country: "Колумбия", terms: ["колумбия", "colombia", "богота", "bogota", "медельин", "medellin"], image: "/images/destinations/colombia.avif" },
  { country: "Крит", terms: ["крит", "crete", "ираклион", "heraklion", "чаня", "chania"], image: "/images/destinations/crete.avif" },
  { country: "Куба", terms: ["куба", "cuba", "хавана", "havana"], image: "/images/destinations/cuba.avif" },
  { country: "Кипър", terms: ["кипър", "cyprus", "никозия", "nicosia", "пафос", "paphos"], image: "/images/destinations/cyprus.avif" },
  { country: "Финландия", terms: ["финландия", "finland", "хелзинки", "helsinki"], image: "/images/destinations/finland.avif" },
  { country: "Лапландия", terms: ["лапландия", "lapland", "рованиеми", "rovaniemi"], image: "/images/destinations/lapland.avif" },
  { country: "Литва", terms: ["литва", "lithuania", "вилнюс", "vilnius"], image: "/images/destinations/lithuania.avif" },
  { country: "Малта", terms: ["малта", "malta", "валета", "valletta"], image: "/images/destinations/malta.avif" },
  { country: "Мавриций", terms: ["мавриций", "mauritius", "порт луи", "port louis"], image: "/images/destinations/mauritius.avif" },
  { country: "Сърбия", terms: ["сърбия", "serbia", "белград", "belgrade"], image: "/images/destinations/serbia.avif" },
  { country: "Шри Ланка", terms: ["шри ланка", "sri lanka", "цейлон", "ceylon", "коломбо", "colombo"], image: "/images/destinations/sri-lanka.avif" },
  { country: "Швеция", terms: ["швеция", "sweden", "стокхолм", "stockholm"], image: "/images/destinations/sweden.avif" }
];

function getDestinationMatch(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized.length < 2) return undefined;
  return destinationImages.find(({ terms }) => terms.some((term) => term.startsWith(normalized) || normalized.includes(term)));
}

const dateChoices = ["Имам точни дати", "Гъвкави сме", "Само сезон"];
const travelerChoices = ["Сам/а", "Двама", "Семейство", "Приятели", "Частна група", "По работа"];
const occasionChoicesByTravelers: Record<string, string[]> = {
  "Сам/а": ["Просто така", "Лично приключение", "Рожден ден", "Празник", "Друго"],
  "Двама": ["Honeymoon", "Годишнина", "Предложение", "Романтично бягство", "Рожден ден", "Просто така", "Друго"],
  "Семейство": ["Семейна ваканция", "Рожден ден", "Празник", "Годишнина", "Просто така", "Друго"],
  "Приятели": ["Рожден ден", "Празник", "Просто така", "Лично приключение", "Друго"],
  "Частна група": ["Празник", "Юбилей", "Рожден ден", "Просто така", "Друго"],
  "По работа": ["Бизнес пътуване", "Конференция", "Тиймбилдинг", "Друго"]
};
const moodChoices = [
  { label: "Да откривам", image: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=700&q=82" },
  { label: "Да опитвам", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=82" },
  { label: "Да се изгубя", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=82" },
  { label: "Да си почина", image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=700&q=82" },
  { label: "Да бъда сред природата", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=82" },
  { label: "Да видя важното", image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=700&q=82" },
  { label: "Да преживея нещо необичайно", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=82" },
  { label: "Да се свържа с мястото", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=82" }
];

const flexiblePeriods = ["Януари – Март", "Април – Юни", "Юли – Септември", "Октомври – Декември"];
const seasons = ["Пролет", "Лято", "Есен", "Зима"];
const planningYears = ["2026", "2027", "2028", "2029", "2030", "2031"];

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function ChoiceCard({
  children,
  active,
  onClick,
  image,
  icon: Icon
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  image?: string;
  icon?: LucideIcon;
}) {
  return (
    <button className={`journey-choice${active ? " is-selected" : ""}`} type="button" onClick={onClick}>
      {image ? <img src={image} alt="" /> : null}
      {Icon ? <Icon className="journey-choice-icon" size={51} strokeWidth={1.35} aria-hidden="true" /> : null}
      <span>{children}</span>
      {active ? <Check size={17} aria-hidden="true" /> : null}
    </button>
  );
}

export function JourneyBuilder() {
  const [step, setStep] = useState(0);
  const [destinationMode, setDestinationMode] = useState("");
  const [destination, setDestination] = useState("");
  const [dateMode, setDateMode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [flexiblePeriod, setFlexiblePeriod] = useState("");
  const [flexibleYear, setFlexibleYear] = useState("");
  const [season, setSeason] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [travelers, setTravelers] = useState("");
  const [occasion, setOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [pace, setPace] = useState(48);
  const [comfort, setComfort] = useState(38);
  const [freedom, setFreedom] = useState(62);
  const [completed, setCompleted] = useState(false);
  const [state, action, isPending] = useActionState(submitInquiry, { ok: false, message: "" });
  const occasionChoices = occasionChoicesByTravelers[travelers] || [];

  const selectedDestination = destinationMode === "surprise" ? "Изненада" : destination || "Ще изберем посока";
  const selectedOccasion = occasion === "Друго" ? customOccasion || "Друг повод" : occasion;
  const destinationMatch = getDestinationMatch(destination);
  const selectedDestinationImage = destinationMatch?.image;
  const hasSelectedPeriod = dateMode === "Имам точни дати"
    ? Boolean(dateFrom && dateTo)
    : dateMode === "Гъвкави сме"
      ? Boolean(flexiblePeriod && flexibleYear)
      : Boolean(season && seasonYear);
  const selectedPeriod = hasSelectedPeriod
    ? dateMode === "Имам точни дати"
      ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
      : dateMode === "Гъвкави сме"
        ? `${flexiblePeriod} ${flexibleYear}`
        : `${season} ${seasonYear}`
    : "Ще изберем период";
  const selectedMoodLabels = moods.length ? moods.join(" · ") : "Ще изберем усещането";
  const selectedPace = pace < 38 ? "Бавно и спокойно" : pace > 66 ? "Искам да видя всичко" : "Балансирано";
  const selectedComfort = comfort < 38 ? "Комфорт" : comfort > 66 ? "Приключение" : "Комфорт с характер";
  const selectedFreedom = freedom < 38 ? "Свободно време" : freedom > 66 ? "Организирана програма" : "Добър баланс";
  const isBlankJourney = step === 0 && (!destinationMode || (destinationMode === "known" && !destination.trim()));
  const showInspirationReel = step === 0 && (destinationMode === "surprise" || (destinationMode === "ideas" && !destination.trim()));
  const datesIncomplete = step === 1 && (!dateMode || !hasSelectedPeriod);
  const stepIncomplete = step === 0
    ? !destinationMode || (destinationMode !== "surprise" && !destination.trim())
    : step === 1
      ? datesIncomplete
      : step === 2
        ? !travelers
        : !moods.length;
  const journeySummary = [
    `МЯСТО: ${selectedDestination}`,
    `ПЕРИОД: ${selectedPeriod}`,
    `ПЪТУВАЩИ: ${travelers || "Ще изберем"}`,
    `ПОВОД: ${selectedOccasion || "Без уточнен повод"}`,
    `УСЕЩАНЕ: ${selectedMoodLabels}`,
    `ТЕМПО: ${selectedPace}`,
    `СТИЛ: ${selectedComfort}`,
    `СВОБОДА: ${selectedFreedom}`
  ].join("\n");

  function toggleMood(label: string) {
    setMoods((current) => current.includes(label) ? current.filter((item) => item !== label) : current.length < 3 ? [...current, label] : current);
  }

  function selectTravelers(choice: string) {
    setTravelers(choice);
    setOccasion("");
    setCustomOccasion("");
  }

  function selectOccasion(choice: string) {
    setOccasion(choice);
    if (choice !== "Друго") setCustomOccasion("");
  }

  function nextStep() {
    if (stepIncomplete) return;
    if (step < 3) setStep((current) => current + 1);
    else {
      setCompleted(true);
      setStep(4);
    }
  }

  function previousStep() {
    if (completed) {
      setCompleted(false);
      setStep(3);
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  }

  return (
    <section className="journey-builder" id="journey-builder">
      <div className="container">
        <div className="journey-progress" aria-label="Напредък на пътуването">
          {steps.map((label, index) => (
            <div className={`journey-progress-step${index <= step ? " is-active" : ""}`} key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              {index < steps.length - 1 ? <i className="journey-progress-connector" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className={`journey-layout${completed ? " is-complete" : ""}`}>
          {!completed ? (
            <div className="journey-question-panel">
              {step === 0 ? (
                <>
                  <span className="eyebrow">01 / Нека започнем отнякъде.</span>
                  <h2>Имате ли място наум?</h2>
                  <p className="journey-question-intro">Няма грешен отговор. Понякога най-доброто пътуване започва с една посока, а понякога с желание да бъдете изненадани.</p>
                  <div className="journey-photo-choices">
                    {destinationChoices.map((choice) => (
                      <ChoiceCard key={choice.value} icon={choice.icon} active={destinationMode === choice.value} onClick={() => setDestinationMode(choice.value)}>{choice.label}</ChoiceCard>
                    ))}
                  </div>
                  {destinationMode === "known" || destinationMode === "ideas" ? (
                    <>
                      <label className="journey-input-field">
                        <span>Къде ви се ходи?</span>
                        <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Япония, Италия, няколко идеи..." />
                      </label>
                      {destinationMatch ? <div className="journey-destination-match"><Check size={16} aria-hidden="true" /><span>Разпозната държава: <strong>{destinationMatch.country}</strong></span></div> : null}
                      <div className="journey-help-note"><Sparkles size={23} aria-hidden="true" /><span>Нямате идея? Няма проблем. Изберете „Изненадайте ме“ и ще ви предложим вдъхновяващи идеи.</span></div>
                    </>
                  ) : null}
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <span className="eyebrow">02 / Кога тръгваме?</span>
                  <h2>Кога искате да се случи?</h2>
                  <p className="journey-question-intro">Дайте ни рамка, а ние ще намерим най-добрия ритъм вътре в нея.</p>
                  <div className="journey-pill-grid">
                    {dateChoices.map((choice) => <ChoiceCard key={choice} active={dateMode === choice} onClick={() => setDateMode(choice)}>{choice}</ChoiceCard>)}
                  </div>
                  {dateMode === "Имам точни дати" ? (
                    <div className="journey-date-range">
                      <label className="journey-input-field">
                        <span>От</span>
                        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                      </label>
                      <label className="journey-input-field">
                        <span>До</span>
                        <input type="date" min={dateFrom || undefined} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                      </label>
                    </div>
                  ) : null}
                  {dateMode === "Гъвкави сме" ? (
                    <div className="journey-date-range">
                      <label className="journey-input-field">
                        <span>Кои три месеца?</span>
                        <select value={flexiblePeriod} onChange={(event) => setFlexiblePeriod(event.target.value)}>
                          <option value="">Изберете период</option>
                          {flexiblePeriods.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="journey-input-field">
                        <span>Година</span>
                        <select value={flexibleYear} onChange={(event) => setFlexibleYear(event.target.value)}>
                          <option value="">Изберете година</option>
                          {planningYears.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                    </div>
                  ) : null}
                  {dateMode === "Само сезон" ? (
                    <div className="journey-date-range">
                      <label className="journey-input-field">
                        <span>Кой сезон?</span>
                        <select value={season} onChange={(event) => setSeason(event.target.value)}>
                          <option value="">Изберете сезон</option>
                          {seasons.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="journey-input-field">
                        <span>Година</span>
                        <select value={seasonYear} onChange={(event) => setSeasonYear(event.target.value)}>
                          <option value="">Изберете година</option>
                          {planningYears.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <span className="eyebrow">03 / Кой идва?</span>
                  <h2>Кой ще сподели пътуването?</h2>
                  <p className="journey-question-intro">Хората променят маршрута. Кажете ни с кого ще създадете тези спомени.</p>
                  <div className="journey-pill-grid journey-pill-grid-wide">
                    {travelerChoices.map((choice) => <ChoiceCard key={choice} active={travelers === choice} onClick={() => selectTravelers(choice)}>{choice}</ChoiceCard>)}
                  </div>
                  <div className="journey-sub-question">
                    <span>{travelers ? "Има ли повод?" : "Първо изберете с кого пътувате"}</span>
                    {travelers ? <div className="journey-inline-choices">
                      {occasionChoices.map((choice) => <button className={occasion === choice ? "is-selected" : ""} type="button" key={choice} onClick={() => selectOccasion(choice)}>{choice}</button>)}
                      {occasion === "Друго" ? <input className="journey-inline-custom-input" value={customOccasion} onChange={(event) => setCustomOccasion(event.target.value)} placeholder="Опишете повода (по желание)" /> : null}
                    </div> : null}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <span className="eyebrow">04 / Как искате да се чувствате там?</span>
                  <h2>Изберете до три усещания.</h2>
                  <p className="journey-question-intro">Това не е списък с услуги. Това е посоката, в която трябва да се движи вашето пътуване.</p>
                  <div className="journey-mood-grid">
                    {moodChoices.map((choice) => <ChoiceCard key={choice.label} image={choice.image} active={moods.includes(choice.label)} onClick={() => toggleMood(choice.label)}>{choice.label}</ChoiceCard>)}
                  </div>
                  <div className="journey-sliders">
                    <label><span>Бавно и спокойно</span><input type="range" min="0" max="100" value={pace} onChange={(event) => setPace(Number(event.target.value))} /><span>Искам да видя всичко</span></label>
                    <label><span>Комфорт</span><input type="range" min="0" max="100" value={comfort} onChange={(event) => setComfort(Number(event.target.value))} /><span>Приключение</span></label>
                    <label><span>Свободно време</span><input type="range" min="0" max="100" value={freedom} onChange={(event) => setFreedom(Number(event.target.value))} /><span>Организирана програма</span></label>
                  </div>
                </>
              ) : null}

              <div className="journey-navigation">
                <button className="journey-back-button" type="button" onClick={previousStep} disabled={step === 0}><ArrowLeft size={16} aria-hidden="true" /> Назад</button>
                <button className="button" type="button" onClick={nextStep} disabled={stepIncomplete}>{step === 3 ? "Вижте вашето пътуване" : "Напред"}<ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </div>
          ) : (
            <div className="journey-complete-copy">
              <span className="eyebrow">Вашата идея е създадена</span>
              <h2>Това вече прилича на пътуване.</h2>
              <p>Остава да го превърнем в маршрут.</p>
              <div className="journey-final-mark"><Sparkles size={18} aria-hidden="true" /> CREATED WITH RED TOURS</div>
            </div>
          )}

          <aside className="journey-board" aria-label="Вашето пътуване">
            <div className="journey-board-top"><span>ВАШЕТО ПЪТУВАНЕ / <strong className="journey-board-brand"><em>RED</em> TOURS</strong></span><Compass size={19} aria-hidden="true" /></div>
            <div className={`journey-board-cover${isBlankJourney || showInspirationReel ? " is-empty" : ""}`}>
              {!isBlankJourney && !showInspirationReel ? <img src={selectedDestinationImage || moodChoices.find((choice) => choice.label === moods[0])?.image || destinationChoices[0].image} alt="" /> : null}
              {isBlankJourney || showInspirationReel ? (
                <div className="journey-board-flash-reel" aria-hidden="true">
                  {[
                    destinationChoices[0].image,
                    destinationChoices[1].image,
                    moodChoices[1].image,
                    moodChoices[4].image,
                    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=84",
                    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=84",
                    "https://images.unsplash.com/photo-1507524698692-7e93e0b5c5e8?auto=format&fit=crop&w=900&q=84"
                  ].map((image, index) => <img src={image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} key={`${image}-${index}`} />)}
                </div>
              ) : null}
              <span className="journey-board-chapter">{isBlankJourney ? "Първа идея" : showInspirationReel ? "Вдъхновение" : `Глава ${String(Math.min(step + 1, 4)).padStart(2, "0")}`}</span>
              <strong>{isBlankJourney ? "ВАШЕТО ПЪТУВАНЕ" : showInspirationReel ? destinationMode === "ideas" ? "НЯКОЛКО ИДЕИ" : "ИЗНЕНАДАЙТЕ МЕ" : selectedDestination.toUpperCase()}</strong>
              <span>{isBlankJourney ? "ЩЕ ЗАПОЧНЕ ТУК" : showInspirationReel ? destinationMode === "ideas" ? "ЩЕ ГИ ПОДРЕДИМ" : "ЩЕ ОТКРИЕМ ПОСОКАТА" : `${hasSelectedPeriod ? selectedPeriod.toUpperCase() : "ПЕРИОДЪТ ЩЕ СЕ ИЗБЕРЕ"} · ${travelers.toUpperCase()}`}</span>
            </div>
            <div className="journey-board-lines">
              <div className="is-revealed"><MapPin size={15} aria-hidden="true" /><span>Посока</span><strong>{isBlankJourney ? "Ще я открием заедно" : selectedDestination}</strong></div>
              {hasSelectedPeriod && (step >= 1 || completed) ? <div className="is-revealed"><Sparkles size={15} aria-hidden="true" /><span>Период</span><strong>{selectedPeriod}</strong></div> : null}
              {step >= 2 || completed ? <div className="is-revealed"><Heart size={15} aria-hidden="true" /><span>Пътуващи</span><strong>{travelers}{selectedOccasion ? ` · ${selectedOccasion}` : ""}</strong></div> : null}
              {step >= 3 || completed ? <div className="is-revealed"><Sparkles size={15} aria-hidden="true" /><span>Усещане</span><strong>{selectedMoodLabels}</strong></div> : null}
              {step >= 3 || completed ? <div className="is-revealed"><RouteIcon size={15} aria-hidden="true" /><span>Темпо</span><strong>{selectedPace}</strong></div> : null}
              {step >= 3 || completed ? <div className="is-revealed"><Heart size={15} aria-hidden="true" /><span>Стил</span><strong>{selectedComfort}</strong></div> : null}
              {step >= 3 || completed ? <div className="is-revealed"><Sparkles size={15} aria-hidden="true" /><span>Свобода</span><strong>{selectedFreedom}</strong></div> : null}
            </div>
            <div className={`journey-board-moods${step >= 3 || completed ? " is-revealed" : ""}`}>
              {moods.map((mood) => <img src={moodChoices.find((choice) => choice.label === mood)?.image} alt={mood} key={mood} />)}
            </div>
            <div className="journey-board-footer"><span>{step === 0 ? "Вашето пътуване започва тук" : step === 4 ? "Идеята е готова за разговор" : "Продължете, за да го оформим"}</span><Heart size={15} aria-hidden="true" /></div>
          </aside>
        </div>

        {completed ? (
          <div className="journey-contact-panel">
            <div>
              <span className="eyebrow">Последна стъпка</span>
              <h3>Изпратете идеята на Red Tours.</h3>
              <p>Ще я превърнем в първия разговор за вашия маршрут.</p>
            </div>
            <form className="journey-contact-form" action={action}>
              <input type="hidden" name="destination" value={selectedDestination} />
              <input type="hidden" name="departure" value={selectedPeriod} />
              <input type="hidden" name="adults" value={travelers === "Двама" ? "2" : "1"} />
              <input type="hidden" name="children" value={travelers === "Семейство" ? "1" : "0"} />
              <input type="hidden" name="budget" value="" />
              <input type="hidden" name="lead_source" value="tailor_made_builder" />
              <textarea name="message" value={journeySummary} readOnly hidden />
              <div className="journey-contact-intro">
                <span className="eyebrow">Разкажете ни за вашето пътуване</span>
                <p>Не е необходимо да имате готов план. Споделете това, което вече знаете, а ние ще ви помогнем да уточним останалото.</p>
              </div>
              <label><span>Име и фамилия</span><input name="name" autoComplete="name" required placeholder="Вашето име" /></label>
              <label><span>Телефон</span><input name="phone" autoComplete="tel" placeholder="+359" /></label>
              <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label>
              <label><span>Желана дестинация</span><input name="brief_destination" value={selectedDestination} readOnly /></label>
              <label><span>Предпочитан период</span><input name="brief_period" value={selectedPeriod} readOnly /></label>
              <label><span>Гъвкави ли са датите?</span><select name="dates_flexible" defaultValue={dateMode === "Гъвкави сме" ? "Да" : "Ще уточним"}><option>Да</option><option>Не</option><option>Ще уточним</option></select></label>
              <label><span>Брой възрастни</span><input name="brief_adults" type="number" min="1" defaultValue={travelers === "Двама" ? "2" : "1"} /></label>
              <label><span>Брой деца и възрасти</span><input name="children_ages" placeholder="Напр. 2 деца, на 6 и 10 г." /></label>
              <label><span>Продължителност</span><input name="duration" placeholder="Напр. 10-12 дни" /></label>
              <label><span>Повод за пътуването</span><input name="brief_occasion" value={selectedOccasion} readOnly /></label>
              <label><span>Какво искате да преживеете?</span><input name="experiences" value={selectedMoodLabels} readOnly /></label>
              <label><span>Стил на настаняване</span><select name="accommodation_style" defaultValue="Бутиков и комфортен"><option>Бутиков и комфортен</option><option>Луксозен</option><option>Автентичен</option><option>Практичен</option><option>Ще разчитам на препоръка</option></select></label>
              <label><span>Ориентировъчен общ бюджет</span><input name="brief_budget" placeholder="Напр. 4 000 EUR общо" /></label>
              <label><span>Предпочитан начин за контакт</span><select name="preferred_contact" defaultValue="Имейл"><option>Имейл</option><option>Телефон</option><option>Viber / WhatsApp</option></select></label>
              <label className="is-wide"><span>Допълнителна информация</span><textarea name="additional_information" placeholder="Всичко, което би ни помогнало да ви разберем по-добре..." rows={4} /></label>
              <button className="button" type="submit" disabled={isPending}>{isPending ? "Изпращане..." : "Изпратете идеята"}<Send size={16} aria-hidden="true" /></button>
              {state.message ? <p className={`journey-form-message${state.ok ? " is-ok" : " is-error"}`}>{state.message}</p> : null}
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}

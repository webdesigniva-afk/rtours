import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Check, CheckCircle2, Map, MessageCircle, Plane, UsersRound } from "lucide-react";
import { JourneyBuilder } from "@/components/JourneyBuilder";
import { HeroVideo } from "@/components/HeroVideo";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Пътуване по мярка",
  description: "Създайте пътуването си стъпка по стъпка с Red Tours."
};

const processSteps = [
  { number: "01", title: "Разкажете ни какво търсите", text: "Дестинация, период, повод, интереси, брой пътуващи и ориентировъчен бюджет.", icon: MessageCircle },
  { number: "02", title: "Обсъждаме идеята", text: "Наш консултант се свързва с вас, за да уточни важните детайли и приоритети.", icon: UsersRound },
  { number: "03", title: "Създаваме Вашето пътуване", text: "Разработваме персонален маршрут с подбрани полети, хотели, трансфери и преживявания.", icon: Map },
  { number: "04", title: "Финализираме заедно", text: "Обсъждаме предложението и правим необходимите промени, преди да преминем към резервация.", icon: CheckCircle2 },
  { number: "05", title: "Остава да пътувате", text: "Получавате всичко необходимо за спокойно пътуване и нашата подкрепа по време на път.", icon: Plane }
];

export default function TailorMadePage() {
  return (
    <>
      <SiteHeader />
      <main className="tailor-page">
        <section className="tailor-hero">
          <div className="container tailor-hero-inner">
            <div className="tailor-hero-copy">
              <PublicBreadcrumbs items={[{ label: "Пътувания", href: "/offers" }, { label: "Пътуване по мярка" }]} />
              <h1>Няма готов маршрут.<em>Създаваме вашия.</em></h1>
              <p>Дайте ни началото. Дестинация, повод, период — или просто усещане. Останалото ще създадем заедно.</p>
              <a className="button" href="#journey-builder">Да започнем <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
            <div className="tailor-hero-collage" aria-hidden="true">
              <div className="tailor-photo tailor-photo-main"><img src="/images/destinations/japan.jpg" alt="Япония" /><HeroVideo /></div>
              <div className="tailor-photo tailor-photo-small"><img src="/images/hero/hero4.jpg" alt="Пътуващи хора" /></div>
              <div className="tailor-photo tailor-photo-fragment"><img src="/images/hero/hero5.jpg" alt="Пътуващи хора" /></div>
              <img className="tailor-stamp" src="/images/brand/tailor-made-stamp.png" alt="Tailor-made journeys" />
              <span className="tailor-collage-label">
                <span>Your journey</span>
                <span>starts here</span>
                <svg viewBox="0 0 184 48" aria-hidden="true">
                  <path d="M4 24C48 43 116 42 174 12" />
                  <path d="M158 7L176 12L166 29" />
                </svg>
              </span>
              <span className="tailor-micro-label tailor-micro-destination">DESTINATION <b>?</b></span>
              <span className="tailor-micro-label tailor-micro-when">WHEN <b>?</b></span>
              <span className="tailor-micro-label tailor-micro-with">WITH <b>?</b></span>
              <svg className="tailor-route-line" viewBox="0 0 620 360" fill="none"><path d="M8 292C104 248 111 330 218 286C315 246 276 92 398 119C482 138 495 268 610 180" /><circle cx="8" cy="292" r="5" /><circle cx="610" cy="180" r="5" /></svg>
            </div>
          </div>
          <a className="tailor-scroll-cue" href="#how-it-works"><ArrowDown size={15} aria-hidden="true" /> Създаваме заедно</a>
        </section>

        <section className="tailor-process" id="how-it-works">
          <div className="container">
            <div className="tailor-process-layout">
              <div className="tailor-process-heading">
                <span className="eyebrow">Как работи</span>
                <h2>Вие давате началото.<br />Ние създаваме<br />пътуването.</h2>
              </div>
              <div className="tailor-process-line">
                <svg className="tailor-process-route" viewBox="0 0 1040 84" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M34 34 C84 43 106 43 130 34 S208 25 236 34 C288 43 314 43 338 34 S416 25 444 34 C496 43 522 43 546 34 S624 25 652 34 C704 43 730 43 754 34 S832 25 860 34 C920 43 978 34 1030 5" />
                  <circle cx="130" cy="34" r="4.8" />
                  <circle cx="338" cy="34" r="4.8" />
                  <circle cx="546" cy="34" r="4.8" />
                  <circle cx="754" cy="34" r="4.8" />
                </svg>
                <svg className="tailor-process-plane" viewBox="0 0 46 46" aria-hidden="true">
                  <path d="M43.5 7.6c-1.2-1.2-4.1-.2-6.6 2.3l-6.4 6.4-18-6.2c-.8-.3-1.7-.1-2.3.5l-1.8 1.8 15.2 10.8-6.4 6.4-7.3-2.5-2.2 2.2 8.3 5.2 5.2 8.3 2.2-2.2-2.5-7.3 6.4-6.4 10.8 15.2 1.8-1.8c.6-.6.8-1.5.5-2.3l-6.2-18 6.4-6.4c2.5-2.5 3.5-5.4 2.3-6.6Z" />
                </svg>
                {processSteps.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.number}>
                      <div className="tailor-process-node">
                        <span className="tailor-process-icon"><Icon size={25} strokeWidth={1.7} /></span>
                      </div>
                      <small>{item.number}</small>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <JourneyBuilder />

        <section className="tailor-quiet-footer">
          <div className="container">
            <span className="tailor-quiet-typing" aria-label="Не търсим готовия отговор. Търсим вашия.">
              Не търсим готовия отговор. Търсим <em>вашия</em>.
            </span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

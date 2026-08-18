import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Check, CheckCircle2, Map, MessageCircle, Plane, UsersRound } from "lucide-react";
import { JourneyBuilder } from "@/components/JourneyBuilder";
import { HeroVideo } from "@/components/HeroVideo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Пътуване по мярка",
  description: "Създайте пътуването си стъпка по стъпка с Red Tours."
};

const processSteps = [
  { number: "01", title: "Разкажете ни какво търсите", text: "Дестинация, период, повод, интереси, брой пътуващи и ориентировъчен бюджет.", icon: MessageCircle },
  { number: "02", title: "Обсъждаме идеята", text: "Наш консултант се свързва с вас, за да уточни важните детайли и приоритети.", icon: UsersRound },
  { number: "03", title: "Създаваме предложението", text: "Разработваме маршрут и подбираме подходящите полети, хотели, трансфери и преживявания.", icon: Map },
  { number: "04", title: "Финализираме заедно", text: "Обсъждаме предложението и правим необходимите промени, преди да преминем към резервация.", icon: CheckCircle2 },
  { number: "05", title: "Пътувате спокойно", text: "Получавате необходимата информация и съдействие от подготовката до завръщането.", icon: Plane }
];

export default function TailorMadePage() {
  return (
    <>
      <SiteHeader />
      <main className="tailor-page">
        <section className="tailor-hero">
          <div className="container tailor-hero-inner">
            <div className="tailor-hero-copy">
              <span className="eyebrow">Tailor-made / Пътуване по мярка</span>
              <h1>Няма готов маршрут.<em>Създаваме вашия.</em></h1>
              <p>Дайте ни началото. Дестинация, повод, период — или просто усещане. Останалото ще създадем заедно.</p>
              <a className="button" href="#journey-builder">Да започнем <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
            <div className="tailor-hero-collage" aria-hidden="true">
              <div className="tailor-photo tailor-photo-main"><img src="/images/destinations/japan.jpg" alt="Япония" /><HeroVideo /></div>
              <div className="tailor-photo tailor-photo-small"><img src="/images/hero/hero2.jpg" alt="Пътуващи хора" /></div>
              <div className="tailor-photo tailor-photo-fragment"><img src="/images/hero/hero1.jpg" alt="Пътуващи хора" /></div>
              <img className="tailor-stamp" src="/images/brand/tailor-made-stamp.png" alt="Tailor-made journeys" />
              <span className="tailor-collage-label">YOUR JOURNEY <b>/</b> STARTS HERE</span>
              <span className="tailor-micro-label tailor-micro-destination">DESTINATION / <b>?</b></span>
              <span className="tailor-micro-label tailor-micro-when">WHEN / <b>?</b></span>
              <span className="tailor-micro-label tailor-micro-with">WITH / <b>?</b></span>
              <span className="tailor-micro-label tailor-micro-tokyo">TOKYO? <b>·</b> SPRING <b>·</b> 12 DAYS</span>
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
                {processSteps.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.number}>
                      <div className="tailor-process-node">
                        <span className="tailor-process-icon"><Icon size={25} strokeWidth={1.7} /></span>
                        {index < processSteps.length - 1 ? <span className="tailor-process-connector" aria-hidden="true" /> : null}
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

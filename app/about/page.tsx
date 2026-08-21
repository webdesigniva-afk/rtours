import type { Metadata } from "next";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { ScrollRevealEffects } from "@/components/ScrollRevealEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const approachSteps = [
  {
    number: "01",
    title: "Започваме с правилните въпроси",
    copy: [
      "Какво искате да видите?",
      "Как обичате да пътувате?",
      "Какво би превърнало това пътуване във ваше?"
    ],
    image: "/images/about/approach-questions.png",
    alt: "Планиране на лично пътуване през сайта на Red Tours"
  },
  {
    number: "02",
    title: "Подбираме, вместо просто да добавяме",
    copy: [
      "Повече спирки невинаги означават по-добро пътуване. Търсим правилния баланс между съдържание, време и комфорт."
    ],
    image: "/images/about/approach-curation.jpg",
    alt: "Подбрано преживяване в ресторант с аквариум"
  },
  {
    number: "03",
    title: "Познаваме детайлите",
    copy: [
      "Следим сезонността, транспорта, настаняването, местните особености и всички елементи, които могат да променят преживяването."
    ],
    image: "/images/about/approach-details.jpg",
    alt: "Пътуване в пустинята с камили и местни водачи"
  },
  {
    number: "04",
    title: "Оставаме до вас",
    copy: [
      "Нашата работа не приключва с продажбата. Подготвяме ви за пътуването и сме насреща, когато имате нужда от съдействие."
    ],
    image: "/images/about/approach-stay-with-you.png",
    alt: "Чат за съдействие при пътуване от Red Tours"
  }
];

const teamProfiles = [
  {
    name: "Име и фамилия",
    role: "Консултант пътувания",
    photoAlt: "Планиране на пътуване от екипа на Red Tours",
    bio: "Кратък личен текст за опита, любимите дестинации, експертизата и начина, по който човекът допринася за пътуванията.",
    favorite: "Любима дестинация",
    recommends: "Пътуване, което препоръчва",
    neverWithout: "Кратък личен детайл"
  },
  {
    name: "Име и фамилия",
    role: "Авторски програми",
    photoAlt: "Пътуване в пустинята с местни детайли",
    bio: "Кратък личен текст за опита, любимите дестинации, експертизата и начина, по който човекът допринася за пътуванията.",
    favorite: "Любима дестинация",
    recommends: "Пътуване, което препоръчва",
    neverWithout: "Кратък личен детайл"
  },
  {
    name: "Име и фамилия",
    role: "Координация и съдействие",
    photoAlt: "Съдействие и връзка с Red Tours при пътуване",
    bio: "Кратък личен текст за опита, любимите дестинации, експертизата и начина, по който човекът допринася за пътуванията.",
    favorite: "Любима дестинация",
    recommends: "Пътуване, което препоръчва",
    neverWithout: "Кратък личен детайл"
  },
  {
    name: "Име и фамилия",
    role: "Маркетинг и комуникации",
    photoAlt: "Профил на човек от екипа на Red Tours",
    bio: "Кратък личен текст за опита, любимите дестинации, експертизата и начина, по който човекът допринася за пътуванията.",
    favorite: "Любима дестинация",
    recommends: "Пътуване, което препоръчва",
    neverWithout: "Кратък личен детайл"
  }
];

export const metadata: Metadata = {
  title: "За Red Tours",
  description: "Философия, подход и доверие зад пътуванията на Red Tours."
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <ScrollRevealEffects />
        <section className="about-hero">
          <div className="about-hero-media" aria-hidden="true">
            <img src="/images/about/about-hero.png" alt="" />
          </div>
          <div className="container about-hero-inner">
            <div className="about-hero-copy">
              <PublicBreadcrumbs items={[{ label: "За Red Tours" }]} />
              <h1>
                Пътуването
                <span>е лично.</span>
                <em>Така подхождаме и ние.</em>
              </h1>
              <p>
                Red Tours създава и организира пътувания за хора, които търсят повече от стандартна програма.
              </p>
              <p>
                За нас всяка дестинация е съчетание от места, хора, истории, логистика и безброй малки решения.
                Затова подбираме внимателно не само къде ще ви отведем, но и как ще преживеете пътя дотам.
              </p>
            </div>
          </div>
        </section>

        <section className="about-approach-section" aria-labelledby="about-approach-title">
          <div className="container about-approach-shell">
            <div className="about-approach-label">
              <span />
              <p aria-hidden="true">Since 2011</p>
              <h2 id="about-approach-title">Нашият подход</h2>
              <span />
            </div>

            <div className="about-approach-mosaic">
              {approachSteps.map((step, index) => (
                <article className={`about-approach-step is-${index + 1}`} key={step.number}>
                  <div className="about-approach-text">
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    {step.copy.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  <figure className="about-approach-photo">
                    <img src={step.image} alt={step.alt} />
                  </figure>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-philosophy" aria-labelledby="about-philosophy-title">
          <div className="container about-philosophy-inner">
            <div className="about-philosophy-content">
              <p className="about-philosophy-kicker">Нашата философия</p>
              <p className="about-philosophy-lede">
                Доброто пътуване има идея, ритъм и смисъл.
              </p>
              <div className="about-philosophy-copy">
                <p>
                  Не вярваме, че едно пътуване е добро само защото дестинацията е впечатляваща.
                </p>
                <p>
                  Доброто пътуване има идея, ритъм и смисъл. То оставя време за важните места, но и за онези моменти, които не могат да бъдат планирани предварително.
                </p>
                <p>Точно такива пътувания искаме да създаваме.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-team" aria-labelledby="about-team-title">
          <div className="container about-team-layout">
            <div className="about-team-intro">
              <h2 id="about-team-title">
                Хората зад <span className="about-team-red">Red</span>{" "}
                <span className="about-team-tours">Tours</span>
              </h2>
              <p>
                Зад всяко пътуване стоят проучване, разговори, избори, проверки и много внимание към детайлите.
              </p>
              <p>
                Запознайте се с хората, които превръщат идеите в маршрути и маршрутите — в реални преживявания.
              </p>
            </div>

            <div className="about-team-list">
              {teamProfiles.map((profile, index) => (
                <article className="about-team-card" key={`${profile.name}-${index}`} tabIndex={0}>
                  <figure className={`about-team-photo is-${index + 1}`} aria-label={profile.photoAlt}>
                    <span className="about-team-silhouette" aria-hidden="true" />
                  </figure>
                  <div className="about-team-card-top">
                    <div>
                      <h3>{profile.name}</h3>
                      <p>{profile.role}</p>
                    </div>
                  </div>
                  <div className="about-team-closed-favorite" aria-hidden="true">
                    <span>♡</span>
                    <strong>{profile.favorite}</strong>
                  </div>
                  <p className="about-team-bio">{profile.bio}</p>
                  <dl className="about-team-facts">
                    <div>
                      <dt>Любима дестинация</dt>
                      <dd>{profile.favorite}</dd>
                    </div>
                    <div>
                      <dt>Препоръчва</dt>
                      <dd>{profile.recommends}</dd>
                    </div>
                    <div>
                      <dt>Никога не тръгва без</dt>
                      <dd>{profile.neverWithout}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

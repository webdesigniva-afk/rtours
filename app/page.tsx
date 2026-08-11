import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Hotel, Plane, Star } from "lucide-react";
import { OfferCard } from "@/components/OfferCard";
import { ScrollPlaneTrail } from "@/components/ScrollPlaneTrail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TravelFinder } from "@/components/TravelFinder";
import { collections, getPublishedOffers } from "@/lib/data";

export default function Home() {
  const featuredOffers = getPublishedOffers();
  const collectionDetails: Record<string, { label: string; audience: string; cue: string }> = {
    "red-signature": {
      label: "Red Signature",
      audience: "Авторски програми",
      cue: "Селекция от маршрути, хотели и преживявания, подредени с личен вкус."
    },
    "red-moments": {
      label: "Red Moments",
      audience: "Кратки бягства",
      cue: "Кратки формати с точен ритъм, силна атмосфера и лесна организация."
    },
    "red-escape": {
      label: "Red Escape",
      audience: "Екзотични дестинации",
      cue: "Нова посока, различен ритъм и усещане за откъсване от обичайното."
    },
    "red-family": {
      label: "Red Family",
      audience: "Пътувания за цялото семейство",
      cue: "Програми с удобен ритъм, повече спокойствие и внимание към всеки."
    },
    "red-private": {
      label: "Red Private",
      audience: "Индивидуални и VIP преживявания",
      cue: "Персонален маршрут, внимателен подбор и услуга с максимална дискретност."
    }
  };
  const reviewStats = ["4,9", "192 Google отзива", "проверими мнения"];
  const googleReviews = [
    {
      name: "Radka Peneva",
      quote:
        "Изключително добра, компетентна и качествена работа, светкавично изпълнение и гъвкавост. Винаги си изкарваме чудесно, весело и много забавно."
    },
    {
      name: "Александрина Марчева",
      quote:
        "Организация, точност, спокойствие и вълшебство цари, когато си на път и горе в облаците. Препоръчвам горещо!"
    },
    {
      name: "Димитър Стойков",
      quote:
        "Всеки детайл беше прецизно планиран, а екипът - усмихнат и изключително отзивчив. С удоволствие бих пътувал с тях отново!"
    },
    {
      name: "Kristin Dimitrova",
      quote:
        "Страхотно обслужване и грижа за клиента! Независимо дали на почивка или търсене на приключения, те имат нещо за всеки."
    },
    {
      name: "Boyan Vichev",
      quote:
        "Екипът е много отзивчив и се грижи за всичко, така че да можеш просто да се насладиш на пътуването си без притеснения."
    }
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2200&q=85"
            >
              <source src="/hero-redtours.mp4" type="video/mp4" />
            </video>
            <img
              alt=""
              src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2200&q=85"
            />
          </div>
          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-copy">
                <h1>Спомени, които остават</h1>
                <p>
                  Всеки може да продаде пътуване. Малцина могат да създадат преживяване, което
                  остава с вас за цял живот.
                </p>
                <div className="hero-actions">
                  <Link className="button" href="/offers">
                    Разгледай пътувания
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="button secondary" href="/corporate">
                    Корпоративни услуги
                  </Link>
                </div>
              </div>
              <aside className="hero-panel" aria-label="Акценти">
                <span className="hero-panel-kicker">Опит</span>
                <strong>20+</strong>
                <span>години в маршрути с мярка, стил и човешко внимание.</span>
              </aside>
            </div>
            <div className="hero-footer" aria-label="Начин на откриване">
              <span>Екскурзии</span>
              <span>Почивки</span>
              <span>Корпоративни пътувания</span>
              <span>Хотели</span>
              <span>Самолетни билети</span>
            </div>
          </div>
        </section>

        <TravelFinder />

        <section className="signature-strip" aria-label="Подходът на RedTours">
          <div className="container signature-grid">
            <div className="signature-intro">
              <span className="eyebrow">Подходът на RedTours</span>
              <p>Бутиковият избор личи в детайлите, които клиентът не трябва да мисли вместо екипа.</p>
            </div>
            <article className="signature-item">
              <span className="signature-number">01</span>
              <div>
                <strong>Подбор</strong>
                <span>Маршрути, хотели и преживявания, които минават през човешка селекция.</span>
              </div>
            </article>
            <article className="signature-item">
              <span className="signature-number">02</span>
              <div>
                <strong>Ритъм</strong>
                <span>Програми с мярка: време за откриване, почивка и личен момент.</span>
              </div>
            </article>
            <article className="signature-item">
              <span className="signature-number">03</span>
              <div>
                <strong>Грижа</strong>
                <span>Организация и внимание преди, по време и след пътуването.</span>
              </div>
            </article>
          </div>
          <ScrollPlaneTrail />
        </section>

        <section className="section collection-section" id="collections">
          <div className="container">
            <div className="section-header collection-header">
              <div>
                <span className="eyebrow collection-kicker">
                  <span>Red</span> Collections
                </span>
                <h2>Изберете по усещане, не само по дестинация.</h2>
              </div>
              <p>
                За по-бърза ориентация RedTours подрежда предложенията по стил на пътуване:
                луксозно, екзотично, семейно, индивидуално или кратко преживяване.
              </p>
            </div>
            <div className="collection-grid">
              {collections.map((collection) => (
                <Link
                  className="collection-card"
                  href={`/offers?collection=${collection.slug}`}
                  key={collection.slug}
                  aria-label={`Разгледай ${collection.name}`}
                >
                  <img src={collection.image} alt={collection.name} />
                  <div className="collection-card-content">
                    <span className="eyebrow">{collectionDetails[collection.slug].audience}</span>
                    <h3>
                      <span>Red</span> {collectionDetails[collection.slug].label.replace("Red ", "")}
                    </h3>
                    <p>{collectionDetails[collection.slug].cue}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section brand-proof" id="trust">
          <div className="container brand-proof-grid">
            <div className="brand-proof-copy">
              <span className="eyebrow">Доверие с история</span>
              <h2>Опитът личи в спокойствието на клиента.</h2>
              <p>
                Основана през 2011 година, Ред Турс ЕООД е регистриран туроператор с
                лиценз РК 01-6737. Днес екипът работи с индивидуални клиенти, групи и
                корпоративни партньори през три офиса в България.
              </p>
              <p>
                Силата на RedTours е в прецизната подготовка: правилна дестинация, точен
                транспорт, внимателно подбрано настаняване и програма, която спестява
                време, излишно търсене и решения на сляпо.
              </p>
              <div className="brand-credentials" aria-label="Факти за RedTours">
                <div>
                  <span>Основана</span>
                  <strong>2011</strong>
                </div>
                <div>
                  <span>Туроператорски лиценз</span>
                  <strong>РК 01-6737</strong>
                </div>
                <div>
                  <span>Присъствие</span>
                  <strong>3 офиса в България</strong>
                </div>
              </div>
            </div>
            <div className="service-proof">
              <div className="proof-card">
                <span><Plane size={18} aria-hidden="true" /></span>
                <h3>Пътувания и почивки</h3>
                <p>Самолетни билети, хотелски резервации, екскурзии, уикенд пакети и почивки в България и чужбина.</p>
              </div>
              <div className="proof-card">
                <span><Hotel size={18} aria-hidden="true" /></span>
                <h3>Индивидуални програми</h3>
                <p>Маршрути по мярка, трансфери, коли под наем и подбор на допълнителни услуги според личния ритъм.</p>
              </div>
              <div className="proof-card">
                <span><BriefcaseBusiness size={18} aria-hidden="true" /></span>
                <h3>Корпоративно обслужване</h3>
                <p>Организация, оптимизация на разходи и спокойна координация за бизнес пътувания и екипни формати.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section review-section" id="reviews">
          <div className="container">
            <div className="review-editorial-header">
              <div>
                <span className="eyebrow">Google отзиви</span>
                <h2>Гласове на клиенти, които вече са пътували с RedTours.</h2>
              </div>
              <div className="review-stat-row" aria-label="Google рейтинг">
                {reviewStats.map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </div>
            <div className="review-showcase">
              <article className="review-featured">
                <div className="review-source-line">
                  <span>Google Reviews</span>
                  <div className="review-stars" aria-label="5 звезди">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={18} aria-hidden="true" />
                    ))}
                  </div>
                </div>
                <blockquote>{googleReviews[0].quote}</blockquote>
                <div className="review-author">
                  <strong>{googleReviews[0].name}</strong>
                  <span>Google отзив</span>
                </div>
                <a href="https://www.google.com/search?q=%D0%A0%D0%B5%D0%B4+%D1%82%D1%83%D1%80%D1%81+%D0%A8%D1%83%D0%BC%D0%B5%D0%BD+Google+reviews" target="_blank" rel="noreferrer">
                  Виж всички отзиви
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
              <div className="review-stack">
                {googleReviews.slice(1).map((review) => (
                  <article className="review-mini" key={review.name}>
                    <div className="review-mini-stars" aria-label="5 звезди">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={13} aria-hidden="true" />
                      ))}
                    </div>
                    <p>{review.quote}</p>
                    <footer>
                      <strong>{review.name}</strong>
                      <span>Google отзив</span>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Избрани пътувания</span>
              <h2>Подбрани програми</h2>
              <p>
                Всяка програма трябва да може да носи собствен характер, но да стои в една обща,
                премиум система за съдържание, търсене и запитвания.
              </p>
            </div>
            <div className="offers-grid">
              {featuredOffers.map((offer) => (
                <OfferCard key={offer.slug} offer={offer} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, Handshake, HeartHandshake, LifeBuoy, MapPin, SearchCheck, Star } from "lucide-react";
import { ScrollPlaneTrail } from "@/components/ScrollPlaneTrail";
import { ScrollRevealEffects } from "@/components/ScrollRevealEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroVideo } from "@/components/HeroVideo";
import { TravelFinder } from "@/components/TravelFinder";
import { listPublishedPublicOffers } from "@/lib/offerRepository";
import type { Offer } from "@/lib/types";

export const dynamic = "force-dynamic";

const countryCodeByName: Record<string, string> = {
  "Австрия": "at",
  "Албания": "al",
  "Белгия": "be",
  "България": "bg",
  "Великобритания": "gb",
  "Германия": "de",
  "Гърция": "gr",
  "Египет": "eg",
  "Испания": "es",
  "Италия": "it",
  "Китай": "cn",
  "Кипър": "cy",
  "Малдиви": "mv",
  "Мароко": "ma",
  "Обединени арабски емирства": "ae",
  "Португалия": "pt",
  "Румъния": "ro",
  "САЩ": "us",
  "Сингапур": "sg",
  "Турция": "tr",
  "Унгария": "hu",
  "Франция": "fr",
  "Хърватия": "hr",
  "Чехия": "cz",
  "Швейцария": "ch",
  "Япония": "jp"
};

function getCountryFlagUrl(country: string) {
  const code = countryCodeByName[country];
  return code ? `https://flagcdn.com/w160/${code}.png` : "";
}

function formatPickPrice(offer: Offer) {
  return offer.priceFrom > 0
    ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`
    : "Цена при запитване";
}

function formatPickDate(offer: Offer) {
  const firstDate = offer.dates.find((date) => date.startDate);
  if (!firstDate?.startDate) return "дати по заявка";

  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "long"
  }).format(new Date(firstDate.startDate));
}

function HomePickTile({ offer }: { offer: Offer }) {
  const title = offer.country || offer.title;
  const subtitle = offer.destinations?.map((item) => item.city).filter(Boolean).slice(0, 3).join(" · ") || offer.region || offer.title;
  const visibleTags = offer.tags.slice(0, 3);
  const flagUrl = getCountryFlagUrl(title);

  return (
    <article className="home-pick-tile">
      <Link className="home-pick-main-link" href={`/offers/${offer.slug}`}>
        <img src={offer.heroImage} alt={offer.title} />
        <span className="home-pick-arrow">
          <ArrowRight size={18} aria-hidden="true" />
        </span>
        <span className="home-pick-shade" aria-hidden="true" />
        <span className="home-pick-copy">
          {visibleTags.length > 0 ? (
            <span className="home-pick-tags">
              {visibleTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
          ) : null}
          <span className="home-pick-kind">{offer.productTypeLabel || "Подбрано пътуване"}</span>
          <strong>{title}</strong>
          <span className="home-pick-subtitle">{subtitle}</span>
          <span className="home-pick-meta">
            <span><CalendarDays size={15} aria-hidden="true" />{offer.durationDays} дни</span>
            <span>{formatPickDate(offer)}</span>
            <span><MapPin size={15} aria-hidden="true" />{offer.region || offer.country}</span>
            <b>{formatPickPrice(offer)}</b>
          </span>
        </span>
      </Link>
      {flagUrl ? (
        <Link
          className="home-pick-flag"
          href={`/destinations/${offer.destinationSlug}`}
          aria-label={`Виж всички оферти за ${title}`}
          data-tooltip={`Всички оферти за ${title}`}
        >
          <img src={flagUrl} alt="" />
        </Link>
      ) : null}
    </article>
  );
}

export default async function Home() {
  const featuredOffers = await listPublishedPublicOffers();
  const redToursPicks = featuredOffers
    .filter((offer) => (offer.visibilityPlacements ?? []).includes("homepage") || offer.tags.includes("Наш избор") || (offer.badgeSlugs ?? []).includes("nash-izbor"))
    .slice(0, 6);
  const redCollections = [
    {
      slug: "red-icons",
      name: "Red Icons",
      title: "Места, които остават.",
      text: "Емблематични маршрути и преживявания, които поне веднъж си заслужава да бъдат изживени.",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=84"
    },
    {
      slug: "red-hidden",
      name: "Red Hidden",
      title: "Отвъд очевидното.",
      text: "По-малко познати места, истории и кътчета на Европа извън утъпканите маршрути.",
      image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=84"
    },
    {
      slug: "red-taste",
      name: "Red Taste",
      title: "Светът има вкус.",
      text: "Пътувания през местната кухня, виното и вкусовете, които разказват една дестинация.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=84"
    },
    {
      slug: "red-wild",
      name: "Red Wild",
      title: "По-близо до дивото.",
      text: "Впечатляващи пейзажи, природни феномени и срещи с дивия свят.",
      image: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1400&q=84"
    },
    {
      slug: "red-live",
      name: "Red Live",
      title: "Бъдете там, когато се случва.",
      text: "Концерти, фестивали и културни събития, около които си заслужава да построите цяло пътуване.",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=84"
    },
    {
      slug: "red-circle",
      name: "Red Circle",
      title: "По-малко хора. Повече преживяване.",
      text: "Внимателно подбрани маршрути за малки групи и по-личен начин на пътуване.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=84"
    }
  ];
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
        <ScrollRevealEffects />
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <HeroVideo />
          </div>
          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-copy">
                <h1>
                  Пътувания, подбрани с опит.
                  <br />
                  Създадени с отношение.
                </h1>
                <p>
                  Авторски маршрути, екзотични дестинации и специални преживявания, организирани с внимание към всеки детайл.
                </p>
                <div className="hero-actions">
                  <Link className="button" href="/offers">
                    Разгледай пътувания
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="button secondary" href="/contacts#inquiry">
                    Пътуване по мярка
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TravelFinder />

        <section className="signature-strip" aria-label="Подходът на RedTours">
          <div className="container signature-grid">
            <article className="signature-intro signature-card">
              <span className="signature-index" aria-hidden="true">01</span>
              <span className="eyebrow">Подбрано от RedTours</span>
              <p>Нашата актуална селекция от пътувания, които си заслужават заради маршрута, момента и преживяванията по пътя.</p>
              <p>Тук ще откриете както нови програми, така и любими дестинации, към които бихме се върнали отново.</p>
              <div className="signature-photo" aria-hidden="true">
                <img src="/images/destinations/italy.avif" alt="" />
              </div>
              <Link className="signature-link" href="/offers?featured=red-tours">
                Вижте всички предложения
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
            <article className="signature-item signature-card">
              <span className="signature-index" aria-hidden="true">02</span>
              <div>
                <strong>Авторски пътувания</strong>
                <p>Има пътувания, които не могат да бъдат намерени в готов каталог.</p>
                <p>Те започват с идея, преминават през внимателно проучване и се превръщат в маршрут с характер. Подбираме местата, темпото, хотелите, местните партньори и преживяванията така, че всеки ден да има смисъл, а цялото пътуване да се усеща като завършена история.</p>
              </div>
              <div className="signature-photo" aria-hidden="true">
                <img src="/images/destinations/japan.jpg" alt="" />
              </div>
              <Link className="signature-link" href="/author-programs">
                Разгледайте авторските програми
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
            <article className="signature-item signature-card">
              <span className="signature-index" aria-hidden="true">03</span>
              <div>
                <strong>Екзотични пътувания</strong>
                <p>Далечните дестинации изискват повече от самолетен билет и хотел. Те изискват познаване на мястото, правилен ритъм, надеждни партньори и добра подготовка.</p>
                <p>Ние се грижим за сложната част, за да можете вие да преживеете пътуването истински.</p>
              </div>
              <div className="signature-photo" aria-hidden="true">
                <img src="/images/destinations/mauritius.avif" alt="" />
              </div>
              <Link className="signature-link" href="/offers?collection=red-escape">
                Разгледайте екзотиките
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
            <article className="signature-item signature-card">
              <span className="signature-index" aria-hidden="true">04</span>
              <div>
                <strong>
                  Пътуване по мярка
                </strong>
                <p>Понякога готовата програма не е достатъчна.</p>
                <p>Разкажете ни къде искате да отидете, как обичате да пътувате и какво е важно за вас. Ще създадем индивидуален маршрут, съобразен с вашите интереси, време, темпо и бюджет.</p>
              </div>
              <div className="signature-photo" aria-hidden="true">
                <img src="/images/destinations/iceland.avif" alt="" />
              </div>
              <Link className="signature-link" href="/contacts#inquiry">
                Разкажете ни за вашето пътуване
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
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
                <h2>Различни начини да видите света, събрани в тематични колекции.</h2>
              </div>
              <p>
                От емблематични маршрути и скрити кътчета на Европа до гастрономически приключения, дива природа и пътувания, създадени около специални събития.
              </p>
            </div>
            <div className="collection-grid">
              {redCollections.map((collection) => (
                <Link
                  className="collection-card"
                  href={`/offers?collection=${collection.slug}`}
                  key={collection.slug}
                  aria-label={`Разгледай ${collection.name}`}
                >
                  <img src={collection.image} alt={collection.name} />
                  <div className="collection-card-content">
                    <h3>
                      <span>Red</span> {collection.name.replace("Red ", "")}
                    </h3>
                    <strong>{collection.title}</strong>
                    <p>{collection.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section brand-proof" id="trust">
          <div className="container brand-proof-grid">
            <div className="brand-proof-copy">
              <span className="eyebrow">Въвеждащ текст</span>
              <h2>Защо да пътувате с RedTours?</h2>
              <p>За нас доброто пътуване не започва с резервацията и не приключва с обратния полет. То започва с правилните въпроси, внимателния избор и познаването на детайлите.</p>
              <Link className="brand-proof-link" href="/about">
                Научете повече за нас
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="service-proof">
              <div className="proof-card">
                <span><SearchCheck size={18} aria-hidden="true" /></span>
                <h3>Подбрани с експертност</h3>
                <p>Не включваме дестинации и услуги само защото са популярни. Оценяваме маршрута, сезонността, логистиката и реалната стойност на всяко предложение.</p>
              </div>
              <div className="proof-card">
                <span><Compass size={18} aria-hidden="true" /></span>
                <h3>Създадени с внимание</h3>
                <p>Мислим за пътуването като за цялостно преживяване - от последователността на маршрута до времето, необходимо действително да усетите мястото.</p>
              </div>
              <div className="proof-card">
                <span><Handshake size={18} aria-hidden="true" /></span>
                <h3>Надеждни партньори</h3>
                <p>Работим с внимателно подбрани местни партньори, хотели, водачи и доставчици, на които можем да разчитаме.</p>
              </div>
              <div className="proof-card">
                <span><HeartHandshake size={18} aria-hidden="true" /></span>
                <h3>Лично отношение</h3>
                <p>Зад всяко запитване стои реален човек от нашия екип, който познава продукта и може да ви помогне да направите информиран избор.</p>
              </div>
              <div className="proof-card">
                <span><LifeBuoy size={18} aria-hidden="true" /></span>
                <h3>Подкрепа по време на пътуването</h3>
                <p>Оставаме до вас и след потвърждението на резервацията - с необходимата информация, организация и съдействие.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section home-picks-section">
          <div className="container">
            <div className="section-header home-picks-header">
              <span className="eyebrow">Подбрано от Red Tours</span>
              <h2>Нашата актуална селекция</h2>
              <p>
                Осем предложения, които екипът ни би поставил на преден план заради маршрута, момента, хотелите или преживяванията.
              </p>
              <Link className="section-link" href="/offers?featured=red-tours">
                Виж всички
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="home-picked-grid">
            {redToursPicks.map((offer) => (
                <HomePickTile key={offer.slug} offer={offer} />
              ))}
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
      </main>
      <SiteFooter />
    </>
  );
}

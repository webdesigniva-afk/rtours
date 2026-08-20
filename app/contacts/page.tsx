import type { Metadata } from "next";
import { Clock, Mail, MapPin, Monitor, Phone, Smartphone, Store, Wifi } from "lucide-react";
import { ContactInquiryForm } from "@/components/ContactInquiryForm";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Контакти, офиси и запитвания към RedTours."
};

const contactChannels = [
  {
    icon: Phone,
    label: "Свържете се с нас на:",
    value: "0700 10 775",
    detail: "на цената на един градски разговор",
    href: "tel:070010775"
  },
  {
    icon: Smartphone,
    label: "Спешен телефон:",
    value: "0887 246 099",
    detail: "",
    href: "tel:0887246099"
  },
  {
    icon: Mail,
    label: "E-mail:",
    value: "office@redtours.bg",
    detail: "",
    href: "mailto:office@redtours.bg"
  }
];

const offices = [
  {
    number: "01",
    icon: Monitor,
    eyebrow: "Онлайн офис",
    title: "София",
    status: "",
    address: "",
    phones: ["02 850 41 51"],
    mobilePhones: ["0878 46 41 88"],
    email: "office@redtours.bg"
  },
  {
    number: "02",
    icon: Store,
    eyebrow: "Офис",
    title: "Шумен 1",
    status: "",
    address: "9700 гр. Шумен, ул. Панайот Волов 1",
    phones: ["054 830 600"],
    mobilePhones: ["087 846 4188", "0883 244 636"],
    email: "office@redtours.bg"
  },
  {
    number: "03",
    icon: Store,
    eyebrow: "Офис",
    title: "Шумен 2",
    status: "",
    address: "9700 гр. Шумен, ул. Панайот Волов No 9",
    phones: ["054 975 093"],
    mobilePhones: ["0878 46 41 82", "0878 46 41 83"],
    email: "reservations@redtours.bg"
  }
];

export default function ContactsPage() {
  return (
    <>
      <SiteHeader />
      <main className="contact-page contact-redesign">
        <section className="contact-map-hero">
          <div className="container contact-map-hero-inner">
            <div className="contact-intro">
              <PublicBreadcrumbs items={[{ label: "Контакти" }]} />
              <h1>
                Нека поговорим за следващото ви пътуване<span>.</span>
              </h1>
              <i aria-hidden="true" />
              <p>
                Имате въпрос за конкретна програма или идея за индивидуален маршрут?
                Свържете се с нас по удобния за вас начин.
              </p>
              <div className="contact-direct-list">
                {contactChannels.map(({ icon: Icon, label, value, detail, href }) => (
                  <a href={href} key={value}>
                    <span className="contact-direct-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span>
                      <small>{label}</small>
                      <strong>{value}</strong>
                      {detail ? <em>{detail}</em> : null}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="contact-bulgaria-map" aria-label="Офиси на RedTours в България">
              <img
                className="contact-map-cloud contact-map-cloud-wide"
                src="/contact-cloud-wide.png"
                alt=""
                aria-hidden="true"
              />
              <img
                className="contact-map-cloud contact-map-cloud-soft contact-map-cloud-soft-left"
                src="/contact-cloud-soft.webp"
                alt=""
                aria-hidden="true"
              />
              <img
                className="contact-map-cloud contact-map-cloud-soft contact-map-cloud-soft-right"
                src="/contact-cloud-soft.webp"
                alt=""
                aria-hidden="true"
              />
              <div className="contact-real-map">
                <img src="/bulgaria-map.svg" alt="" aria-hidden="true" />
                <svg className="contact-map-overlay" viewBox="0 0 1000 651" aria-hidden="true">
                  <path className="contact-flight-route is-upper" d="M-72 126 C 126 -26, 444 -38, 1078 118" />
                  <path className="contact-flight-route is-lower" d="M1070 560 C 934 536, 896 638, 758 606 C 662 584, 622 548, 566 690" />
                  <g className="contact-flight-plane is-upper" transform="translate(918 88) rotate(13) scale(0.5) translate(-38 -38)">
                    <path d="M60.1666 38H60.0776C60.0776 38 61.254 39.9002 47.2749 40.6107L43.6589 45.9167H44.2443C45.1187 45.9167 45.8276 46.6256 45.8276 47.5C45.8276 48.3745 45.1187 49.0834 44.2443 49.0834H41.4144L39.673 51.4584H39.8901C40.7645 51.4584 41.4734 52.1672 41.4734 53.0417C41.4734 53.9161 40.7645 54.625 39.8901 54.625H37.2359C35.1849 57.1943 33.2902 59.2888 31.9734 60.1667C31.9734 60.1667 29.2026 60.1667 29.2026 58.5833C29.2026 58.5833 35.6397 46.782 37.9164 40.8418C23.6609 40.9597 23.6609 39.9792 23.6609 39.9792C23.6609 39.9792 20.4943 45.9167 17.3276 45.9167L19.7026 38H19.7917L17.4167 30.0833C20.5833 30.0833 23.75 36.0208 23.75 36.0208C23.75 36.0208 23.75 35.0403 38.0055 35.1582C35.7288 29.218 29.2917 17.4167 29.2917 17.4167C29.2917 15.8333 32.0625 15.8334 32.0625 15.8334C33.3792 16.7112 35.2739 18.8058 37.325 21.375H39.9792C40.8536 21.375 41.5625 22.0839 41.5625 22.9583C41.5625 23.8328 40.8536 24.5417 39.9792 24.5417H39.7621L41.5034 26.9167H44.3333C45.2078 26.9167 45.9167 27.6255 45.9167 28.5C45.9167 29.3744 45.2078 30.0833 44.3333 30.0833H43.7479L47.3639 35.3893C61.343 36.0998 60.1666 38 60.1666 38Z" />
                  </g>
                  <g className="contact-flight-plane is-lower" transform="translate(744 604) rotate(195) scale(0.48) translate(-38 -38)">
                    <path d="M60.1666 38H60.0776C60.0776 38 61.254 39.9002 47.2749 40.6107L43.6589 45.9167H44.2443C45.1187 45.9167 45.8276 46.6256 45.8276 47.5C45.8276 48.3745 45.1187 49.0834 44.2443 49.0834H41.4144L39.673 51.4584H39.8901C40.7645 51.4584 41.4734 52.1672 41.4734 53.0417C41.4734 53.9161 40.7645 54.625 39.8901 54.625H37.2359C35.1849 57.1943 33.2902 59.2888 31.9734 60.1667C31.9734 60.1667 29.2026 60.1667 29.2026 58.5833C29.2026 58.5833 35.6397 46.782 37.9164 40.8418C23.6609 40.9597 23.6609 39.9792 23.6609 39.9792C23.6609 39.9792 20.4943 45.9167 17.3276 45.9167L19.7026 38H19.7917L17.4167 30.0833C20.5833 30.0833 23.75 36.0208 23.75 36.0208C23.75 36.0208 23.75 35.0403 38.0055 35.1582C35.7288 29.218 29.2917 17.4167 29.2917 17.4167C29.2917 15.8333 32.0625 15.8334 32.0625 15.8334C33.3792 16.7112 35.2739 18.8058 37.325 21.375H39.9792C40.8536 21.375 41.5625 22.0839 41.5625 22.9583C41.5625 23.8328 40.8536 24.5417 39.9792 24.5417H39.7621L41.5034 26.9167H44.3333C45.2078 26.9167 45.9167 27.6255 45.9167 28.5C45.9167 29.3744 45.2078 30.0833 44.3333 30.0833H43.7479L47.3639 35.3893C61.343 36.0998 60.1666 38 60.1666 38Z" />
                  </g>
                  <path className="contact-map-route" d="M232 339 C 390 288, 544 336, 718 214" />
                </svg>
                <div className="map-marker is-sofia">
                  <Wifi size={18} strokeWidth={2} aria-hidden="true" />
                  <strong>София</strong>
                  <span>Онлайн офис</span>
                </div>
                <div className="map-marker is-shumen">
                  <MapPin size={34} strokeWidth={1.9} aria-hidden="true" />
                  <strong>Шумен</strong>
                  <span>2 офиса</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-offices-section" aria-labelledby="contact-offices-title">
          <div className="container">
            <div className="contact-section-title">
              <span />
              <h2 id="contact-offices-title">Офисите ни може да намерите:</h2>
              <span />
            </div>
            <div className="contact-office-grid">
              {offices.map((office) => {
                const Icon = office.icon;

                return (
                  <article className="contact-office-card" key={office.number}>
                    <span className="contact-office-number">{office.number}</span>
                    <div className="contact-office-top">
                      <div>
                        <small>{office.eyebrow}</small>
                        <h3>{office.title}</h3>
                        {office.status ? <strong>{office.status}</strong> : null}
                      </div>
                      <span className="contact-office-icon">
                        <Icon size={28} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="contact-office-details">
                      {office.address ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <small>Адрес</small>
                          <span>{office.address}</span>
                        </a>
                      ) : null}
                      {office.phones.map((phone) => (
                        <a href={`tel:${phone.replaceAll(" ", "")}`} key={phone}>
                          <small>Телефон</small>
                          <span>{phone}</span>
                        </a>
                      ))}
                      {office.mobilePhones.length > 0 ? (
                        <div className="contact-office-detail-row">
                          <small>Мобилен</small>
                          <span>
                            <span className="contact-office-phone-list">
                              {office.mobilePhones.map((phone, index) => (
                                <span key={phone}>
                                  <a href={`tel:${phone.replaceAll(" ", "")}`}>{phone}</a>
                                  {index < office.mobilePhones.length - 1 ? <span aria-hidden="true">, </span> : null}
                                </span>
                              ))}
                            </span>
                          </span>
                        </div>
                      ) : null}
                      <a href={`mailto:${office.email}`}>
                        <small>Email</small>
                        <span>{office.email}</span>
                      </a>
                    </div>

                  </article>
                );
              })}
            </div>

            <div className="contact-hours-summary" aria-label="Работно време">
              <span className="contact-hours-summary-icon">
                <Clock size={30} aria-hidden="true" />
              </span>
              <div className="contact-hours-summary-main">
                <small>Работно време</small>
                <strong>Понеделник - Петък</strong>
                <em>09:30 - 18:00</em>
              </div>
              <span className="contact-hours-summary-divider" aria-hidden="true" />
              <div className="contact-hours-summary-main">
                <small>Уикенд</small>
                <strong>Събота - Неделя</strong>
                <em>Почивни дни</em>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-form-section" id="inquiry">
          <img className="contact-form-clouds" src="/contact-form-clouds-wide.png" alt="" aria-hidden="true" />
          <svg className="contact-form-route" viewBox="0 0 760 420" aria-hidden="true">
            <path className="contact-form-route-path" d="M-92 350 C 70 378, 142 318, 206 248 C 278 169, 360 197, 492 72" />
            <g className="contact-form-route-plane" transform="translate(492 72) rotate(-50) scale(0.62) translate(-38 -38)">
              <path d="M60.1666 38H60.0776C60.0776 38 61.254 39.9002 47.2749 40.6107L43.6589 45.9167H44.2443C45.1187 45.9167 45.8276 46.6256 45.8276 47.5C45.8276 48.3745 45.1187 49.0834 44.2443 49.0834H41.4144L39.673 51.4584H39.8901C40.7645 51.4584 41.4734 52.1672 41.4734 53.0417C41.4734 53.9161 40.7645 54.625 39.8901 54.625H37.2359C35.1849 57.1943 33.2902 59.2888 31.9734 60.1667C31.9734 60.1667 29.2026 60.1667 29.2026 58.5833C29.2026 58.5833 35.6397 46.782 37.9164 40.8418C23.6609 40.9597 23.6609 39.9792 23.6609 39.9792C23.6609 39.9792 20.4943 45.9167 17.3276 45.9167L19.7026 38H19.7917L17.4167 30.0833C20.5833 30.0833 23.75 36.0208 23.75 36.0208C23.75 36.0208 23.75 35.0403 38.0055 35.1582C35.7288 29.218 29.2917 17.4167 29.2917 17.4167C29.2917 15.8333 32.0625 15.8334 32.0625 15.8334C33.3792 16.7112 35.2739 18.8058 37.325 21.375H39.9792C40.8536 21.375 41.5625 22.0839 41.5625 22.9583C41.5625 23.8328 40.8536 24.5417 39.9792 24.5417H39.7621L41.5034 26.9167H44.3333C45.2078 26.9167 45.9167 27.6255 45.9167 28.5C45.9167 29.3744 45.2078 30.0833 44.3333 30.0833H43.7479L47.3639 35.3893C61.343 36.0998 60.1666 38 60.1666 38Z" />
            </g>
          </svg>
          <div className="container contact-form-layout">
            <aside className="contact-form-intro">
              <p className="contact-form-mantra">
                Един <span>разговор.</span>
                <br />
                Една <span>идея.</span>
                <br />И понякога - другият край на <span>света.</span>
              </p>
              <p className="contact-form-note">Останалото ще измислим заедно.</p>
            </aside>
            <ContactInquiryForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

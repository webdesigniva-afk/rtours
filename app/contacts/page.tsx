import type { Metadata } from "next";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Navigation, Phone, Send, ShieldCheck } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Контакти, офиси и запитвания към RedTours."
};

const channels = [
  { icon: Phone, label: "Национален телефон", value: "0700 10 775", detail: "на цената на градски разговор", href: "tel:070010775" },
  { icon: MessageCircle, label: "Спешна връзка", value: "0887 246 099", detail: "при пътуване и текуща организация", href: "tel:0887246099" },
  { icon: Mail, label: "Имейл", value: "office@redtours.bg", detail: "за програми, билети и корпоративни заявки", href: "mailto:office@redtours.bg" }
];

const offices = [
  {
    city: "София",
    name: "Само онлайн",
    address: "Обслужване онлайн",
    phones: ["02 850 41 51", "0878 46 41 88"],
    email: "office@redtours.bg"
  },
  {
    city: "Шумен",
    name: "Офис 1",
    address: "ул. Панайот Волов 1",
    phones: ["054 830 600", "087 846 4188", "0883 244 636"],
    email: "office@redtours.bg"
  },
  {
    city: "Шумен",
    name: "Офис 2",
    address: "ул. Панайот Волов No 9",
    phones: ["054 975 093", "0878 46 41 82", "0878 46 41 83"],
    email: "reservations@redtours.bg"
  }
];

const steps = ["Пишете ни", "Уточняваме детайлите", "Връщаме подбрано решение"];

export default function ContactsPage() {
  return (
    <>
      <SiteHeader />
      <main className="contact-page">
        <section className="contact-hero-premium">
          <div className="container contact-hero-premium-inner">
            <div className="contact-hero-copy">
              <PublicBreadcrumbs items={[{ label: "Контакти" }]} />
              <span className="eyebrow">Контакти</span>
              <h1>Един разговор може да подреди цялото пътуване.</h1>
              <p>
                Разкажете ни дестинацията, повода, ритъма и бюджета. Екипът на RedTours ще върне
                конкретно предложение, не безкраен списък за сравняване.
              </p>
              <div className="contact-hero-actions">
                <a href="tel:070010775">
                  Обадете се
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a href="#inquiry">Изпратете запитване</a>
              </div>
            </div>

            <aside className="contact-command-card" aria-label="Основен телефон">
              <span>RedTours desk</span>
              <a href="tel:070010775">0700 10 775</a>
              <p>На цената на един градски разговор</p>
              <div>
                <Clock size={16} aria-hidden="true" />
                Понеделник - Петък, 09:30 - 18:00
              </div>
            </aside>
          </div>
        </section>

        <section className="contact-console-section" id="inquiry">
          <div className="container contact-console">
            <div className="contact-channel-rail">
              {channels.map(({ icon: Icon, label, value, detail, href }) => (
                <a href={href} key={label}>
                  <Icon size={20} aria-hidden="true" />
                  <span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <em>{detail}</em>
                  </span>
                </a>
              ))}
            </div>

            <div className="contact-brief">
              <div className="contact-brief-heading">
                <span className="eyebrow">Запитване</span>
                <h2>Направете първата стъпка. Ние ще подредим следващите.</h2>
              </div>
              <InquiryForm />
              <div className="contact-brief-footnote">
                <Send size={15} aria-hidden="true" />
                <span>Колкото повече детайли дадете, толкова по-точно ще бъде първото предложение.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-process-premium">
          <div className="container contact-process-premium-inner">
            <div>
              <span className="eyebrow">Как работи</span>
              <h2>Запитването не потъва в поща. Превръща се в план.</h2>
            </div>
            <div className="contact-step-line">
              {steps.map((step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="offices-premium-section">
          <div className="container">
            <div className="offices-premium-heading">
              <span className="eyebrow">Офиси</span>
              <h2>Присъствие в страната, един стандарт на внимание.</h2>
            </div>
            <div className="office-route-board">
              {offices.map((office) => (
                <article className="office-route-item" key={`${office.city}-${office.name}`}>
                  <div>
                    <MapPin size={21} aria-hidden="true" />
                    <span>{office.city}</span>
                  </div>
                  <h3>{office.name}</h3>
                  <p>{office.address}</p>
                  <div className="office-route-contacts">
                    {office.phones.map((phone) => (
                      <a href={`tel:${phone.replaceAll(" ", "")}`} key={phone}>
                        {phone}
                      </a>
                    ))}
                    <a href={`mailto:${office.email}`}>{office.email}</a>
                  </div>
                  <small>
                    <ShieldCheck size={14} aria-hidden="true" />
                    Работно време: 09:30 - 18:00
                  </small>
                </article>
              ))}
            </div>
            <div className="office-premium-note">
              <Navigation size={18} aria-hidden="true" />
              <span>За среща на място е препоръчително предварително уточнение с екипа.</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

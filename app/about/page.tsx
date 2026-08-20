import type { Metadata } from "next";
import { BadgeCheck, Gem, Handshake, Route } from "lucide-react";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "За RedTours",
  description: "Философия, подход и доверие зад пътуванията на RedTours."
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <PublicBreadcrumbs items={[{ label: "За RedTours" }]} />
          <span className="eyebrow">За RedTours</span>
          <h1>Не продаваме маршрути. Подреждаме преживявания.</h1>
          <p>
            RedTours трябва да бъде представен като екип с вкус, опит и оперативна дисциплина:
            хора, които познават детайлите и правят пътуването спокойно за клиента.
          </p>
        </section>

        <section className="section split-band">
          <div className="container split">
            <div>
              <span className="eyebrow">Бутиков подход</span>
              <h2>Премиум усещането идва от подбор, не от шум.</h2>
              <p>
                Новият сайт трябва да покаже начина на работа на RedTours: внимателно съдържание,
                реални материали, доверие, ясна организация и персонална грижа.
              </p>
            </div>
            <ul className="feature-list">
              <li>
                <Gem size={22} aria-hidden="true" />
                Авторски програми и тематични колекции с ясна редакционна логика.
              </li>
              <li>
                <Route size={22} aria-hidden="true" />
                Маршрути, които се подреждат според ритъм, сезон и преживяване.
              </li>
              <li>
                <Handshake size={22} aria-hidden="true" />
                Персонално обслужване преди, по време и след пътуването.
              </li>
              <li>
                <BadgeCheck size={22} aria-hidden="true" />
                Структура, която по-късно може да поддържа MyTrips, документи и ERP процеси.
              </li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

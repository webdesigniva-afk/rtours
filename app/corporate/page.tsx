import type { Metadata } from "next";
import { BriefcaseBusiness, CalendarCheck, UsersRound } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Корпоративни клиенти",
  description: "Фирмени събития, тиймбилдинги, incentive програми и корпоративни пътувания."
};

export default function CorporatePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <span className="eyebrow">RedTours за бизнеса</span>
          <h1>Корпоративни пътувания и събития с персонален сценарий</h1>
          <p>
            Отделно направление за фирмени клиенти: тиймбилдинги, incentive програми, събития,
            пътувания за екипи и специално подготвени предложения.
          </p>
        </section>

        <section className="section split-band">
          <div className="container split">
            <div>
              <span className="eyebrow">Фокус върху компании</span>
              <h2>Страница, която говори на бизнес клиента без да копира туристическия каталог.</h2>
              <p>
                Този раздел трябва да има собствена логика, отделни заявки и в бъдеще възможност
                за корпоративни профили с различни условия.
              </p>
            </div>
            <ul className="feature-list">
              <li>
                <BriefcaseBusiness size={22} aria-hidden="true" />
                Фирмени събития и incentive програми.
              </li>
              <li>
                <UsersRound size={22} aria-hidden="true" />
                Организация за групи, екипи и партньори.
              </li>
              <li>
                <CalendarCheck size={22} aria-hidden="true" />
                Индивидуални оферти според бюджет, срок и цел.
              </li>
            </ul>
          </div>
        </section>

        <section className="container section detail-grid">
          <div className="content-block">
            <h2>Какво трябва да покрива модулът</h2>
            <p>
              Първата версия представя услугите и събира запитвания. След уточняване на процесите
              може да се добавят корпоративни акаунти, отделни условия, вътрешна история на
              заявки и връзка с CRM.
            </p>
          </div>
          <aside className="info-panel">
            <h2>Корпоративно запитване</h2>
            <InquiryForm />
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

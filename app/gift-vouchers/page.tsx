import type { Metadata } from "next";
import { GiftVoucherBuilder } from "./GiftVoucherBuilder";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Подаръчни ваучери | Red Tours",
  description: "Подаръчни ваучери от Red Tours."
};

export default function GiftVouchersPage() {
  return (
    <>
      <SiteHeader />
      <main className="author-page gift-vouchers-page">
        <section className="author-hero gift-vouchers-hero">
          <div className="author-hero-video" aria-hidden="true">
            <img className="author-hero-video-item" src="/images/gift-vouchers/hero.png" alt="" />
          </div>
          <div className="container author-hero-grid">
            <div className="author-hero-copy">
              <PublicBreadcrumbs items={[{ label: "Пътувания", href: "/offers" }, { label: "Подаръчни ваучери" }]} />
              <h1>
                Подарете
                <span><em>пътуване.</em></span>
              </h1>
              <p><strong>Идеята е наша, изборът е Ваш.</strong></p>
              <p>
                Подарете не просто вещ, а очакване, избор и бъдещ спомен. Ваучерът от Red Tours може да бъде използван за избрано пътуване или като част от стойността на индивидуално създаден маршрут.
              </p>
            </div>

            <div className="author-hero-video-space" aria-hidden="true" />
          </div>
        </section>
        <GiftVoucherBuilder />
      </main>
      <SiteFooter />
    </>
  );
}

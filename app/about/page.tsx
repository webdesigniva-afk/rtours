import type { Metadata } from "next";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "За Red Tours",
  description: "Философия, подход и доверие зад пътуванията на Red Tours."
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
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
      </main>
      <SiteFooter />
    </>
  );
}

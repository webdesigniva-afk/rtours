import type { Metadata } from "next";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Блог",
  description: "Истории, идеи и пътеводители от Red Tours."
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <PublicBreadcrumbs items={[{ label: "Блог" }]} />
          <span className="eyebrow">Блог</span>
          <h1>Истории и идеи за следващото пътуване</h1>
          <p>
            Тук скоро ще събираме пътеводители, вдъхновение и практични съвети от екипа на Red Tours.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

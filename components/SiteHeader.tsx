"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Compass, Plane, Route, Sparkles, UserRound } from "lucide-react";

const travelMenuItems = [
  {
    label: "Авторски програми",
    text: "Маршрути, създадени от Red Tours с личен почерк.",
    icon: Compass
  },
  {
    label: "Екзотики",
    text: "Далечни посоки, ярки култури и внимателно темпо.",
    icon: Plane
  },
  {
    label: "Специални преживявания",
    text: "Пътувания с повече лично отношение и детайл.",
    icon: Sparkles
  },
  {
    label: "Tailor-made",
    text: "Вашата идея, превърната в цялостен маршрут.",
    icon: Route
  }
];

const navItems = [
  { href: "/#collections", label: "Red Collections", match: () => false },
  { href: "/about", label: "За Red Tours", match: (path: string) => path.startsWith("/about") },
  { href: "/contacts", label: "Контакти", match: (path: string) => path.startsWith("/contacts") },
  { href: "/blog", label: "Блог", match: (path: string) => path.startsWith("/blog") }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isTravelActive =
    pathname.startsWith("/offers") ||
    pathname.startsWith("/author-programs") ||
    pathname.startsWith("/destinations") ||
    pathname.startsWith("/tailor-made");

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 18);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="container nav-frame">
        <div className="nav">
          <Link className="brand" href="/" aria-label="RedTours начало">
            <span className="brand-logo-shell">
              <img src="/brand/logo.png" alt="RedTours" />
            </span>
          </Link>
          <nav className="nav-menu" aria-label="Основна навигация">
            <div className="nav-dropdown">
              <button
                className={isTravelActive ? "nav-link nav-dropdown-trigger is-active" : "nav-link nav-dropdown-trigger"}
                type="button"
              >
                Пътувания
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div className="nav-submenu" role="menu">
                {travelMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button className="nav-submenu-link" key={item.label} role="menuitem" type="button">
                      <span className="nav-submenu-icon">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <em>{item.text}</em>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
            {navItems.map((item) => {
              const active = item.match(pathname);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={active ? "nav-link is-active" : "nav-link"}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button className="nav-language-switch" type="button" aria-label="Смяна на езика">
            <span className="is-active">BG</span>
            <span>EN</span>
          </button>
          <div className="nav-actions" aria-label="Бързи действия">
            <span className="nav-icon-action" aria-disabled="true">
              <UserRound size={18} aria-hidden="true" />
              <span>MyTrips</span>
            </span>
            <Link className="nav-cta" href="/contacts#inquiry">
              Запитване
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

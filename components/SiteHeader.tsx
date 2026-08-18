"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Compass, Mountain, Music2, Plane, Route, Sparkles, Utensils, UsersRound, UserRound } from "lucide-react";

const travelMenuItems = [
  {
    href: "/author-programs",
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
    href: "/tailor-made",
    label: "Tailor-made",
    text: "Вашата идея, превърната в цялостен маршрут.",
    icon: Route
  }
];

const collectionMenuItems = [
  { href: "/offers?collection=red-icons", label: "Red Icons", text: "Места, които остават.", icon: Mountain },
  { href: "/offers?collection=red-hidden", label: "Red Hidden", text: "Отвъд очевидното.", icon: Compass },
  { href: "/offers?collection=red-taste", label: "Red Taste", text: "Светът има вкус.", icon: Utensils },
  { href: "/offers?collection=red-wild", label: "Red Wild", text: "По-близо до дивото.", icon: Mountain },
  { href: "/offers?collection=red-live", label: "Red Live", text: "Бъдете там, когато се случва.", icon: Music2 },
  { href: "/offers?collection=red-circle", label: "Red Circle", text: "По-малко хора. Повече преживяване.", icon: UsersRound }
];

const navItems = [
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
                  const itemContent = (
                    <>
                      <span className="nav-submenu-icon">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <em>{item.text}</em>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </>
                  );

                  return item.href ? (
                    <Link className="nav-submenu-link" href={item.href} key={item.label} role="menuitem">
                      {itemContent}
                    </Link>
                  ) : (
                    <button className="nav-submenu-link" key={item.label} role="menuitem" type="button">
                      {itemContent}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="nav-dropdown">
              <button className="nav-link nav-dropdown-trigger" type="button">
                Red Collections
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div className="nav-submenu" role="menu">
                {collectionMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link className="nav-submenu-link" href={item.href} key={item.href} role="menuitem">
                      <span className="nav-submenu-icon">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <em>{item.text}</em>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
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

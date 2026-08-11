"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";

const navItems = [
  { href: "/offers", label: "Пътувания", match: (path: string) => path.startsWith("/offers") },
  { href: "/destinations", label: "Дестинации", match: (path: string) => path.startsWith("/destinations") },
  { href: "/#collections", label: "Колекции", match: () => false },
  { href: "/corporate", label: "Корпоративни", match: (path: string) => path.startsWith("/corporate") },
  { href: "/about", label: "За нас", match: (path: string) => path.startsWith("/about") },
  { href: "/contacts", label: "Контакти", match: (path: string) => path.startsWith("/contacts") }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

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

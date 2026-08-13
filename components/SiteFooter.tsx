import Link from "next/link";
import { ArrowUpRight, Facebook, Instagram } from "lucide-react";

const footerLinks = [
  { href: "/offers", label: "Пътувания" },
  { href: "/offers?collection=red-signature", label: "Авторски програми" },
  { href: "/destinations?type=exotic", label: "Екзотики" },
  { href: "/offers?collection=red-private", label: "Специални преживявания" },
  { href: "/about", label: "За Red Tours" },
  { href: "/contacts", label: "Контакти" },
  { href: "/blog", label: "Блог" }
];

const socialLinks = [
  { href: "https://www.facebook.com/REDTOURSLtd/#", label: "Facebook", icon: Facebook },
  { href: "https://www.instagram.com/redtours_ltd", label: "Instagram", icon: Instagram },
  { href: "https://x.com/#!/REDTOURSLtd", label: "X", icon: ArrowUpRight }
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/brand/logo.png" alt="RedTours travel & events" />
          <p>
            Авторски пътувания, корпоративни програми и персонално обслужване с внимание
            към детайла.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <span>Навигация</span>
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="footer-proof">
          <span>Ред Турс ЕООД</span>
          <strong>Лицензиран туроператор</strong>
          <p>РК 01-6737 · Основана през 2011 · 3 офиса в България</p>
        </div>

        <div className="footer-social">
          <span>Последвайте RedTours</span>
          <div>
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} RedTours. Всички права запазени.</span>
          <a href="https://www.it-s.org" target="_blank" rel="noreferrer">
            Създава се от IT-S.org
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

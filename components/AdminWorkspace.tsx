"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Bus,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  Import,
  LogOut,
  Mail,
  Menu,
  Plane,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";

type AdminWorkspaceProps = {
  active: "dashboard" | "offers" | "imports";
  children: React.ReactNode;
};

type SidebarMode = "expanded" | "collapsed" | "hover";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  id?: AdminWorkspaceProps["active"];
  badge?: string;
  dot?: boolean;
};

const groups: Array<{ label: string; items: AdminNavItem[] }> = [
  {
    label: "Операции",
    items: [
      { href: "/admin", label: "Начало", icon: Home, id: "dashboard" },
      { href: "/admin/offers", label: "Резервации", icon: CalendarDays },
      { href: "/admin/offers", label: "Клиенти", icon: Users },
      { href: "/admin/offers", label: "Пътувания / програми", icon: Plane },
      { href: "/admin/offers", label: "Услуги", icon: BriefcaseBusiness },
      { href: "/admin/offers", label: "Групи и автобуси", icon: Bus }
    ]
  },
  {
    label: "Финанси",
    items: [
      { href: "/admin/offers", label: "Плащания", icon: WalletCards },
      { href: "/admin/offers", label: "Доставчици", icon: Archive },
      { href: "/admin/offers", label: "Документи", icon: FileText },
      { href: "/admin/offers", label: "Справки", icon: BarChart3 }
    ]
  },
  {
    label: "Комуникация",
    items: [
      { href: "/admin/offers", label: "Съобщения", icon: Mail, badge: "12" },
      { href: "/admin/offers", label: "Известия", icon: Bell, badge: "5" }
    ]
  },
  {
    label: "Съдържание",
    items: [
      { href: "/admin/offers", label: "Оферти", icon: ClipboardList, id: "offers" },
      { href: "/admin/offers", label: "Импорти", icon: Import, id: "imports", dot: true }
    ]
  },
  {
    label: "Система",
    items: [
      { href: "/admin/offers", label: "Настройки", icon: Settings },
      { href: "/admin/offers", label: "Потребители", icon: Users },
      { href: "/admin/offers", label: "Дневник на дейности", icon: ShieldCheck }
    ]
  }
];

export function AdminWorkspace({ active, children }: AdminWorkspaceProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const today = new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long"
  }).format(new Date());
  const isCollapsed = sidebarMode === "collapsed" || (sidebarMode === "hover" && !isSidebarHovered);

  useEffect(() => {
    const savedMode = window.localStorage.getItem("redtours_erp_sidebar_mode");

    if (savedMode === "expanded" || savedMode === "collapsed" || savedMode === "hover") {
      setSidebarMode(savedMode);
    }

    if (savedMode === "auto") {
      setSidebarMode("hover");
      window.localStorage.setItem("redtours_erp_sidebar_mode", "hover");
    }
  }, []);

  const setMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    window.localStorage.setItem("redtours_erp_sidebar_mode", mode);
  };

  const toggleSidebar = () => {
    setMode(isCollapsed ? "expanded" : "collapsed");
  };

  return (
    <main className={isCollapsed ? "erp-shell is-sidebar-collapsed" : "erp-shell"}>
      <aside
        className="erp-sidebar"
        aria-label="ERP навигация"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Link className="erp-logo" href="/admin">
          <img src="/brand/logo.png" alt="RedTours" />
          <em>ERP система</em>
        </Link>

        <nav className="erp-nav">
          {groups.map((group) => (
            <section key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === active;

                return (
                  <Link className={isActive ? "is-active" : ""} href={item.href} key={`${group.label}-${item.label}`}>
                    <Icon size={17} aria-hidden="true" />
                    <strong>{item.label}</strong>
                    {item.badge ? <em>{item.badge}</em> : null}
                    {item.dot ? <i aria-hidden="true" /> : null}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="erp-sidebar-options" aria-label="Поведение на навигацията">
          <button
            className={sidebarMode === "expanded" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("expanded")}
            title="Постоянно разгъната"
            data-tooltip="Постоянно разгъната"
            aria-label="Постоянно разгъната навигация"
          >
            <span aria-hidden="true" />
            <strong>Разгъната</strong>
          </button>
          <button
            className={sidebarMode === "collapsed" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("collapsed")}
            title="Постоянно свита"
            data-tooltip="Постоянно свита"
            aria-label="Постоянно свита навигация"
          >
            <span aria-hidden="true" />
            <strong>Свита</strong>
          </button>
          <button
            className={sidebarMode === "hover" ? "is-active" : ""}
            type="button"
            onClick={() => setMode("hover")}
            title="Разгъване при hover"
            data-tooltip="Разгъване при hover"
            aria-label="Разгъване при hover"
          >
            <span aria-hidden="true" />
            <strong>При hover</strong>
          </button>
        </div>

        <div className="erp-user">
          <span>ИП</span>
          <div>
            <strong>Ива Петрова</strong>
            <em>Администратор</em>
          </div>
        </div>
      </aside>

      <section className="erp-main">
        <header className="erp-topbar">
          <button type="button" aria-label={isCollapsed ? "Разгъни менюто" : "Свий менюто"} onClick={toggleSidebar}>
            <Menu size={22} aria-hidden="true" />
          </button>
          <label>
            <Search size={17} aria-hidden="true" />
            <input placeholder="Търсене в системата..." />
            <kbd>/</kbd>
          </label>
          <div className="erp-topbar-actions">
            <span>{today}</span>
            <Link href="/admin/offers">
              <CalendarDays size={17} aria-hidden="true" />
              Календар
            </Link>
            <form action={logoutAdmin}>
              <button type="submit" aria-label="Изход">
                <LogOut size={17} aria-hidden="true" />
              </button>
            </form>
          </div>
        </header>

        <div className="erp-content">{children}</div>
      </section>
    </main>
  );
}

import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  FilePlus2,
  Mail,
  Plane,
  Plus,
  Send,
  UploadCloud,
  Users,
  WalletCards
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { offerRepository } from "@/lib/offerRepository";

const metrics = [
  { label: "Нови запитвания", value: "7", delta: "+3 спрямо вчера", icon: Mail, tone: "red" },
  { label: "Чакат потвърждение", value: "4", delta: "-1 спрямо вчера", icon: AlertTriangle, tone: "orange" },
  { label: "Предстоящи плащания", value: "9", delta: "+2 спрямо вчера", icon: WalletCards, tone: "blue" },
  { label: "Пътувания тази седмица", value: "3", delta: "12 пътници", icon: BriefcaseBusiness, tone: "green" },
  { label: "Групи в движение", value: "2", delta: "86 пътници", icon: Users, tone: "purple" }
];

const attentionItems = [
  ["Резервация RT-2026-0182", "Малдиви · Иван Петров · 3 пътници", "Депозитът изтича днес", "red"],
  ["Резервация RT-2026-0171", "Мароко · Сем. Георгиеви · 2 пътници", "Чака потвърждение от хотел", "orange"],
  ["Група RTG-042", "Кападокия · 34 пътници", "3 липсващи декларации", "yellow"],
  ["Плащане по RT-2026-0145", "Италия · Мария Николова", "Вноска след 2 дни", "blue"],
  ["Импорт от Туроператор A", "12 нови оферти за преглед", "Необработени оферти", "blue"]
];

const trips = [
  ["12", "авг", "Малдиви", "RT-2026-0182 · 3 пътници", "Потвърдено", "12 - 20 авг 2026"],
  ["13", "авг", "Италия - Амалфийско крайбрежие", "RT-2026-0185 · 2 пътници", "Потвърдено", "13 - 20 авг 2026"],
  ["14", "авг", "Кападокия", "RTG-042 · 34 пътници", "В движение", "14 - 17 авг 2026"],
  ["16", "авг", "Мароко - имперски градове", "RT-2026-0187 · 2 пътници", "Потвърдено", "16 - 23 авг 2026"]
];

const reservations = [
  ["RT-2026-0188", "Даниела Стоянова", "Бали", "11.08.2026", "Нова"],
  ["RT-2026-0187", "Петър Димитров", "Мароко", "10.08.2026", "Потвърдена"],
  ["RT-2026-0186", "Сем. Иванови", "Тайланд", "10.08.2026", "Чака потв."],
  ["RT-2026-0185", "Мария Николова", "Италия", "09.08.2026", "Потвърдена"],
  ["RT-2026-0184", "Георги Петров", "Гърция", "09.08.2026", "Нова"]
];

const finance = [
  ["Продажби", "43 250 EUR", "+12%"],
  ["Събрани плащания", "18 740 EUR", "+8%"],
  ["Дължимо от клиенти", "62 310 EUR", "-5%"],
  ["Дължимо към доставчици", "34 880 EUR", "+3%"]
];

const quickActions = [
  ["Нова резервация", Plus],
  ["Нов клиент", Users],
  ["Нова оферта", FilePlus2],
  ["Качи документ", UploadCloud],
  ["Изпрати имейл", Send],
  ["Създай фактура", WalletCards],
  ["Нов импорт", Plane],
  ["Нова група", Users],
  ["Направи справка", BarChart3]
];

export default function AdminDashboardPage() {
  const statusSummary = offerRepository.getStatusSummary();
  const reviewCount = statusSummary.find((item) => item.status === "review")?.count || 0;

  return (
    <AdminWorkspace active="dashboard">
      <section className="erp-welcome">
        <div>
          <h1>Добро утро, Ива</h1>
          <p>Ето какво се случва днес в RedTours.</p>
        </div>
        <span>{reviewCount} оферти чакат преглед</span>
      </section>

      <section className="erp-metric-grid" aria-label="Ключови показатели">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className={`erp-metric-card erp-tone-${metric.tone}`} key={metric.label}>
              <span>
                <Icon size={23} aria-hidden="true" />
              </span>
              <div>
                <strong>{metric.value}</strong>
                <p>{metric.label}</p>
                <em>{metric.delta}</em>
              </div>
            </article>
          );
        })}
      </section>

      <section className="erp-dashboard-grid">
        <article className="erp-panel erp-attention-panel">
          <header>
            <h2>Изискват внимание</h2>
            <span>6</span>
          </header>
          <div>
            {attentionItems.map(([title, meta, action, tone]) => (
              <div className={`erp-attention-row erp-border-${tone}`} key={title}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <p>{meta}</p>
                </div>
                <em>{action}</em>
                <button type="button">Отвори</button>
              </div>
            ))}
          </div>
        </article>

        <article className="erp-panel erp-trips-panel">
          <header>
            <h2>Предстоящи пътувания</h2>
            <button type="button">Виж календар</button>
          </header>
          <div>
            {trips.map(([day, month, title, meta, status, date]) => (
              <div className="erp-trip-row" key={title}>
                <time>
                  <strong>{day}</strong>
                  <span>{month}</span>
                </time>
                <div className="erp-trip-thumb" />
                <div>
                  <strong>{title}</strong>
                  <p>{meta}</p>
                </div>
                <span>{status}</span>
                <em>{date}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="erp-panel erp-reservations-panel">
          <header>
            <h2>Последни резервации</h2>
            <button type="button">Виж всички</button>
          </header>
          <div className="erp-reservation-table">
            {reservations.map(([id, client, destination, date, status]) => (
              <div key={id}>
                <span>{id}</span>
                <strong>{client}</strong>
                <span>{destination}</span>
                <span>{date}</span>
                <em>{status}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="erp-panel erp-finance-panel">
          <header>
            <h2>Финансов обзор</h2>
            <button type="button">Тази седмица</button>
          </header>
          {finance.map(([label, value, delta]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <em>{delta}</em>
            </div>
          ))}
        </article>

        <article className="erp-panel erp-quick-panel">
          <header>
            <h2>Бързи действия</h2>
          </header>
          <div>
            {quickActions.map(([label, icon]) => {
              const Icon = icon as typeof Plus;

              return (
                <button type="button" key={label as string}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{label as string}</span>
                </button>
              );
            })}
          </div>
        </article>
      </section>
    </AdminWorkspace>
  );
}

import Link from "next/link";
import { CalendarDays, Clock3, DoorOpen, Mail, MapPin, MessageSquareText, Phone, UserRound, Users, WalletCards } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { updateInquiryStatus, updateInquiryWork } from "@/app/admin/inquiries/actions";
import { listAdminInquiries } from "@/lib/adminInquiryRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabels: Record<string, string> = {
  new: "Ново",
  contacted: "Свързан",
  offer_sent: "Изпратена оферта",
  option: "Опция",
  booked: "Резервирано",
  lost: "Загубен"
};

const pipeline = ["new", "contacted", "offer_sent", "option", "booked", "lost"];
const activePipeline = ["contacted", "offer_sent", "option", "booked", "lost"];

const roomLabels: Record<string, string> = {
  double: "Двойна стая",
  twin: "Twin стая",
  single: "Единична стая",
  triple: "Тройна стая",
  family: "Фамилна стая",
  to_confirm: "За уточняване"
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatFollowUp(value: string | null) {
  if (!value) return "Не е зададено";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "booked") return "is-booked";
  if (status === "lost") return "is-lost";
  if (status === "option" || status === "offer_sent") return "is-warm";
  if (status === "contacted") return "is-contacted";
  return "is-new";
}

export default async function AdminInquiriesPage() {
  const inquiries = await listAdminInquiries();
  const newCount = inquiries.filter((item) => item.status === "new").length;
  const activeCount = inquiries.filter((item) => !["booked", "lost"].includes(item.status)).length;
  const bookedCount = inquiries.filter((item) => item.status === "booked").length;
  const optionCount = inquiries.filter((item) => item.status === "option").length;
  const conversionRate = inquiries.length > 0 ? Math.round((bookedCount / inquiries.length) * 100) : 0;

  return (
    <AdminWorkspace active="inquiries">
      <section className="inquiries-page">
        <header className="inquiries-hero">
          <div>
            <span className="eyebrow">Website leads</span>
            <h1>Запитвания</h1>
            <p>Всяка заявка от сайта влиза като lead с оферта, отпътуване, хора, стая, бюджет, източник и pipeline статус.</p>
            <div className="lead-pipeline" aria-label="Lead pipeline">
              {pipeline.map((status) => (
                <span className={status === "lost" ? "is-lost" : ""} key={status}>{statusLabels[status]}</span>
              ))}
            </div>
          </div>
          <div className="inquiries-hero-stats" aria-label="Обобщение">
            <span><strong>{newCount}</strong> нови</span>
            <span><strong>{activeCount}</strong> активни</span>
            <span><strong>{optionCount}</strong> опции</span>
            <span><strong>{conversionRate}%</strong> conversion</span>
          </div>
        </header>

        {inquiries.length > 0 ? (
          <div className="inquiries-list">
            {inquiries.map((inquiry) => (
              <article className="inquiry-card" key={inquiry.id}>
                <div className="inquiry-main">
                  <div className="inquiry-card-topline">
                    <span className={`inquiry-status ${statusClass(inquiry.status)}`}>{statusLabels[inquiry.status] || inquiry.status}</span>
                    <time dateTime={inquiry.createdAt}>{formatDateTime(inquiry.createdAt)}</time>
                    {inquiry.leadSource ? <span className="inquiry-source">{inquiry.leadSource}</span> : null}
                    {inquiry.matchingContactsCount > 0 ? <span className="inquiry-source is-returning">повтарящ се контакт</span> : null}
                  </div>
                  <h2>{inquiry.offerTitle}</h2>
                  <div className="inquiry-meta">
                    <span><MapPin size={16} aria-hidden="true" />{inquiry.destination}</span>
                    <span><CalendarDays size={16} aria-hidden="true" />{inquiry.departure}</span>
                    <span>
                      <Users size={16} aria-hidden="true" />
                      {(inquiry.adults ?? 0) + (inquiry.children ?? 0) || inquiry.travelersCount || "-"} пътуващи
                      {inquiry.children ? `, ${inquiry.children} деца` : ""}
                    </span>
                    {inquiry.roomType ? <span><DoorOpen size={16} aria-hidden="true" />{roomLabels[inquiry.roomType] || inquiry.roomType}</span> : null}
                    {inquiry.budget ? <span><WalletCards size={16} aria-hidden="true" />{inquiry.budget}</span> : null}
                  </div>
                  {inquiry.notes ? <p>{inquiry.notes}</p> : null}
                  {inquiry.lostReason ? <p className="inquiry-lost-reason">Причина за загуба: {inquiry.lostReason}</p> : null}
                  {inquiry.internalNote ? <p className="inquiry-internal-note">Вътрешна бележка: {inquiry.internalNote}</p> : null}
                  <div className="inquiry-actions">
                    {inquiry.offerSlug ? (
                      <Link className="inquiry-offer-link" href={`/admin/offers/${inquiry.offerSlug}`}>
                        Отвори офертата
                      </Link>
                    ) : null}
                    {inquiry.sourcePage ? (
                      <Link className="inquiry-offer-link is-muted" href={inquiry.sourcePage}>
                        Източник
                      </Link>
                    ) : null}
                  </div>
                  <form className="inquiry-status-form is-compact" action={updateInquiryStatus}>
                    <input type="hidden" name="inquiry_id" value={inquiry.id} />
                    <div>
                      {activePipeline.map((status) => (
                        <button className={inquiry.status === status ? "is-active" : ""} type="submit" name="status" value={status} key={status}>
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>

                <aside className="inquiry-contact">
                  <span><UserRound size={16} aria-hidden="true" />{inquiry.contactName}</span>
                  <a href={`mailto:${inquiry.contactEmail}`}><Mail size={16} aria-hidden="true" />{inquiry.contactEmail}</a>
                  {inquiry.contactPhone ? <a href={`tel:${inquiry.contactPhone}`}><Phone size={16} aria-hidden="true" />{inquiry.contactPhone}</a> : null}
                  <span><Clock3 size={16} aria-hidden="true" />Следващо действие: {formatFollowUp(inquiry.nextActionAt)}</span>
                  <details className="inquiry-drawer">
                    <summary>CRM детайли</summary>
                    <form className="inquiry-status-form" action={updateInquiryStatus}>
                      <input type="hidden" name="inquiry_id" value={inquiry.id} />
                      <span>Бележка към статус</span>
                      <textarea name="note" placeholder="Какво се случи с lead-а" rows={2} />
                      <input name="lost_reason" placeholder="Причина, ако lead-ът е загубен" />
                      <div>
                        {activePipeline.map((status) => (
                          <button className={inquiry.status === status ? "is-active" : ""} type="submit" name="status" value={status} key={`${inquiry.id}-${status}-drawer`}>
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </form>
                    <form className="inquiry-work-form" action={updateInquiryWork}>
                      <input type="hidden" name="inquiry_id" value={inquiry.id} />
                      <label>
                        <span>Отговорник</span>
                        <input name="assigned_to_name" defaultValue={inquiry.assignedToName || ""} placeholder="Име от екипа" />
                      </label>
                      <label>
                        <span>Следващо действие</span>
                        <input name="next_action_at" type="datetime-local" />
                      </label>
                      <label>
                        <span>Вътрешна бележка</span>
                        <textarea name="internal_note" defaultValue={inquiry.internalNote || ""} rows={3} placeholder="Контекст за екипа" />
                      </label>
                      <button type="submit">Запази CRM данни</button>
                    </form>
                  </details>
                </aside>
              </article>
            ))}
          </div>
        ) : (
          <section className="inquiries-empty">
            <MessageSquareText size={34} aria-hidden="true" />
            <h2>Все още няма запитвания</h2>
            <p>Публичната форма на офертата вече ще създава lead записи тук автоматично.</p>
            <Link href="/offers/yaponiya-sakura-red-signature-2027">Отвори тестовата оферта</Link>
          </section>
        )}
      </section>
    </AdminWorkspace>
  );
}

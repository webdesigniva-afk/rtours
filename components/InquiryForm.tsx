"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitInquiry } from "@/app/inquiries/actions";

type InquiryFormProps = {
  offerTitle?: string;
  offerSlug?: string;
  destination?: string;
  dates?: Array<{ label: string; startDate?: string }>;
};

export function InquiryForm({ offerTitle, offerSlug, destination, dates = [] }: InquiryFormProps) {
  const [state, action, isPending] = useActionState(submitInquiry, { ok: false, message: "" });
  const defaultDeparture = dates[0]?.label || dates[0]?.startDate || "";

  return (
    <form className="inquiry-form" action={action}>
      <input type="hidden" name="offer_slug" value={offerSlug || ""} />
      <input type="hidden" name="offer_title" value={offerTitle || ""} />
      {destination ? <input type="hidden" name="destination" value={destination} /> : null}
      <input type="hidden" name="lead_source" value={offerSlug ? "website_offer" : "website_general"} />
      {offerTitle ? <input name="offer_display" value={offerTitle} readOnly aria-label="Оферта" /> : null}
      {!destination ? <input name="destination" placeholder="Дестинация" /> : null}
      {dates.length > 0 ? (
        <select name="departure" defaultValue={defaultDeparture} aria-label="Отпътуване">
          {dates.map((date) => (
            <option value={date.label || date.startDate || ""} key={date.label || date.startDate}>
              {date.label || date.startDate}
            </option>
          ))}
        </select>
      ) : (
        <input name="departure" placeholder="Желана дата / период" />
      )}
      <div className="inquiry-form-grid">
        <label>
          <span>Възрастни</span>
          <input name="adults" type="number" min="1" defaultValue="2" inputMode="numeric" />
        </label>
        <label>
          <span>Деца</span>
          <input name="children" type="number" min="0" defaultValue="0" inputMode="numeric" />
        </label>
      </div>
      <select name="room_type" defaultValue="">
        <option value="">Тип стая</option>
        <option value="double">Двойна стая</option>
        <option value="twin">Twin стая</option>
        <option value="single">Единична стая</option>
        <option value="triple">Тройна стая</option>
        <option value="family">Фамилна стая</option>
        <option value="to_confirm">Да уточним</option>
      </select>
      <input name="budget" placeholder="Ориентировъчен бюджет" />
      <input name="name" placeholder="Име и фамилия" autoComplete="name" required />
      <input name="email" placeholder="Имейл" type="email" autoComplete="email" required />
      <input name="phone" placeholder="Телефон" autoComplete="tel" />
      <textarea name="message" placeholder="Въпрос, предпочитания или специални изисквания" rows={5} />
      {state.message ? <p className={state.ok ? "inquiry-form-message is-ok" : "inquiry-form-message is-error"}>{state.message}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        <Send size={17} aria-hidden="true" />
        {isPending ? "Изпращане..." : "Изпрати запитване"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitInquiry } from "@/app/inquiries/actions";
import { formatDisplayDate } from "@/lib/dateFormat";

type InquiryFormProps = {
  offerTitle?: string;
  offerSlug?: string;
  destination?: string;
  dates?: Array<{ label: string; startDate?: string }>;
};

export function InquiryForm({ offerTitle, offerSlug, destination, dates = [] }: InquiryFormProps) {
  const [state, action, isPending] = useActionState(submitInquiry, { ok: false, message: "" });
  const displayDates = dates.map((date) => ({
    value: date.label || formatDisplayDate(date.startDate),
    label: date.label || formatDisplayDate(date.startDate)
  })).filter((date) => date.value || date.label);
  const defaultDeparture = displayDates[0]?.value || "";

  return (
    <form className="inquiry-form" action={action}>
      <input type="hidden" name="offer_slug" value={offerSlug || ""} />
      <input type="hidden" name="offer_title" value={offerTitle || ""} />
      {destination ? <input type="hidden" name="destination" value={destination} /> : null}
      <input type="hidden" name="lead_source" value={offerSlug ? "website_offer" : "website_general"} />

      {offerTitle ? (
        <div className="inquiry-form-offer">
          <span>Запитване за</span>
          <strong>{offerTitle}</strong>
        </div>
      ) : null}

      <div className="inquiry-form-section">
        {!destination ? (
          <label className="inquiry-field is-wide">
            <span>Дестинация</span>
            <input name="destination" placeholder="Напр. Япония, Италия, Малдиви" />
          </label>
        ) : null}

        <label className="inquiry-field is-wide">
          <span>Отпътуване</span>
          {displayDates.length > 0 ? (
            <select name="departure" defaultValue={defaultDeparture}>
              {displayDates.map((date) => (
                <option value={date.value} key={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          ) : (
            <input name="departure" placeholder="Желана дата или период" />
          )}
        </label>

        <label className="inquiry-field">
          <span>Възрастни</span>
          <input name="adults" type="number" min="1" defaultValue="2" inputMode="numeric" />
        </label>

        <label className="inquiry-field">
          <span>Деца</span>
          <input name="children" type="number" min="0" defaultValue="0" inputMode="numeric" />
        </label>

        <label className="inquiry-field">
          <span>Стая</span>
          <select name="room_type" defaultValue="">
            <option value="">Да уточним</option>
            <option value="double">Двойна стая</option>
            <option value="twin">Twin стая</option>
            <option value="single">Единична стая</option>
            <option value="triple">Тройна стая</option>
            <option value="family">Фамилна стая</option>
            <option value="to_confirm">По препоръка</option>
          </select>
        </label>

        <label className="inquiry-field">
          <span>Бюджет</span>
          <input name="budget" placeholder="По желание" />
        </label>
      </div>

      <div className="inquiry-form-section">
        <label className="inquiry-field">
          <span>Име</span>
          <input name="name" placeholder="Име и фамилия" autoComplete="name" required />
        </label>

        <label className="inquiry-field">
          <span>Имейл</span>
          <input name="email" placeholder="name@example.com" type="email" autoComplete="email" required />
        </label>

        <label className="inquiry-field is-wide">
          <span>Телефон</span>
          <input name="phone" placeholder="+359" autoComplete="tel" />
        </label>

        <label className="inquiry-field is-wide">
          <span>Съобщение</span>
          <textarea name="message" placeholder="Предпочитания, въпроси или специални изисквания" rows={4} />
        </label>
      </div>

      <label className="inquiry-form-privacy">
        <input name="privacy_policy" required type="checkbox" value="accepted" />
        <span>
          Съгласен/на съм с <strong>Политиката за поверителност</strong> и обработка на лични данни.
        </span>
      </label>

      {state.message ? <p className={state.ok ? "inquiry-form-message is-ok" : "inquiry-form-message is-error"}>{state.message}</p> : null}

      <button className="button inquiry-submit" type="submit" disabled={isPending}>
        <Send size={17} aria-hidden="true" />
        {isPending ? "Изпращане..." : "Изпрати запитване"}
      </button>
    </form>
  );
}

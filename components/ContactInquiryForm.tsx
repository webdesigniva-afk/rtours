"use client";

import { useActionState, useState } from "react";
import { ArrowRight, BriefcaseBusiness, MessageCircle, MessagesSquare } from "lucide-react";
import { submitInquiry } from "@/app/inquiries/actions";

const topics = [
  {
    value: "Въпрос за пътуване",
    label: "Имам въпрос за пътуване",
    icon: MessageCircle
  },
  {
    value: "Индивидуален маршрут",
    label: "Искам индивидуален маршрут",
    icon: BriefcaseBusiness
  },
  {
    value: "Друго",
    label: "Друго",
    icon: MessagesSquare
  }
];

export function ContactInquiryForm() {
  const [state, action, isPending] = useActionState(submitInquiry, { ok: false, message: "" });
  const [topic, setTopic] = useState(topics[0].value);

  return (
    <form className="contact-page-form" action={action}>
      <input type="hidden" name="lead_source" value="website_contact_page" />
      <input type="hidden" name="destination" value={topic} />

      <div className="contact-topic-grid" role="radiogroup" aria-label="Тема на разговора">
        {topics.map(({ value, label, icon: Icon }) => (
          <label className={topic === value ? "is-selected" : ""} key={value}>
            <input
              checked={topic === value}
              name="contact_topic"
              onChange={() => setTopic(value)}
              type="radio"
              value={value}
            />
            <Icon size={32} aria-hidden="true" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="contact-field-grid">
        <label>
          <span>Име и фамилия *</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>Email *</span>
          <input name="email" autoComplete="email" type="email" required />
        </label>
        <label>
          <span>Телефон *</span>
          <input name="phone" autoComplete="tel" type="tel" required />
        </label>
        <fieldset>
          <legend>Как предпочитате да се свържем? *</legend>
          <label>
            <input name="preferred_contact" type="radio" value="Телефон" required />
            Телефон
          </label>
          <label>
            <input name="preferred_contact" type="radio" value="Email" />
            Email
          </label>
        </fieldset>
        <label className="is-wide">
          <span>Съобщение *</span>
          <textarea name="message" required rows={4} />
        </label>
      </div>

      <label className="contact-privacy-check">
        <input name="privacy_policy" required type="checkbox" value="accepted" />
        <span>
          Съгласен/на съм с <strong>Политиката за поверителност</strong> *
        </span>
      </label>

      {state.message ? <p className={state.ok ? "contact-form-message is-ok" : "contact-form-message is-error"}>{state.message}</p> : null}

      <button className="contact-submit" type="submit" disabled={isPending}>
        {isPending ? "Изпращане..." : "Изпратете"}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}

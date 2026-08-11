import { Send } from "lucide-react";

export function InquiryForm({ offerTitle }: { offerTitle?: string }) {
  return (
    <form className="inquiry-form">
      {offerTitle ? <input name="offer" value={offerTitle} readOnly aria-label="Оферта" /> : null}
      <input name="name" placeholder="Име и фамилия" autoComplete="name" />
      <input name="email" placeholder="Имейл" type="email" autoComplete="email" />
      <input name="phone" placeholder="Телефон" autoComplete="tel" />
      <select name="travelers" defaultValue="">
        <option value="" disabled>
          Брой пътуващи
        </option>
        <option>1</option>
        <option>2</option>
        <option>3-4</option>
        <option>5+</option>
      </select>
      <textarea name="message" placeholder="Въпрос, предпочитани дати или специални изисквания" rows={5} />
      <button className="button" type="submit">
        <Send size={17} aria-hidden="true" />
        Изпрати запитване
      </button>
    </form>
  );
}


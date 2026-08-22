"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setState("error");
      setMessage("Моля, въведете имейл адрес.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, source: "footer" })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Не успяхме да запишем абонамента.");
      }

      setEmail("");
      setState("success");
      setMessage(payload.message || "Благодарим! Абонаментът е записан.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Възникна грешка. Опитайте отново.");
    }
  }

  return (
    <form className="footer-newsletter-form" onSubmit={handleSubmit}>
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Имейл за newsletter
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Вашият имейл"
        autoComplete="email"
        required
      />
      <button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Записване..." : "Абонирайте се"}
        <Send size={15} aria-hidden="true" />
      </button>
      {message ? (
        <p className={`footer-newsletter-message is-${state}`} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

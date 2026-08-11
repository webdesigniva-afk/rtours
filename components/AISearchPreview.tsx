"use client";

import { ArrowRight, Search, Sparkles, X } from "lucide-react";

const promptIdeas = [
  "Почивка за двама през септември",
  "Семейно пътуване без много бързане",
  "Корпоративно пътуване за екип",
  "Нещо екзотично до 2500 EUR"
];

export function AISearchPreview({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-search-overlay" role="dialog" aria-modal="true" aria-label="AI търсене">
      <button className="ai-search-backdrop" type="button" aria-label="Затвори AI търсенето" onClick={onClose} />
      <section className="ai-search-panel">
        <button className="ai-search-close" type="button" aria-label="Затвори" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
        <div className="ai-search-header">
          <span className="eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            AI Travel Concierge
          </span>
          <h2>Опишете пътуването. RedTours ще подреди най-подходящите идеи.</h2>
          <p>
            В следваща стъпка търсенето ще разпознава стил, бюджет, период, повод и тип
            пътуване, за да предлага по-точни програми и индивидуални запитвания.
          </p>
        </div>

        <div className="ai-search-box">
          <Search size={20} aria-hidden="true" />
          <input
            disabled
            placeholder="Например: искам романтично пътуване през октомври до 1500 евро..."
          />
          <button type="button" disabled>
            Скоро
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="ai-prompt-grid" aria-label="Примерни AI заявки">
          {promptIdeas.map((prompt) => (
            <button type="button" disabled key={prompt}>
              {prompt}
            </button>
          ))}
        </div>

        <div className="ai-search-preview-card">
          <span>Примерен резултат</span>
          <strong>3 предложения по стил + 1 уточняващ въпрос</strong>
          <p>AI търсенето няма да измисля оферти, а ще подбира от реалните RedTours програми.</p>
        </div>
      </section>
    </div>
  );
}

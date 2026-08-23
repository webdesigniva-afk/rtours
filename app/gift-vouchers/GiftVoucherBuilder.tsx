"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Compass, Euro, FileCheck2, ImageUp, LockKeyhole, Mail, PenLine, RotateCcw, Send, UserRound } from "lucide-react";

const voucherAmounts = [100, 200, 300, 500];
const recipientNameMaxLength = 28;
const messageMaxLength = 90;
const voucherImageMaxSizeMb = 5;
const voucherImageMaxSizeBytes = voucherImageMaxSizeMb * 1024 * 1024;

const voucherDesigns = [
  {
    id: "classic",
    label: "Red Horizon",
    background: "radial-gradient(circle at 76% 18%, rgba(255,255,255,0.95) 0 10%, transparent 30%), linear-gradient(135deg, #fff8f6 0%, #ffffff 42%, #f7d8d4 64%, #b92f35 100%)",
    position: "center",
    accent: "#bb3334",
    template: "signature"
  },
  {
    id: "light",
    label: "Paper Route",
    background: "linear-gradient(118deg, #ffffff 0%, #ffffff 48%, #f3e7da 48.2%, #dfc8b1 100%)",
    position: "center",
    accent: "#a93435",
    template: "editorial"
  },
  {
    id: "contrast",
    label: "Ribbon",
    background: "radial-gradient(circle at 82% 18%, rgba(238,51,56,0.16), transparent 28%), linear-gradient(135deg, #ffffff 0%, #fbf7f4 54%, #f0ddd7 100%)",
    position: "center",
    accent: "#b23a3b",
    template: "noir"
  }
];

const howItWorksSteps = [
  {
    number: "01",
    title: "Изберете стойност",
    text: "Посочете желаната стойност на ваучера.",
    icon: Euro
  },
  {
    number: "02",
    title: "Добавете лично послание",
    text: "Направете подаръка още по-личен с кратко пожелание.",
    icon: PenLine
  },
  {
    number: "03",
    title: "Получете ваучера",
    text: "Ще подготвим персонализиран ваучер и ще уточним начина на получаване.",
    icon: FileCheck2
  },
  {
    number: "04",
    title: "Подарете свободата на избора",
    text: "Получателят се свързва с нас, за да избере подходящото пътуване.",
    icon: Compass
  }
];

const importantInfoItems = [
  "Валидност: 12 месеца от датата на издаване.",
  "Ваучерът може да бъде използван при условията, описани в него.",
  "Ако стойността на пътуването е по-висока, разликата може да бъде доплатена.",
  "Условията за промяна, прехвърляне и анулация трябва да бъдат потвърдени от Red Tours."
];

const voucherFaqItems = [
  {
    question: "За какви пътувания може да се използва ваучерът?",
    answer: "Ваучерът може да се използва за избрано пътуване на Red Tours или като част от стойността на индивидуално създаден маршрут."
  },
  {
    question: "Може ли да бъде прехвърлен на друго лице?",
    answer: "Да, когато условията на конкретния ваучер го позволяват и промяната е потвърдена от Red Tours."
  },
  {
    question: "Може ли да бъде заменен за парична стойност?",
    answer: "Не, ваучерът не се заменя за пари. Той се използва за пътувания и услуги, организирани от Red Tours."
  },
  {
    question: "Как се използва ваучерът?",
    answer: "Получателят се свързва с нас, посочва номера на ваучера и избира подходящо пътуване или индивидуален маршрут."
  },
  {
    question: "Какъв е срокът за валидност?",
    answer: "Стандартната валидност е 12 месеца от датата на издаване, освен ако във ваучера не е посочено друго."
  }
];

type DeliveryMethod = "self" | "recipient";

export function GiftVoucherBuilder() {
  const [amount, setAmount] = useState(300);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(voucherDesigns[0].id);
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("self");
  const [customAmountFocused, setCustomAmountFocused] = useState(false);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [imageUploadError, setImageUploadError] = useState("");
  const customImageUrls = useRef<string[]>([]);

  const design = useMemo(
    () => voucherDesigns.find((item) => item.id === selectedDesign) ?? voucherDesigns[0],
    [selectedDesign]
  );
  const previewBackground = customImages[selectedDesign] ? `url(${customImages[selectedDesign]})` : design.background;
  const displayAmount = customAmount ? Number(customAmount) || amount : amount;
  const messageLength = message.length;
  const hasCustomImage = Boolean(customImages[selectedDesign]);
  const recipientPreviewClass = recipientName.length > 22 ? "gift-preview-recipient is-long" : "gift-preview-recipient";
  const messagePreviewClass = message.length > 64 ? "gift-preview-message is-long" : "gift-preview-message";

  useEffect(() => {
    return () => {
      customImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleCustomImageUpload(file: File | undefined) {
    setImageUploadError("");

    if (!file) return;

    if (file.size > voucherImageMaxSizeBytes) {
      setImageUploadError(`Снимката трябва да бъде до ${voucherImageMaxSizeMb} MB.`);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageUploadError("Поддържаме JPG, PNG или WebP файл.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    customImageUrls.current.push(imageUrl);

    setCustomImages((current) => {
      if (current[selectedDesign]) URL.revokeObjectURL(current[selectedDesign]);
      return { ...current, [selectedDesign]: imageUrl };
    });
  }

  function resetCustomImageForDesign() {
    setImageUploadError("");
    setCustomImages((current) => {
      if (!current[selectedDesign]) return current;

      URL.revokeObjectURL(current[selectedDesign]);
      const nextImages = { ...current };
      delete nextImages[selectedDesign];
      return nextImages;
    });
  }

  return (
    <section className="gift-builder-section" aria-labelledby="gift-builder-title">
      <div className="container">
        <div className="gift-builder-shell">
          <div className="gift-builder-form">
            <h2 id="gift-builder-title">Създайте своя ваучер</h2>

            <div className="gift-step">
              <span className="gift-step-number">1</span>
              <div className="gift-step-content">
                <h3>Стойност на ваучера</h3>
                <div className="gift-amount-grid" role="radiogroup" aria-label="Стойност на ваучера">
                  {voucherAmounts.map((value) => (
                    <button
                      className={displayAmount === value && !customAmount ? "is-selected" : ""}
                      key={value}
                      onClick={() => {
                        setAmount(value);
                        setCustomAmount("");
                      }}
                      type="button"
                    >
                      {value} €
                    </button>
                  ))}
                  <label className={customAmount ? "gift-custom-amount is-selected" : "gift-custom-amount"}>
                    <span className="sr-only">Друга сума</span>
                    <input
                      inputMode="numeric"
                      min="1"
                      onBlur={() => setCustomAmountFocused(false)}
                      onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d]/g, ""))}
                      onFocus={() => setCustomAmountFocused(true)}
                      placeholder={customAmountFocused ? "Въведи" : "Друга сума"}
                      type="text"
                      value={customAmount}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="gift-step">
              <span className="gift-step-number">2</span>
              <div className="gift-step-content">
                <h3>Изберете дизайн</h3>
                <div className="gift-design-grid" role="radiogroup" aria-label="Дизайн на ваучера">
                  {voucherDesigns.map((item) => (
                    <button
                      aria-checked={selectedDesign === item.id}
                      className={selectedDesign === item.id ? `gift-design-option gift-design-${item.template} is-selected` : `gift-design-option gift-design-${item.template}`}
                      key={item.id}
                      onClick={() => setSelectedDesign(item.id)}
                      role="radio"
                      style={{ "--voucher-image": customImages[item.id] ? `url(${customImages[item.id]})` : item.background, "--voucher-position": item.position, "--voucher-accent": item.accent } as CSSProperties}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <CheckCircle2 size={18} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <label className={hasCustomImage ? "gift-upload-panel has-custom-image" : "gift-upload-panel"}>
                  <span className="gift-upload-icon"><ImageUp size={18} aria-hidden="true" /></span>
                  <span>
                    <strong>{hasCustomImage ? "Сменете снимката" : "Качете снимка за избрания дизайн"}</strong>
                    <em>Препоръчителен размер: 2400 x 1700 px. JPG, PNG или WebP до {voucherImageMaxSizeMb} MB.</em>
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleCustomImageUpload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {hasCustomImage ? (
                  <div className="gift-upload-actions">
                    <span><CheckCircle2 size={15} aria-hidden="true" /> Използвате качена снимка за този дизайн.</span>
                    <button onClick={resetCustomImageForDesign} type="button">
                      <RotateCcw size={14} aria-hidden="true" />
                      Върни дефолт
                    </button>
                  </div>
                ) : null}
                {imageUploadError ? <p className="gift-upload-error">{imageUploadError}</p> : null}
              </div>
            </div>

            <div className="gift-step">
              <span className="gift-step-number">3</span>
              <div className="gift-step-content">
                <h3>За кого е ваучерът?</h3>
                <label className="gift-input">
                  <span className="sr-only">Име на получателя</span>
                  <input
                    maxLength={recipientNameMaxLength}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="Име на получателя"
                    value={recipientName}
                  />
                  <UserRound size={18} aria-hidden="true" />
                </label>
                <label className="gift-textarea">
                  <span>Лично послание <em>(по желание)</em></span>
                  <textarea
                    maxLength={messageMaxLength}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={"Напишете кратко лично послание..."}
                    value={message}
                  />
                  <small>{messageLength} / {messageMaxLength}</small>
                </label>
              </div>
            </div>

            <div className="gift-step">
              <span className="gift-step-number">4</span>
              <div className="gift-step-content">
                <h3>Как искате да подарите ваучера?</h3>
                <div className="gift-delivery-grid" role="radiogroup" aria-label="Начин на изпращане">
                  <button
                    aria-checked={deliveryMethod === "self"}
                    className={deliveryMethod === "self" ? "gift-delivery-card is-selected" : "gift-delivery-card"}
                    onClick={() => setDeliveryMethod("self")}
                    role="radio"
                    type="button"
                  >
                    <span className="gift-radio-dot" />
                    <span>
                      <strong>Изпратете на мен</strong>
                      <em>Ще получите PDF ваучера на своя имейл.</em>
                    </span>
                    <Mail size={34} aria-hidden="true" />
                  </button>
                  <button
                    aria-checked={deliveryMethod === "recipient"}
                    className={deliveryMethod === "recipient" ? "gift-delivery-card is-selected" : "gift-delivery-card"}
                    onClick={() => setDeliveryMethod("recipient")}
                    role="radio"
                    type="button"
                  >
                    <span className="gift-radio-dot" />
                    <span>
                      <strong>Изпратете директно като подарък</strong>
                      <em>Ние ще го изпратим на получателя на избраната от Вас дата.</em>
                    </span>
                    <Send size={34} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="gift-builder-preview" aria-label="Преглед на ваучера">
            <div
              className={hasCustomImage ? `gift-voucher-preview-card gift-voucher-${design.template} has-custom-image` : `gift-voucher-preview-card gift-voucher-${design.template}`}
              style={{ "--voucher-image": previewBackground, "--voucher-position": design.position, "--voucher-accent": design.accent } as CSSProperties}
            >
              <span className="gift-preview-ribbon" aria-hidden="true" />
              <img className="gift-preview-logo" src="/images/brand/redtours-travel-events-logo.png" alt="Red Tours travel & events" />
              <div className="gift-preview-content">
                <span>Подарък за</span>
                <h3>ново пътуване</h3>
                <p className={recipientPreviewClass}>За: <strong>{recipientName || "Вашият получател"}</strong></p>
                <p className="gift-preview-amount">{displayAmount || 300} €</p>
                <p className={messagePreviewClass}>{message || "Вашето лично послание ще се появи тук."}</p>
              </div>
            </div>

            <div className="gift-preview-note">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Ще получите PDF ваучера веднага след плащане.</span>
            </div>

            <div className="gift-payment-fields">
              <label>
                <span>Вашият имейл</span>
                <input placeholder="email@example.com" type="email" />
              </label>
              <label>
                <span>Дата на изпращане <em>(по желание)</em></span>
                <span className="gift-date-field">
                  <input type="text" placeholder="Изберете дата" />
                  <CalendarDays size={18} aria-hidden="true" />
                </span>
              </label>
            </div>
          </aside>

          <div className="gift-builder-footer">
            <p><LockKeyhole size={16} aria-hidden="true" /> Продължавайки, се съгласявате с нашите Общи условия и Политика за поверителност.</p>
            <button type="button">Продължи към плащане <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <section className="gift-how-section" aria-labelledby="gift-how-title">
          <h2 id="gift-how-title">Как работи?</h2>
          <div className="gift-how-steps">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article className="gift-how-step" key={step.number}>
                  <div className="gift-how-icon">
                    <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="gift-info-section" aria-label="Важна информация за ваучерите">
          <div className="gift-info-card">
            <h2>Важна информация</h2>
            <ul>
              {importantInfoItems.map((item) => (
                <li key={item}><CheckCircle2 size={16} aria-hidden="true" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="gift-faq-list">
            {voucherFaqItems.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

# RedTours Premium Design Rationale v1

## Design Intent

The RedTours website should feel like a premium travel atelier, not a generic tour catalog. The visual system must communicate confidence, curation, personal attention, and high operational standards.

The main impression should be:

- carefully selected;
- editorial;
- calm and expensive;
- human, but precise;
- modern for 2026 without relying on short-lived visual trends.

## Typography

The current direction uses Manrope as the primary type family across interface, navigation, forms, buttons, metadata, body text, and major headings.

### Why This Pairing

Manrope gives the product clarity and contemporary precision. It reads well in Bulgarian, works for dense UI, and does not feel overly decorative. This is important because the platform is not only a brochure site; it must eventually support search, admin, client profiles, ERP screens, and operational workflows.

The premium effect should come from proportion, spacing, image direction, hierarchy, and restraint rather than from ornate display typography. This is especially important in Cyrillic, where some luxury serif fonts can become theatrical or difficult to read at very large sizes.

### Typography Rules

- Interface text must remain clear, compact, and highly readable.
- Large headings should be confident, controlled, and modern.
- Headline scale should be generous on premium brand sections and tighter on utility pages.
- Letter spacing should be controlled. Small uppercase labels can use spacing; body text and headings should not.

## Color Palette

The palette is intentionally not pure white plus bright red. That would feel too basic and commercial. Instead, the system uses warm ivory, deep red, dark ink, muted earth tones, and restrained gold accents.

### Core Colors

- Deep Red: brand energy, action, confidence, RedTours recognition.
- Ivory/Paper: warmth, refinement, and a more tactile editorial background.
- Ink/Night: premium contrast and seriousness.
- Muted Earth: secondary text, borders, and quiet UI structure.
- Gold Accent: sparingly used to suggest quality, not decoration.

### Why Warm Neutrals

Travel is emotional and visual. A cold white/gray interface makes the site feel operational, not premium. Warm neutral surfaces create a softer, more considered environment for photography and editorial content.

### Color Rules

- Red is for brand signals and primary actions, not for flooding the page.
- Gold is an accent, never a dominant color.
- Dark sections should be used to create rhythm and authority.
- Backgrounds should feel layered and tactile, but never visually noisy.
- Offer content must remain readable above all.

## Layout And Spacing

Premium websites feel expensive partly because they are not afraid of space. Dense layouts can work for admin tools, but the public website should use deliberate breathing room.

### Spacing Principles

- Larger vertical sections create editorial pacing.
- Cards should not crowd each other.
- Important headings need enough space to feel intentional.
- Utility controls such as filters must stay compact and predictable.
- Mobile layouts must preserve hierarchy without becoming oversized.

## Signature Layer

The homepage includes a signature layer immediately after the hero. This is not a generic feature row. Its role is to translate the RedTours service promise into three concise proof points: selection, rhythm, and care.

### Why It Exists

- It bridges the emotional hero and the practical offer discovery sections.
- It explains what makes the company boutique before the user starts browsing offers.
- It supports the premium positioning without adding long explanatory text.
- It gives the page a designed editorial moment that feels intentional and ownable.

### Rules

- Keep the statements short and service-oriented.
- Avoid technical or operational language in this layer.
- Use subtle glass/surface treatment so it feels connected to the floating navigation.
- Do not turn this into a large marketing card section.
- Prefer restrained numbering over generic feature icons; this makes the block feel more editorial and less template-driven.

## Cards And Surfaces

Cards currently use very small radius values and deeper, soft shadows. This avoids the common rounded SaaS-card look and creates a more mature editorial feel.

### Why Small Radius

Large rounded corners often make travel websites feel playful or template-based. Small radius values feel more architectural and confident.

### Rules

- Offer cards can be used for repeated items.
- Page sections should not be placed inside large floating cards.
- Image-first cards are preferred for travel content.
- Text hierarchy inside cards must remain compact and strong.

## Photography Direction

Photography is central to the premium feeling. The site should eventually use RedTours' own real images wherever possible.

### Image Rules

- Prefer real destination, hotel, group, food, and experience images.
- Avoid generic atmospheric stock images when users need to understand the actual product.
- Hero media should be immersive and emotionally clear.
- Image cropping must preserve the subject and avoid making destinations feel anonymous.
- Use consistent contrast treatment so white text remains readable.

## Hero Media Direction

The homepage hero is prepared for a cinematic background video. Until the final video is available, a high-quality still image is used as a fallback.

### Why Video Fits Here

- RedTours sells atmosphere and trust, not only itinerary data.
- A carefully edited video can communicate rhythm, care, destinations, people, and detail faster than text.
- The first viewport should feel like a premium travel film opening, while still keeping navigation and calls to action clear.

### Video Rules

- Use slow, stable shots rather than fast montage.
- Prioritize real RedTours material when available.
- Avoid overly dark, generic, or anonymous stock footage.
- Keep contrast overlays subtle enough to preserve the image, but strong enough for text readability.
- The video must be muted, looped, optimized, and have a still fallback image.
- Motion should not distract from the inquiry path.

## Brand Message

RedTours already uses the idea that anyone can sell a trip, but few can create a memory that lasts. This should become a core public-facing message because it moves the brand away from commodity travel sales and toward curated experience design.

### Application

- The homepage hero should lead with memory, emotion, and long-term value.
- Service categories such as excursions, holidays, corporate travel, hotels, and flights should appear as supporting capabilities, not as the main emotional headline.
- The tone should remain Bulgarian, clear, and premium; avoid unnecessary English phrases unless they are part of an actual product name.

## Navigation

Navigation should feel simple and assured. The user must quickly understand where to go without being overwhelmed by every future module.

### Current Direction

- Primary public paths: travel offers, collections, corporate clients, brand trust.
- Search is visible as a key action.
- MyTrips is present as a future product signal, but should not dominate until implemented.
- The original RedTours logo should be used as the primary brand anchor, with controlled clear space and fixed display dimensions.
- Avoid placing the logo inside visually noisy backgrounds or next to competing decorative marks.

### Premium Navigation Rationale

- The navigation is floating because the first impression should feel custom and cinematic rather than like a standard website bar.
- The outer glass container frames the whole experience; individual menu items remain light so the header does not become a heavy app control.
- Active states use a quiet ivory pill and fine red line to guide orientation without visual noise.
- Search and MyTrips are secondary utilities. They are visible, but quieter than the inquiry CTA.
- The inquiry CTA uses RedTours red because it is the primary commercial action in the first phase, before full online booking is implemented.
- On scroll, the header becomes slightly more compact to preserve content focus while keeping navigation available.

## Interaction Style

Interactions should be quiet, fast, and refined.

### Rules

- Hover states should be subtle.
- Buttons may lift slightly, but animations should not feel playful.
- Avoid decorative motion that does not support navigation or comprehension.
- Microinteractions should communicate quality and responsiveness.
- Entrance motion should be staged and restrained: navigation first, then hero copy, then supporting panels and cards.
- Motion should use soft easing and small distances, never bouncing, spinning, or exaggerated movement.
- Reduced-motion user preferences must be respected.

## What To Avoid

- Generic travel agency template look.
- Overuse of bright red.
- All-white sterile SaaS feeling.
- Large rounded cards everywhere.
- Decorative gradients, orbs, and abstract blobs.
- Stock-photo collage without hierarchy.
- Heavy animation that makes the site feel less serious.
- Too many competing CTAs.

## Defensible Design Summary

Every major visual choice should support one of these goals:

- make RedTours feel curated and premium;
- help users find the right journey without confusion;
- build trust before the inquiry;
- keep the future admin/ERP ecosystem structurally possible;
- remain modern without becoming trendy or disposable.

# AGENTS.md — Design & UX System for this Project

This file tells any coding agent (Codex or otherwise) how to design and build
every screen in this project. It is derived from a close study of the
**GOV.UK Design System** — one of the most user-tested, accessibility-driven
public-service design languages in the world — adapted for an Indian civic
context with a project-specific colour system and tone.

Read this before writing any UI code. When a design decision isn't covered
here, default to the GOV.UK design principles below rather than inventing a
"modern SaaS" pattern.

---

## 1. Why GOV.UK, and what we're borrowing from it

GOV.UK was built on one premise: people use government services because they
*have to*, not because they want to. They are often stressed, in a hurry, on
a low-end phone, on a slow connection, or doing something they've never done
before (renewing a licence, claiming a pension, filing a grievance). The
design system exists to remove every possible source of confusion between the
user and the thing they came to do.

We are borrowing GOV.UK's **structure, discipline, and restraint** —
not its blue-and-black colour scheme. This project uses its own colour
system (Section 6), but everything else — the information architecture, the
typographic hierarchy, the spacing discipline, the plain-language rules, the
patterns for forms and status — follows GOV.UK's approach directly.

### The 10 GOV.UK design principles (apply these to every screen)

1. **Start with user needs** — design for the citizen's need, not the
   department's internal process or org chart.
2. **Do less** — if another pattern already solves it well, reuse it. Don't
   invent a new component for something a list, table, or plain paragraph
   already does.
3. **Design with data** — where the prototype allows it, surface real
   (mock) numbers and status instead of vague language ("in progress" is
   worse than "Step 2 of 4 — usually takes 3 minutes").
4. **Do the hard work to make it simple** — complexity should be absorbed by
   the system, not handed to the user. A confusing backend process (e.g.
   slot allocation, document validation rules) should never leak into the UI
   as jargon or extra steps.
5. **Iterate. Then iterate again** — ship the plainest version of a screen
   first; add nuance only where testing/logic requires it.
6. **This is for everyone** — design for the person with the oldest phone,
   the slowest connection, the least confidence, and the most at stake.
   Never assume digital fluency.
7. **Understand context** — a citizen may be filling this in on a cracked
   phone screen, in bright sunlight, with someone reading over their
   shoulder, or on someone else's behalf. Design for interruption and
   resumption.
8. **Build digital services, not websites** — this is a task to be
   completed, not content to be browsed. Every screen should move the user
   one step closer to done.
9. **Be consistent, not uniform** — reuse the same patterns for the same
   situations everywhere in the product, but let content types differ where
   it genuinely helps (a status page doesn't need to look like a form page).
10. **Make things open** — show, in the UI itself, what is mocked and what
    is real (see Section 11). Don't hide limitations from the reviewer.

---

## 2. Information architecture

Structure every journey as a **linear, resumable task**, not a dashboard or
a set of tabs.

### 2.1 One thing per page

Ask **one question, or present one decision, per screen.** This is GOV.UK's
single most tested finding: low-confidence users complete forms at far
higher rates when each page has one job. It also degrades gracefully on
slow connections and small screens.

- One primary question or action per screen.
- A single H1 that states what the page is for (as a question or a
  statement — pick one style and use it consistently, e.g. always
  "What is your vehicle category?" rather than mixing question/statement
  styles across the flow).
- A single primary button per page ("Continue", "Confirm", "Submit").
- Group only tightly-related micro-fields on one page (e.g. day/month/year
  of birth) — never group unrelated questions to save screens.

### 2.2 Standard page types (use these, don't invent new ones)

| Page type | Purpose | Notes |
|---|---|---|
| **Start page** | Explains what the service does, who it's for, what's needed, and how long it takes, before any data is entered | Not a form. One clear "Start now" button. |
| **Question page** | One question, one input, one Continue button | See 2.1 |
| **Task list** | A hub page listing every step of a multi-part journey with a status per task (Not started / In progress / Completed / Cannot start yet) | Use for anything with 3+ meaningfully independent sub-tasks (e.g. category → documents → slot → payment) |
| **Check your answers** | A read-only summary of everything entered, each row with a "Change" link back to that exact question | Always shown immediately before final submission |
| **Confirmation page** | States plainly that the action succeeded, gives a reference number, and says what happens next and when | This is the last screen of a journey — no dead ends, always a "what next" |
| **Error summary** | A list of everything wrong on a page, shown at the very top, each item linking to the broken field | Never rely on inline colour alone to mark an error |
| **Status / tracking page** | Shows current stage of an in-progress process as a plain sequential list, not an abstract progress bar with no labels | Every stage needs a plain-language label and, where known, a date/time |

### 2.3 Navigation rules

- Every page except the start page has a **Back** link (top-left, plain
  text, not a button) that returns to the exact previous state — never a
  generic "home" link disguised as back.
- No mega-menus, no multi-level nav drawers. If the whole service is more
  than the task list can hold, that's a sign to cut scope, not add
  navigation chrome.
- Breadcrumbs only appear on content/informational pages, not inside a
  transactional flow (the task list *is* the breadcrumb for a flow).

---

## 3. Forms

- **Labels above fields**, never placeholder-only labels (placeholder text
  disappears when the user starts typing and is not a substitute for a
  label).
- Every field has visible, plain-language help text where the format isn't
  obvious ("For example, 14 03 1998" under a date field).
- Buttons describe the action in the user's words: "Continue", "Book this
  slot", "Submit application" — never generic "Submit" alone, never
  "Next »".
- Validate on submit, not aggressively on every keystroke. Show all errors
  at once in an error summary at the top of the page **and** inline next to
  the specific field, both pointing at each other.
- Radios and checkboxes are large, full-width tap targets on mobile — never
  small native-style controls a thumb can miss.
- Never disable a Continue button pre-emptively to "guide" the user —
  let them submit and tell them clearly what's wrong.

---

## 4. Layout & grid

- **Mobile-first.** Design the single-column mobile layout first; the
  desktop layout is an expansion of it, not a separate design.
- Content column: cap text-heavy content at roughly **75 characters per
  line** at any viewport. Use a two-thirds-width content column on desktop
  with the remaining third left empty or used for short, genuinely
  supporting side content (never ads, never unrelated promos).
- Max page width: ~1020px. Beyond that, add margin, not more content
  width.
- Consistent spacing scale — pick one scale (e.g. 4/8/16/24/32/48/64px) and
  use it everywhere. No ad hoc margins.
- Generous whitespace between sections, but whitespace should come from
  the spacing scale and typographic rhythm — not from empty decorative
  panels or oversized hero banners.

---

## 5. Typography

- **One typeface family for the whole product.** Use a well-hinted,
  humanist system sans-serif stack for maximum legibility on low-end
  screens and to avoid licensing a custom font for a prototype:
  `"Inter", "Noto Sans", "Segoe UI", system-ui, -apple-system, Arial, sans-serif`.
  If Devanagari/regional-script content is needed, pair with `"Noto Sans
  Devanagari"` (or the relevant Noto Sans script) rather than switching
  the whole typeface.
- Body text: **16–19px minimum**, never below 16px anywhere a citizen has
  to read or fill something in (this mirrors GOV.UK's own accessibility
  correction to its type scale — small government-issued text is a
  recurring, well-documented usability failure).
- Line height: **~1.25–1.5** for body text.
- Limit the type scale to a small number of steps (e.g. 16 / 19 / 24 / 32 /
  40px) and reuse them everywhere — no bespoke one-off sizes per screen.
- Left-align all body text. Never centre-align paragraphs or form content.
- Headings are short, literal, and describe the page's job — not clever or
  brand-voiced.

---

## 6. Colour system

This project uses a **deliberately restrained three-colour palette**,
inspired by the Indian tricolour, applied the way GOV.UK applies colour:
**sparingly, functionally, and never decoratively.**

| Name | Hex | Role |
|---|---|---|
| Deep Saffron | `#FF9933` | Primary accent — used only for the single primary action per page, key status highlights, and focus/selection states. Never as a background wash or large surface fill. |
| White | `#FFFFFF` | Reserved for text-on-dark, surfaces of raised elements (cards, inputs) sitting on a non-white canvas, and small areas of contrast — **not** used as the default full-page background (see Avoid list, Section 8). |
| India Green | `#138808` | Success / completed / confirmed states only (e.g. "Application submitted", "Slot confirmed"). Functions the same way GOV.UK reserves green exclusively for success — do not use it decoratively elsewhere. |

### 6.1 Required supporting neutrals

Three colours cannot carry an entire accessible interface on their own —
body text, borders, disabled states, and the page canvas itself all need
neutral values. These are proposed as the minimum necessary supporting set,
kept warm and muted rather than clinical, and are secondary to the three
colours above in every design decision:

| Name | Hex (approx.) | Role |
|---|---|---|
| Ink | `#1A1A1A` | Primary text colour. Never pure black — softer on the eyes at length. |
| Slate | `#5A5A5A` | Secondary/muted text, help text, timestamps. |
| Paper | `#FAF7F2` | Default page canvas — a warm, quiet off-white. This is the background the "Avoid pure white backgrounds" rule refers to. |
| Ash | `#DCD6CC` | Borders, dividers, input outlines. |
| Error red | `#B3261E` | Reserved exclusively for error states/messages, same restrained logic as saffron/green. |

### 6.2 Rules for applying colour

- Never use colour as the *only* signal for status or error — always pair
  it with an icon, label, or text ("✓ Completed" in green text, not a bare
  green dot).
- Check all text/background combinations against **WCAG 2.2 AA contrast**
  (4.5:1 for body text, 3:1 for large text/UI components) before shipping
  a screen. Saffron-on-white and green-on-white text both need a checked
  contrast ratio, or must be used as a background chip with dark text
  instead of as text colour on a light ground.
- Saffron and green sitting side by side (e.g. adjacent status tags) must
  remain distinguishable for users with red-green colour vision
  deficiency — always via the accompanying text/icon, never colour alone.
- Because this palette echoes the national flag, use it with restraint: a
  thin top accent bar, a single primary button colour, a success tag — not
  a saffron-and-green wash across the interface. This keeps the product
  feeling like a considered civic tool rather than an attempt to look like
  an official government emblem or insignia (which this prototype must
  not claim to be — see the hackathon brief's rules on not implying
  official status).

---

## 7. Tone

Every piece of copy, every interaction, and every visual choice should read
as:

- **Quiet** — no exclamation marks, no urgency-manufacturing language, no
  "Hurry!" or celebratory confetti for routine actions. Let the completion
  of a task be its own quiet reward — a plain confirmation, not a
  celebration animation.
- **Trustworthy** — say exactly what will happen, exactly what has
  happened, and exactly what's still needed. Never oversell, never use
  vague reassurance ("Your request is important to us") in place of
  actual status information.
- **Minimal** — every element on screen earns its place. If removing it
  doesn't harm the user's ability to complete the task, remove it.
- **Tactile** — buttons, inputs, and tap targets should feel physically
  real: clear borders or shadows that suggest they can be pressed, generous
  hit areas, visible pressed/focus states — not flat, ambiguous shapes that
  could be read as either a label or a control.
- **Mobile-native** — designed for a thumb on a mid-range Android phone on
  a 3G/4G connection first. Desktop is the adapted layout, not the primary
  one.

---

## 8. Avoid

Do not use any of the following, anywhere in this product:

- **Bright gradients** — flat, single colour fills only.
- **Glassmorphism** — no translucency, blur, or frosted-glass panel
  effects; they reduce legibility and read as decorative rather than
  functional.
- **Overly colourful cards** — cards/panels use neutral surfaces (Paper or
  White) with restrained colour only for status tags or the one primary
  action.
- **Hard borders** — avoid heavy, high-contrast black borders around every
  element; use the Ash neutral at a lighter weight, or rely on spacing and
  subtle elevation instead of boxing everything.
- **White backgrounds** — the default canvas is Paper (`#FAF7F2`), not pure
  white. White is reserved for specific raised surfaces and text-on-dark
  use (see 6, above).
- **Large illustrations** — no hero illustrations, mascots, or decorative
  spot art. If an image is genuinely needed (e.g. a document example), use
  a plain, real-looking mock, not stylised art.
- **Marketing-style hero copy** — no taglines, no "Welcome to the future
  of X", no persuasive/aspirational language. Start pages state facts:
  what the service does, who it's for, what's needed, how long it takes.
- **Generic SaaS dashboard spacing** — avoid the wide-gutter,
  card-grid-on-a-light-grey-canvas look common to startup dashboards.
  Spacing should be tighter and more content-first, following GOV.UK's
  document-like density rather than a dashboard's airy widget grid.

---

## 9. Core components (reuse these; don't invent new ones)

- **Button** — solid Saffron fill, Ink or White text (whichever passes
  contrast), one primary button per page, secondary actions as plain text
  links, never a second competing solid button.
- **Input field** — Ash border, Ink text, clear visible label above,
  optional help text below the label, error state uses Error red border +
  red error text above the field.
- **Radios / checkboxes** — large tap targets, visible selected state,
  never rely on colour alone (use a filled circle/check mark shape).
- **Status tag** — small text label with a coloured left border or subtle
  tinted background (not a solid colour fill) — "Not started" (Slate),
  "In progress" (Saffron), "Completed" (India Green), "Error" (Error red).
- **Task list** — numbered or plain list of tasks with a status tag per
  row, per Section 2.2.
- **Summary list ("Check your answers")** — label/value rows with a
  "Change" link per row, per Section 2.2.
- **Notification banner** — used sparingly for one important system
  message at a time (e.g. "This is a prototype using mock data"), plain
  text on a Paper or lightly-tinted surface, never a bright alert-style
  banner unless it's a genuine error.
- **Back link** — plain text, top-left, on every non-start page.

---

## 10. Accessibility & inclusive design

- Meet **WCAG 2.2 AA** as a hard floor, not an aspiration.
- Every interactive element has a visible keyboard focus state (a clear
  outline using Saffron or Ink — never remove focus outlines).
- Minimum tap target size ~44x44px on touch devices.
- Never convey meaning through colour alone (see Section 6.2).
- Write for a lower-secondary reading level: short sentences, common
  words, active voice, no bureaucratic jargon, no unexplained
  abbreviations. If a technical term is unavoidable (e.g. "LMV", "PPO
  number"), explain it in plain language the first time it appears.
- Support content in a regional language alongside English wherever
  feasible; never require English fluency to complete the core journey.
- Design for interruption: assume the user may leave and come back later,
  lose signal mid-task, or hand the phone to someone else to finish for
  them.

---

## 11. Honesty about what's mocked

Per the hackathon brief, this is a prototype, not a live government
service. The UI itself should make this legible to a reviewer without
needing it explained separately:

- A single, quiet notification banner (not a scary red warning) on
  relevant screens: "This is a prototype. [Feature] uses mock data."
- Never use real government logos, emblems, or the national flag itself
  as an interface asset — the saffron/green palette is a tonal reference
  only, not an attempt to imitate an official mark.
- Never label the product as an official government service anywhere in
  the UI or copy.

---

## 12. Notes for the coding agent

- Prefer semantic HTML (`<button>`, `<label>`, `<fieldset>`, `<nav>`) over
  generic `<div>` soup — this is both an accessibility requirement and
  what makes GOV.UK-style forms work with assistive technology out of the
  box.
- Name colour tokens by role, not by hex or by the flag colour metaphor —
  e.g. `--color-primary-action`, `--color-success`, `--color-canvas`,
  `--color-text` — so a future colour change doesn't require renaming
  every usage.
- Keep JavaScript minimal and progressive — the core journey (view a
  question, submit an answer, see a confirmation) should not depend on a
  heavy client framework to be understandable or testable by a reviewer.
- Every screen you build should be checked against Sections 2 and 8 before
  it's considered done: does it do one thing, and does it avoid every item
  on the avoid list?

# Codex build prompt — "Sarathi Next"

Copy everything below this line into Codex as the project brief.

---

## What you're building

**Sarathi Next** — a redesigned, simplified web prototype of the Learner's
Licence (LL) application journey currently offered on the Parivahan/Sarathi
portal.

This is a **hackathon prototype**, not a production government system. It
must run end-to-end as a real, working web app with mock data standing in
for anything that would otherwise touch a real government backend, real
payments, real identity documents, or a real proctored test.

**Before writing any UI code, read `/agents.md` in this repo.** It is the
design system for this entire product — colour tokens, typography, layout
rules, tone, component patterns, and a list of things to actively avoid.
Every screen you build must be checked against it. Do not introduce your
own visual style, spacing scale, or colour palette.

---

## The problem this replaces

Today, applying for a Learner's Licence in India means:

- Choosing a vehicle category from confusing technical codes (e.g. "MC
  50cc", "LMV-NT") with no plain-language explanation of what they mean.
- Uploading identity/address documents with no real-time feedback — files
  are silently rejected (wrong size/format) and the user has to guess why
  and re-upload blind.
- Booking a slot for the online LL test through a slot system with no
  visible queue, no held slots during payment, and no waitlist — slots
  disappear mid-booking and payments are sometimes lost with them.
- Getting no plain-language explanation of what happens after the test:
  what's instant, what still needs an RTO visit, how long the LL is valid,
  and when a permanent driving licence can be applied for.

Sarathi Next exists to fix these four things end-to-end, in one continuous,
mobile-first citizen journey.

---

## Who this is for

Primarily first-time applicants, aged 18+, on a mobile phone, often on a
slower connection, often doing this for the first time in their lives with
no prior experience of a government digital service. Some will be applying
on behalf of a family member. Assume low patience for jargon and low
tolerance for ambiguity about whether something worked.

---

## The complete citizen journey to build

Build every one of these as a real, working screen — not a mockup image.
Follow the **one-thing-per-page** and **task list** patterns from
`agents.md` Section 2.

1. **Landing / start page**
   - Plain-language explanation: what this service does, who it's for,
     what you'll need (a photo, an ID document, ~15–20 minutes), and how
     long the whole process usually takes.
   - Single "Start now" button. No login required to view this page.

2. **Login**
   - Mobile number + mock OTP (auto-fill or display the OTP on screen with
     a clear "This is a mock OTP for demo purposes" note — never simulate
     a real SMS OTP flow as if it were live).
   - No real phone verification, no real SMS sending.

3. **Task list (hub page)**
   - Shows the remaining steps as a checklist with status tags (Not
     started / In progress / Completed), per `agents.md` Section 2.2:
     1. Choose vehicle category
     2. Upload your documents
     3. Book your test slot
     4. Take the mock test
     5. Get your Learner's Licence
   - This page is what the user returns to if they leave and come back —
     state must persist across steps within the demo session.

4. **Choose vehicle category**
   - Plain-language options ("Scooter or motorcycle", "Car for personal
     use", "Commercial/goods vehicle") that map internally to the real
     RTO category codes — show the technical code only as small secondary
     text, never as the primary label.
   - One question per page, per `agents.md` Section 2.1.

5. **Upload documents**
   - Upload flow for an ID proof and address proof (mock — accept any
     image/PDF, never request or store anything resembling a real Aadhaar
     number, PAN, or other government ID number).
   - Real-time client-side validation feedback: check file type and size
     immediately, and show a clear, specific reason if rejected ("This
     file is 12MB — please upload a file under 5MB", not a generic "Upload
     failed").
   - Show a success state per document once accepted.

6. **Book a test slot**
   - This is the centrepiece fix — rebuild the broken real-world slot
     booking experience:
     - Show real-time-feeling slot availability (mock data), grouped by
       date, with a visible seats-remaining count per slot.
     - When a user selects a slot, **hold it for a visible countdown**
       (e.g. 5 minutes) while they "confirm" — other mock demand should
       not silently steal a held slot from under them.
     - If a slot fills before confirmation, offer a clear "Join waitlist,
       we'll notify you" option instead of a dead end.
     - No real payment gateway — simulate a mock payment confirmation
       step, clearly labelled as mock.

7. **Take the mock test**
   - A short (5–8 question) multiple-choice quiz styled as a stand-in for
     the real LL test, covering basic road-sign/rule knowledge.
   - Immediate pass/fail result. On pass, continue; on fail, show a plain
     retry path (never a dead end).

8. **Certificate issued (confirmation page)**
   - On pass, issue a mock e-Learner's-Licence: applicant's mock name,
     category, a reference/licence number, issue date, and **valid until**
     date, downloadable as a simple file (PDF or image).
   - Plain-language "What happens next" section: validity period, when the
     user becomes eligible to apply for a permanent driving licence, and
     that no RTO visit is required for this step.
   - Clearly label the certificate as a demo/mock artefact, not a real
     legal document.

9. **Status / home screen (return visit)**
   - After completion, returning to the app should show the current LL
     status, its validity countdown, and a clear next-step prompt as that
     countdown approaches expiry.

Every screen must include the standing mock-data disclosure banner
described in `agents.md` Section 11, wherever mock data, mock payment, or
mock verification is involved.

---

## Non-functional requirements

- **Mobile-first**, single-column by default, tested to look right on a
  ~360–400px-wide viewport before anything else.
- Must load and be usable on a slow connection — no large hero images, no
  heavy animation, no client framework bloat.
- Meets WCAG 2.2 AA contrast and keyboard/focus requirements per
  `agents.md` Section 10.
- Fully keyboard-navigable and screen-reader-usable end to end, not just
  the happy path.
- No real personal data anywhere: no real Aadhaar/PAN numbers, no real
  phone-based OTP delivery, no real payment processing, no real ID
  document storage. All of it mock, and clearly disclosed as such.
- The whole flow (start → certificate issued) should be completable by a
  reviewer in well under two minutes, since that's the entire demo window
  for the hackathon submission.

---

## Suggested technical approach

Use your judgement on implementation details, but this is a reasonable
default if you don't have a strong reason to deviate:

- A single web app (e.g. Next.js or a comparably simple React setup) that
  deploys to a public URL with no login wall in front of the app itself
  (mock login happens *inside* the app, as part of the citizen journey —
  reviewers should never need credentials just to open the site).
- Session/application state can live in memory or browser storage for the
  demo — there is no requirement for a real persistent database. Seed any
  "backend" state (slot availability, document validation rules, quiz
  questions) from a simple mock data file so it's easy to see and edit.
- Style with your CSS approach of choice, but implement `agents.md`'s
  colour, type, and spacing tokens as actual variables/theme config rather
  than hard-coded one-off values, so the design system is enforced
  consistently rather than approximated per screen.
- Keep JavaScript minimal and progressive per `agents.md` Section 12 — the
  core journey should be simple enough to reason about screen by screen.

---

## Definition of done

- [ ] Every screen in the journey (Section "The complete citizen journey")
      is implemented and navigable start to finish without dead ends.
- [ ] Every screen follows `agents.md`: one thing per page, correct
      colour usage, no items from the Avoid list, correct component
      patterns.
- [ ] Slot booking visibly solves the real-world failure mode: held
      slots, visible countdown, waitlist fallback — not just a static
      calendar.
- [ ] Document upload gives specific, real-time validation feedback, not
      a generic error.
- [ ] All mock data, mock verification, and mock payment are clearly and
      consistently disclosed in the UI itself.
- [ ] No real personal, identity, or payment data is requested, stored,
      or resembles a real Aadhaar/PAN/OTP/payment number anywhere.
- [ ] The whole journey works and looks correct on a narrow mobile
      viewport, not just desktop.
- [ ] A short `README.md` explains what's real (the working UI/logic) and
      what's mocked (backend, verification, payment, test proctoring),
      matching the hackathon's honesty requirement.

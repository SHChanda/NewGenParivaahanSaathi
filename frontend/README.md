# Sarathi Next

Sarathi Next is a mobile-first hackathon prototype for a simplified Learner's Licence application journey.

## Run locally

```bash
npm install
npm run dev
```

## What works

- A complete, navigable start-to-certificate journey
- Mock mobile login, with a visible demo OTP and no SMS sending
- Plain-language vehicle selection
- Client-side image/PDF upload validation, including specific type and 5MB size errors
- Mock slot availability, five-minute held-slot countdown, confirmation, and waitlist fallback
- Six-question mock road-safety test with pass/retry paths
- A downloadable SVG mock e-Learner's Licence
- In-browser progress persistence through `localStorage`

## What is mocked

All data is mock data. No phone verification, identity document upload/storage, payment, government record creation, real test proctoring, or legal licence issuance occurs. The generated certificate is visibly labelled as a demo artefact and has no legal validity.

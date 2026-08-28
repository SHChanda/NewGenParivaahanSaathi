# Sarathi Next — Information Architecture

_Documentation of the implemented website as of 27 August 2026._

## 1. Product scope

Sarathi Next is a bilingual civic-service prototype for two top-level user needs:

1. Apply for a Learner's Licence.
2. Book a Driving Licence test slot.

The primary implemented journey is the Learner's Licence application. It covers identity verification, personal details, vehicle category, documents, a mock test slot, a mock knowledge test, and a downloadable mock licence.

The website is explicitly presented as a hackathon prototype. Aadhaar verification, OTP delivery, document handling, payments, availability, test results, and licence issuance use mock or browser-local data.

## 2. Global information model

### Global header

- **Sarathi Next** brand link → `#start`
- **Language switcher**
  - English
  - हिन्दी
- **My application** → `#status`
  - Hidden before authentication
  - Visible after `loggedIn` becomes true
- **Skip to main content** accessibility link

### Global transactional patterns

- Prototype notice banner on service pages
- One primary task or decision per page
- Back link on non-start pages
- Error summary at the top of invalid forms
- Inline invalid state on affected fields
- Prototype disclaimer footer
- Browser-local progress for core application state

### Language coverage

English and Hindi copy is currently implemented for:

- Landing page
- Aadhaar route choice
- Aadhaar authentication
- Mobile authentication
- Personal and address details
- Document upload and self-attested form

The task list, vehicle category, slot booking, mock test, results, certificate, and status pages currently use English copy.

## 3. Top-level site map

```text
Sarathi Next
├── Home / Service selection                         #start
│   ├── Apply for a Learner's Licence
│   │   └── Learner's Licence start page             #learner-start
│   │       └── Choose application method            #aadhar-choice
│   │           ├── Apply with Aadhaar
│   │           │   └── Aadhaar authentication       #login
│   │           │       └── Application task list    #tasks
│   │           └── Apply without Aadhaar
│   │               └── Mobile authentication        #mobile-auth
│   │                   └── Personal details          #personal-details
│   │                       └── Application task list #tasks
│   └── Book a Driving Licence test slot
│       └── Choose a mock test slot                  #slots
│           └── Slot hold / confirmation             #hold
│
├── Application task list                            #tasks
│   ├── Choose vehicle category                      #category
│   ├── Upload documents and sign form               #documents
│   ├── Book mock test slot                          #slots
│   │   └── Slot hold / confirmation                 #hold
│   ├── Take mock test                               #quiz
│   │   └── Test result                              #result
│   └── Get mock Learner's Licence                   #certificate
│
└── My application / status                         #status
```

## 4. Route inventory

The website is a single-page application that uses URL hash routes.

| Route | Page | Primary purpose | Main next destination |
|---|---|---|---|
| `#start` | Home / service selection | Choose Learner's Licence application or slot booking | `#learner-start` or `#slots` |
| `#learner-start` | Learner's Licence start page | Explain eligibility, preparation, duration, and prototype scope | `#aadhar-choice` |
| `#aadhar-choice` | Application method | Choose Aadhaar or non-Aadhaar route | `#login` or `#mobile-auth` |
| `#login` | Aadhaar authentication | Enter Aadhaar, receive mock OTP, accept declarations | `#tasks` |
| `#mobile-auth` | Mobile authentication | Enter phone, receive mock OTP, consent to updates | `#personal-details` |
| `#personal-details` | Personal and address details | Collect applicant, relative, demographic, contact, mark, and address details | `#tasks` |
| `#tasks` | Application task list | Show five sequential tasks and their statuses | Next available task |
| `#category` | Vehicle category | Select the vehicle type for the application | `#tasks` |
| `#documents` | Documents and self-attestation | Add proofs, create mock signature, review, digitally sign, and submit form | `#tasks` |
| `#slots` | Slot selection | Choose a mock date and time | `#hold` |
| `#hold` | Slot hold / confirmation | Confirm a five-minute hold or join mock waitlist | `#tasks` or `#slots` |
| `#quiz` | Mock knowledge test | Answer six traffic-safety questions | `#result` |
| `#result` | Test result | Show pass/fail outcome and retry path | `#certificate`, `#quiz`, or `#tasks` |
| `#certificate` | Mock e-Learner's Licence | Show and download the mock licence | `#status` |
| `#status` | Application status | Show sequential application milestones | `#tasks` or `#certificate` |

## 5. Primary user journeys

### 5.1 Learner's Licence — with Aadhaar

```text
Home
→ Learner's Licence start page
→ Application method
→ Apply with Aadhaar
→ Aadhaar authentication and consent
→ Application task list
→ Category
→ Documents and self-attestation
→ Slot
→ Mock test
→ Mock licence
```

The implemented Aadhaar route moves directly from successful authentication to the task list. It does not currently pass through the Personal Details page.

### 5.2 Learner's Licence — without Aadhaar

```text
Home
→ Learner's Licence start page
→ Application method
→ Apply without Aadhaar
→ Mobile OTP verification and consent
→ Personal and address details
→ Application task list
→ Category
→ Documents and self-attestation
→ Slot
→ Mock test
→ Mock licence
```

### 5.3 Direct slot-booking entry

```text
Home
→ Book a Driving Licence test slot
→ Choose slot
→ Five-minute hold / full-slot state
→ Confirm mock payment or join mock waitlist
```

This landing-page route opens slot selection directly and does not require authentication or task-list completion.

## 6. Page-level content hierarchy

### 6.1 Home / service selection — `#start`

1. Prototype notice
2. Eyebrow: Driving licence services
3. H1: What do you need to do?
4. Service cards
   - Apply for a Learner's Licence
   - Book a Driving Licence test slot
5. Before you start guidance
6. Prototype footer

### 6.2 Learner's Licence start page — `#learner-start`

1. Prototype notice
2. Service label
3. H1: Apply for a Learner's Licence
4. Eligibility and estimated completion time
5. Before you start
   - Photo, ID proof, and address proof
   - Vehicle selection
   - Mock online test slot
6. Start now

### 6.3 Application method — `#aadhar-choice`

1. Back link
2. Prototype notice
3. H1: How do you want to apply?
4. Context panel explaining both routes
5. Choice cards
   - Apply with Aadhaar
   - Apply without Aadhaar
6. Next
7. Return to homepage

### 6.4 Aadhaar authentication — `#login`

1. Back link
2. Prototype notice
3. Aadhaar number
4. Send OTP
5. Mock OTP status
6. OTP field
7. Three consent declarations
8. Authenticate
9. Try another method

Successful authentication sets the user as logged in and opens the task list.

### 6.5 Mobile authentication — `#mobile-auth`

1. Back link
2. Prototype notice
3. Phone number
4. Send OTP
5. Mock OTP status
6. OTP field
7. Resend OTP
8. Consent to receive application status updates
9. Next
10. Try another method

Successful verification carries the phone number to Personal Details.

### 6.6 Personal and address details — `#personal-details`

1. Back link
2. Prototype notice
3. H1 and explanation
4. Mandatory-field notice
5. Personal details
   - Applicant first, middle, and last name
   - Relative type: father, mother, husband, or guardian
   - Relative first, middle, and last name
   - Legal sex: female, male, non-binary, prefer not to say, or self-describe
   - Optional self-description when selected
   - Date of birth
   - Automatically calculated age
   - Blood group
   - Read-only verified applicant phone
   - Emergency phone
   - Two identification marks
6. Address details
   - Present address same as permanent address switch
   - Permanent state and six-digit PIN code
   - Conditional present state and PIN code
   - State list contains all 28 Indian states
7. Declaration checkbox
8. Submit
9. Reset

Name and identification-mark inputs convert text to uppercase. Phone and PIN-code inputs accept numerical characters only.

### 6.7 Application task list — `#tasks`

The task list is the central hub for the Learner's Licence journey.

| Order | Task | Completion condition |
|---|---|---|
| 1 | Choose vehicle category | A category is selected |
| 2 | Upload your documents | Age proof, address proof, mock signature, digital signature, and self-attested form submission are complete |
| 3 | Book your test slot | A slot is selected and mock payment is confirmed |
| 4 | Take the mock test | The test is passed |
| 5 | Get your Learner's Licence | The test is passed |

Possible task statuses:

- Not started
- In progress
- Completed
- Cannot start yet

Tasks become available sequentially.

### 6.8 Vehicle category — `#category`

Available choices:

- Scooter or motorcycle — MCWG
- Car for personal use — LMV-NT
- Commercial or goods vehicle — Transport vehicle

Submission returns to the task list.

### 6.9 Documents and self-attestation — `#documents`

1. Age proof card
   - Image or PDF
   - Maximum size: 500KB
2. Address proof card
   - Image or PDF
   - Maximum size: 500KB
3. Signature card
   - Upload mock signature action
   - Generates a browser-local prototype signature
4. Self-Attested Form card
   - Preview application form
   - Sign digitally
   - Signing requires the preview to be opened and the mock signature to exist
5. Pre-filled application preview
   - Applicant name
   - Relative type and name
   - Phone number
   - Date of birth and age
   - Legal sex and blood group
   - Emergency phone
   - Identification marks
   - Permanent address
   - Present address
   - Vehicle category and code
   - Digital signature
6. Submit

Submission is blocked until both proofs, the mock signature, the preview, and digital signing are complete.

### 6.10 Slot selection — `#slots`

1. Back link
2. Mock-availability notice
3. Slot list grouped by date
4. Time and available-seat count per option
5. Hold this slot

### 6.11 Slot hold / confirmation — `#hold`

Available slot state:

- Selected date and time
- Five-minute countdown
- Confirm mock payment
- Choose another time

Full slot state:

- Full-slot explanation
- Join mock waitlist
- Choose another time

### 6.12 Mock knowledge test — `#quiz`

- Six questions
- One question per page state
- Three answer choices per question
- Continue after each answer
- Pass threshold: four correct answers out of six

Topics include traffic lights, turning, crossings, helmets, emergency vehicles, and mobile-phone distraction.

### 6.13 Test result — `#result`

Pass state:

- Score
- Confirmation of passing
- View mock licence
- Return to tasks

Fail state:

- Score
- Four-out-of-six requirement
- Try again
- Return to tasks

### 6.14 Mock e-Learner's Licence — `#certificate`

1. Success panel
2. Mock certificate
   - Applicant
   - Vehicle category
   - Reference number
   - Issue date
   - Valid-until date
3. Download mock certificate
4. What happens next
5. View application status

The displayed validity is six months from the current date.

### 6.15 Application status — `#status`

The page shows a sequential timeline for:

1. Vehicle category
2. Documents and digitally signed form
3. Test slot
4. Mock test and licence

If the user is not logged in, this route renders the Learner's Licence start page. Logged-in users can continue to the task list or return to the mock licence after completion.

## 7. Navigation rules and dependencies

### Back destinations

| Current page | Back destination |
|---|---|
| Application method | Learner's Licence start page |
| Aadhaar authentication | Application method |
| Mobile authentication | Application method |
| Personal details | Mobile authentication |
| Category | Task list |
| Documents | Task list |
| Slot selection | Task list |
| Slot hold | Slot selection |
| Mock test | Task list |
| Result | Task list |
| Certificate | Task list |
| Status | Task list or certificate, depending on completion |

### Conditional route behavior

- `#status` without a logged-in state renders the Learner's Licence start page.
- `#hold` without a selected slot renders slot selection.
- `#quiz` after the question sequence is exhausted renders the result page.
- The task list prevents later tasks from being opened through its UI until prerequisites are complete.
- Most hash routes remain directly addressable; prerequisite enforcement is primarily in the task-list interface rather than a universal route guard.

## 8. Data and state architecture

### Browser-persisted application state

Stored in `localStorage`:

- Logged-in status
- Chosen Aadhaar route
- Vehicle category
- Accepted proof filenames
- Mock-signature status
- Digital-signature status
- Self-attested-form submission status
- Selected slot
- Mock-payment confirmation
- Test score, question index, and pass state
- Language preference

### In-memory journey state

Kept only for the current loaded page session:

- Generated OTP values
- Verified mobile number
- Personal and address form draft
- Mock-signature image data
- Self-attested-form preview open/closed state
- Slot countdown value

Because these values are in memory, refreshing the page can remove some pre-filled personal data and signature imagery even when core task progress remains browser-persisted.

### Cross-page data use

| Source | Consumed by |
|---|---|
| Verified mobile number | Personal-details phone field; self-attested form |
| Personal details | Self-attested form |
| Address details | Self-attested form |
| Vehicle category | Self-attested form; certificate; status |
| Document state | Task list; status |
| Slot state | Hold page; task list; status |
| Test state | Result; certificate; status |

## 9. Error and validation architecture

Forms use a common validation pattern:

1. Validate on submission or explicit action.
2. Show an error summary above the form.
3. Link each error to its field or action.
4. Mark affected controls with `aria-invalid` where applicable.
5. Keep primary actions available instead of disabling them pre-emptively.

Key validation rules include:

- Aadhaar: 12 digits
- OTP: six digits matching the generated mock OTP
- Mobile and emergency phone: 10 digits
- PIN code: six digits
- Proof files: image or PDF, maximum 500KB
- Personal mandatory fields and declaration
- Documents: two proofs, mock signature, form preview, digital signature, and submission
- Slot: one selected option
- Quiz: one answer per question

## 10. Prototype and trust architecture

The site repeatedly communicates that it is not an official government service:

- Quiet prototype banner on relevant pages
- Mock OTP displayed in the interface
- No real Aadhaar authentication
- No real SMS delivery
- Files checked in the browser rather than uploaded
- Mock signature generated locally
- Mock slot inventory and payment confirmation
- Mock knowledge test and result
- Mock certificate with no legal validity
- Footer disclaimer across the journey

## 11. Structural observations

- The website has one public landing page and one main transactional application flow.
- The task list is the primary hub and progress model for the Learner's Licence journey.
- Identity verification branches before converging on the task list.
- The non-Aadhaar route collects personal details; the Aadhaar route currently does not.
- Direct slot booking from the landing page bypasses authentication and task prerequisites.
- The application uses hash-based client routing rather than separate server routes.
- Progress is partly persistent and partly session-only, so the current implementation is resumable for core tasks but not for all personal-data previews.

import { sarathiApi, isApiFallbackError } from "./api-client.js";

const storageKey = "sarathi-next-demo-v1";
const languageKey = "sarathi-next-language";
const defaultState = {
  loggedIn: false,
  aadharRoute: "",
  category: "",
  documents: { id: "", address: "", photo: "", photoDecision: "", signature: "", digitallySigned: false, formSubmitted: false },
  slot: "",
  paymentConfirmed: false,
  testPassed: false,
  quizIndex: 0,
  quizScore: 0,
  startedAt: "",
  applicationId: "",
  mobileChallengeId: "",
  aadhaarChallengeId: "",
  signatureId: "",
  holdId: "",
  testId: "",
  testQuestions: [],
  testPassMark: 4,
};
const categoryOptions = [
  ["two-wheeler", "Scooter or motorcycle", "MCWG — motorcycle with gear"],
  ["car", "Car for personal use", "LMV-NT — light motor vehicle, non-transport"],
  ["commercial", "Commercial or goods vehicle", "Transport vehicle — commercial use"],
];
let slots = [
  { id: "aug-26-930", date: "Wednesday, 26 August", time: "9:30am to 10:00am", seats: 4 },
  { id: "aug-26-1130", date: "Wednesday, 26 August", time: "11:30am to 12:00pm", seats: 2 },
  { id: "aug-26-230", date: "Wednesday, 26 August", time: "2:30pm to 3:00pm", seats: 0 },
  { id: "aug-28-1000", date: "Friday, 28 August", time: "10:00am to 10:30am", seats: 6 },
  { id: "aug-28-1300", date: "Friday, 28 August", time: "1:00pm to 1:30pm", seats: 1 },
  { id: "aug-28-330", date: "Friday, 28 August", time: "3:30pm to 4:00pm", seats: 3 },
];
const questions = [
  { text: "What does a red traffic light mean?", answers: ["Slow down", "Stop before the line", "Turn left"], correct: 1 },
  { text: "Before turning, what should you do?", answers: ["Signal early and check it is safe", "Speed up", "Use your horn only"], correct: 0 },
  { text: "A zebra crossing is for:", answers: ["Parking", "Pedestrians crossing the road", "Overtaking"], correct: 1 },
  { text: "When should you wear a helmet on a motorcycle?", answers: ["On every ride", "Only on long trips", "Only at night"], correct: 0 },
  { text: "What should you do when an ambulance approaches with its siren on?", answers: ["Continue normally", "Make space and let it pass", "Follow it closely"], correct: 1 },
  { text: "Using a mobile phone while driving is:", answers: ["Safe at slow speed", "Allowed at red lights", "Distracting and unsafe"], correct: 2 },
];
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const main = document.querySelector("main");
const statusLink = document.querySelector("#status-link");
const languageTabs = document.querySelectorAll("[data-language]");
let state = loadState();
let language = localStorage.getItem(languageKey) === "hi" ? "hi" : "en";
let currentView = "start";
let holdSeconds = 300;
let holdInterval;
let generatedOtp = "";
let generatedMobileOtp = "";
let verifiedMobile = "";
let personalDraft = { sameAddress: true };
let signaturePreviewUrl = "";
let photoPreviewUrl = "";
let selfAttestedPreviewOpen = false;
let testStartPending = false;
let remoteSlotsLoaded = false;
let remoteApplicationStatus = null;
let aadhaarReviewDetails = null;

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return { ...defaultState, ...stored, documents: { ...defaultState.documents, ...(stored?.documents || {}) } };
  }
  catch { return { ...defaultState }; }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); updateHeader(); }
function apiMessage(error) {
  const request = error?.requestId ? ` Reference: ${error.requestId}.` : "";
  return `${error?.message || "The service could not complete this request."}${request}`;
}
function escapeText(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function mockBanner(detail = "This journey uses mock data.") { return `<aside class="mock-banner" aria-label="Prototype notice"><strong>This is a prototype.</strong> ${detail}</aside>`; }
function back(to) { return `<button class="back" type="button" data-go="${to}">Back</button>`; }
function footer() { return `<footer class="footer">Sarathi Next is a hackathon prototype. It is not an official government service. No real identity, payment, or test records are created.</footer>`; }
function dateText() { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date()); }
function validityDate() { const d = new Date(); d.setMonth(d.getMonth() + 6); return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(d); }
function categoryInfo() { return categoryOptions.find(option => option[0] === state.category) || categoryOptions[0]; }
function slotInfo() { return slots.find(slot => slot.id === state.slot); }
function activeQuestions() { return state.testQuestions?.length ? state.testQuestions : questions; }
const landingCopy = {
  en: {
    pageTitle: "Sarathi Next — Driving licence services",
    description: "Apply for a Learner's Licence or book a Driving Licence test slot with Sarathi Next.",
    skip: "Skip to main content",
    application: "My application",
    languageLabel: "Choose language",
    noticeTitle: "This is a prototype.",
    noticeText: "These services use mock data. They do not create an official government record.",
    eyebrow: "Driving licence services",
    title: "What do you need to do?",
    lede: "Choose a service to start. You can save your progress and return later on this device.",
    learnerTitle: "Apply for a Learner's Licence",
    learnerText: "Apply for your first licence to learn to drive a two-wheeler, car or commercial vehicle.",
    learnerMeta: "Takes about 15 to 20 minutes",
    learnerAction: "Start application",
    slotTitle: "Book a Driving Licence test slot",
    slotText: "Choose an available date and time for your driving test.",
    slotMeta: "Takes about 5 minutes",
    slotAction: "Book a slot",
    beforeTitle: "Before you start",
    beforeText: "Keep your mobile phone and licence details ready. Documents and slot availability are simulated in this prototype.",
    footer: "Sarathi Next is a hackathon prototype. It is not an official government service. No real application or booking is created.",
  },
  hi: {
    pageTitle: "सारथी नेक्स्ट — ड्राइविंग लाइसेंस सेवाएँ",
    description: "सारथी नेक्स्ट से लर्नर लाइसेंस के लिए आवेदन करें या ड्राइविंग लाइसेंस टेस्ट का स्लॉट बुक करें।",
    skip: "मुख्य सामग्री पर जाएँ",
    application: "मेरा आवेदन",
    languageLabel: "भाषा चुनें",
    noticeTitle: "यह एक प्रोटोटाइप है।",
    noticeText: "इन सेवाओं में नमूना डेटा इस्तेमाल होता है। इससे कोई आधिकारिक सरकारी रिकॉर्ड नहीं बनता।",
    eyebrow: "ड्राइविंग लाइसेंस सेवाएँ",
    title: "आप क्या करना चाहते हैं?",
    lede: "शुरू करने के लिए एक सेवा चुनें। आपकी प्रगति इस डिवाइस पर सेव रहेगी और आप बाद में लौट सकते हैं।",
    learnerTitle: "लर्नर लाइसेंस के लिए आवेदन करें",
    learnerText: "दो-पहिया वाहन, कार या व्यावसायिक वाहन चलाना सीखने के लिए अपने पहले लाइसेंस का आवेदन करें।",
    learnerMeta: "लगभग 15 से 20 मिनट लगेंगे",
    learnerAction: "आवेदन शुरू करें",
    slotTitle: "ड्राइविंग लाइसेंस टेस्ट का स्लॉट बुक करें",
    slotText: "अपने ड्राइविंग टेस्ट के लिए उपलब्ध तारीख और समय चुनें।",
    slotMeta: "लगभग 5 मिनट लगेंगे",
    slotAction: "स्लॉट बुक करें",
    beforeTitle: "शुरू करने से पहले",
    beforeText: "अपना मोबाइल फोन और लाइसेंस की जानकारी तैयार रखें। इस प्रोटोटाइप में दस्तावेज़ और स्लॉट की उपलब्धता काल्पनिक है।",
    footer: "सारथी नेक्स्ट एक हैकाथॉन प्रोटोटाइप है। यह आधिकारिक सरकारी सेवा नहीं है। कोई वास्तविक आवेदन या बुकिंग नहीं बनाई जाती।",
  },
};

function applyLanguage() {
  const copy = landingCopy[language];
  document.documentElement.lang = language;
  document.title = copy.pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", copy.description);
  document.querySelector("[data-copy=skip]").textContent = copy.skip;
  statusLink.textContent = copy.application;
  document.querySelector(".language-switcher").setAttribute("aria-label", copy.languageLabel);
  languageTabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.language === language)));
}

function updateHeader() { statusLink.hidden = !state.loggedIn; applyLanguage(); }
function go(view, push = true) {
  clearInterval(holdInterval);
  currentView = view;
  if (push) history.pushState({ view }, "", `#${view}`);
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function landingPage() {
  const copy = landingCopy[language];
  return `<section class="page landing-page" data-reveal>
    <aside class="mock-banner" aria-label="${copy.noticeTitle}"><strong>${copy.noticeTitle}</strong> ${copy.noticeText}</aside>
    <p class="eyebrow">${copy.eyebrow}</p>
    <h1>${copy.title}</h1>
    <p class="lede">${copy.lede}</p>
    <div class="service-grid" aria-label="${copy.eyebrow}">
      <article class="service-card">
        <span class="service-number" aria-hidden="true">01</span>
        <div class="service-card__body">
          <h2>${copy.learnerTitle}</h2>
          <p>${copy.learnerText}</p>
          <p class="service-meta">${copy.learnerMeta}</p>
        </div>
        <button class="service-action" type="button" data-go="learner-start">${copy.learnerAction}<span aria-hidden="true">→</span></button>
      </article>
      <article class="service-card">
        <span class="service-number" aria-hidden="true">02</span>
        <div class="service-card__body">
          <h2>${copy.slotTitle}</h2>
          <p>${copy.slotText}</p>
          <p class="service-meta">${copy.slotMeta}</p>
        </div>
        <button class="service-action" type="button" data-go="slots">${copy.slotAction}<span aria-hidden="true">→</span></button>
      </article>
    </div>
    <section class="section before-start" aria-labelledby="before-start-title">
      <h2 id="before-start-title">${copy.beforeTitle}</h2>
      <p>${copy.beforeText}</p>
    </section>
    <footer class="footer">${copy.footer}</footer>
  </section>`;
}

function startPage() {
  return `<section class="page start-page" data-reveal>
    ${mockBanner("You can complete the full Learner's Licence journey using demo data.")}
    <p class="eyebrow">Learner's Licence application</p>
    <h1>Apply for a Learner's Licence</h1>
    <p class="lede">Use this service if you are 18 or older and applying for the first time. It usually takes 15 to 20 minutes.</p>
    <section class="section start-details" aria-labelledby="before-starting">
      <h2 id="before-starting">Before you start</h2>
      <ul class="plain-list">
        <li>Have a photo, ID proof and address proof ready.</li>
        <li>Choose the type of vehicle you want to learn to drive.</li>
        <li>Book a mock online test time. Your selected slot will be held while you confirm.</li>
      </ul>
      <p class="hint">This prototype uses mock documents, mock availability and a mock test. Nothing is sent to a government service.</p>
    </section>
    <button class="button" type="button" data-go="aadhar-choice">Start now</button>
    ${footer()}
  </section>`;
}

function aadharChoicePage() {
  const copy = language === "hi" ? {
    eyebrow: "लर्नर लाइसेंस आवेदन",
    title: "आप कैसे आवेदन करना चाहते हैं?",
    lede: "आगे बढ़ने के लिए एक विकल्प चुनें। आपके चुनाव के आधार पर टेस्ट और दस्तावेज़ सत्यापन का तरीका तय होगा।",
    withTitle: "आधार के साथ आवेदन करें",
    withText: "आधार प्रमाणीकरण का उपयोग करके अपनी पहचान सत्यापित करें।",
    withoutTitle: "आधार के बिना आवेदन करें",
    withoutText: "आरटीओ में दस्तावेज़ सत्यापन के साथ आवेदन जारी रखें।",
    contextTitle: "चुनने से पहले यह जान लें",
    bullets: [
      "आधार प्रमाणीकरण का उपयोग करने वाले आवेदक घर या अपनी पसंद की किसी भी जगह से लर्नर लाइसेंस टेस्ट दे सकते हैं। आरटीओ जाना आवश्यक नहीं है।",
      "ऑनलाइन लर्नर लाइसेंस टेस्ट का पासवर्ड आधार से जुड़े पंजीकृत मोबाइल नंबर पर एसएमएस से भेजा जाएगा।",
      "सफल आवेदक अपना लर्नर लाइसेंस डाउनलोड कर सकते हैं।",
      "आधार के बिना आवेदन करने वाले व्यक्ति को दस्तावेज़ सत्यापन और लर्नर लाइसेंस टेस्ट के लिए आरटीओ जाना होगा।",
    ],
    next: "आगे बढ़ें",
    home: "होमपेज पर लौटें",
  } : {
    eyebrow: "Learner's Licence application",
    title: "How do you want to apply?",
    lede: "Choose one option to continue. Your choice determines how your test and document verification will be completed.",
    withTitle: "Apply with Aadhar",
    withText: "Verify your identity using Aadhar authentication.",
    withoutTitle: "Apply without Aadhar",
    withoutText: "Continue with document verification at an RTO.",
    contextTitle: "What you need to know before choosing",
    bullets: [
      "Applicants using Aadhar authentication can take the LL Test from their home or any preferred location. An RTO visit is not required.",
      "The password for the online LL Test will be sent by SMS to the registered mobile number linked with Aadhar.",
      "Successful applicants can download their Learner Licence.",
      "Applicants without Aadhar need to visit an RTO for document verification and the LL Test in person.",
    ],
    next: "Next",
    home: "Return to homepage",
  };
  const selected = state.aadharRoute;
  return `<section class="page choice-page">
    ${back("learner-start")}
    ${mockBanner(language === "hi" ? "आधार प्रमाणीकरण और आरटीओ प्रक्रिया इस प्रोटोटाइप में काल्पनिक है।" : "Aadhar authentication and RTO processing are simulated for this prototype.")}
    <p class="eyebrow">${copy.eyebrow}</p>
    <h1>${copy.title}</h1>
    <p class="lede">${copy.lede}</p>
    <form id="aadhar-form" novalidate>
      <div id="aadhar-errors"></div>
      <section class="section choice-context" aria-labelledby="choice-context-title">
        <h2 id="choice-context-title">${copy.contextTitle}</h2>
        <ul class="plain-list">${copy.bullets.map(item => `<li>${item}</li>`).join("")}</ul>
      </section>
      <fieldset class="choice-grid">
        <legend class="visually-hidden">${copy.title}</legend>
        <label class="choice-card">
          <input type="radio" name="aadharRoute" value="with-aadhar" ${selected === "with-aadhar" ? "checked" : ""}/>
          <span class="choice-card__mark" aria-hidden="true">A</span>
          <span class="choice-card__content"><strong>${copy.withTitle}</strong><small>${copy.withText}</small></span>
        </label>
        <label class="choice-card">
          <input type="radio" name="aadharRoute" value="without-aadhar" ${selected === "without-aadhar" ? "checked" : ""}/>
          <span class="choice-card__mark" aria-hidden="true">R</span>
          <span class="choice-card__content"><strong>${copy.withoutTitle}</strong><small>${copy.withoutText}</small></span>
        </label>
      </fieldset>
      <div class="decision-actions" ${selected ? "" : "hidden"}>
        <button class="button" type="submit">${copy.next}</button>
        <button class="button button--secondary" type="button" data-go="start">${copy.home}</button>
      </div>
    </form>
    ${footer()}
  </section>`;
}

function loginPage() {
  const copy = language === "hi" ? {
    title: "अपना आधार नंबर दर्ज करें",
    lede: "आधार से जुड़े मोबाइल नंबर पर वन-टाइम पासवर्ड पाने के लिए अपना 12 अंकों का आधार नंबर दर्ज करें।",
    notice: "आधार सत्यापन और एसएमएस इस प्रोटोटाइप में काल्पनिक हैं। कोई आधार नंबर या बायोमेट्रिक जानकारी भेजी या संग्रहीत नहीं की जाती।",
    aadharLabel: "आधार नंबर",
    aadharHint: "रिक्त स्थान के बिना 12 अंक दर्ज करें।",
    send: "ओटीपी भेजें",
    otpLabel: "वन-टाइम पासवर्ड (ओटीपी)",
    otpHint: "आपके आधार से जुड़े मोबाइल नंबर पर भेजा गया 6 अंकों का ओटीपी दर्ज करें।",
    declarations: "सहमति घोषणाएँ",
    consent: [
      "मैं परिवहन विभाग को ड्राइविंग लाइसेंस सेवाओं के लिए मेरे आधार नंबर, बायोमेट्रिक्स या ओटीपी का उपयोग करके मेरी पहचान सत्यापित करने की अनुमति देता/देती हूँ।",
      "मेरे प्रमाणीकरण डेटा का उपयोग केवल इस लेन-देन के लिए किया जाएगा।",
      "परिवहन विभाग मेरी व्यक्तिगत जानकारी को सुरक्षित और गोपनीय रखेगा।",
    ],
    authenticate: "प्रमाणित करें",
    another: "दूसरा तरीका आज़माएँ",
  } : {
    title: "Enter your Aadhar number",
    lede: "Enter your 12-digit Aadhar number to receive a one-time password on the mobile number linked with Aadhar.",
    notice: "Aadhar verification and SMS delivery are simulated in this prototype. No Aadhar number or biometric information is sent or stored.",
    aadharLabel: "Aadhar number",
    aadharHint: "Enter 12 digits without spaces.",
    send: "Send OTP",
    otpLabel: "One-time password (OTP)",
    otpHint: "Enter the 6-digit OTP sent to the mobile number linked with Aadhar.",
    declarations: "Consent declarations",
    consent: [
      "I allow the Transport Department to verify my identity for driving license services using my Aadhaar number, biometrics, or OTP.",
      "My authentication data will strictly be used for this transaction only.",
      "The Transport Department will ensure my personal information remains secure and confidential.",
    ],
    authenticate: "Authenticate",
    another: "Try another method",
  };
  return `<section class="page auth-page">
    ${back("aadhar-choice")}
    ${mockBanner(copy.notice)}
    <h1>${copy.title}</h1>
    <p class="lede">${copy.lede}</p>
    <form id="login-form" class="auth-form" novalidate>
      <div id="auth-errors"></div>
      <div class="field">
        <label for="aadhar-number">${copy.aadharLabel}</label>
        <p class="hint" id="aadhar-hint">${copy.aadharHint}</p>
        <input id="aadhar-number" name="aadharNumber" type="text" inputmode="numeric" maxlength="12" autocomplete="off" aria-describedby="aadhar-hint" />
      </div>
      <div class="inline-action"><button id="send-otp" class="button button--secondary" type="button">${copy.send}</button></div>
      <p id="otp-status" class="otp-status" aria-live="polite"></p>
      <div class="field">
        <label for="otp">${copy.otpLabel}</label>
        <p class="hint" id="otp-hint">${copy.otpHint}</p>
        <input id="otp" name="otp" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-describedby="otp-hint otp-status" />
      </div>
      <fieldset class="consent-list">
        <legend>${copy.declarations}</legend>
        ${copy.consent.map((item, index) => `<label class="consent-option"><input id="consent-${index + 1}" type="checkbox" name="consent" value="${index + 1}"/><span>${item}</span></label>`).join("")}
      </fieldset>
      <div class="decision-actions auth-actions">
        <button class="button" type="submit">${copy.authenticate}</button>
        <button class="button button--secondary" type="button" data-go="aadhar-choice">${copy.another}</button>
      </div>
    </form>
    ${footer()}
  </section>`;
}

function reviewDetailsPage() {
  if (state.aadharRoute !== "with-aadhar") return state.loggedIn ? taskListPage() : aadharChoicePage();
  const copy = language === "hi" ? {
    title: "अपनी जानकारी की समीक्षा करें",
    lede: "आगे बढ़ने से पहले अपने आधार से जुड़ी जानकारी जाँचें।",
    notice: "इस प्रोटोटाइप में यह जानकारी एक काल्पनिक सरकारी डेटाबेस से नमूना डेटा के रूप में दिखाई गई है।",
    personal: "व्यक्तिगत जानकारी",
    address: "पते की जानकारी",
    name: "आवेदक का नाम",
    relative: "रिश्तेदार का नाम",
    sex: "कानूनी लिंग",
    dob: "जन्म तिथि",
    blood: "ब्लड ग्रुप",
    phone: "आधार से जुड़ा मोबाइल नंबर",
    permanent: "स्थायी पता",
    present: "वर्तमान पता",
    photo: "आवेदक की तस्वीर",
    photoAlt: "आरव शर्मा की काल्पनिक नमूना तस्वीर",
    next: "आगे",
  } : {
    title: "Review details",
    lede: "Check the details linked with your Aadhar before continuing.",
    notice: "This prototype shows mock data from a simulated government database linked with your Aadhar card.",
    personal: "Personal Details",
    address: "Address Details",
    name: "Name of applicant",
    relative: "Name of relative",
    sex: "Legal sex",
    dob: "Date of birth",
    blood: "Blood group",
    phone: "Mobile number linked with Aadhar",
    permanent: "Permanent address",
    present: "Present address",
    photo: "Applicant photo",
    photoAlt: "Fictional mock portrait of Aarav Sharma",
    next: "Next",
  };
  const details = aadhaarReviewDetails || {
    name: "AARAV SHARMA",
    relative: "RAJESH SHARMA (FATHER)",
    sex: language === "hi" ? "पुरुष" : "Male",
    dateOfBirth: language === "hi" ? "14 मार्च 1998" : "14 March 1998",
    bloodGroup: "O Positive (O+)",
    phone: "******3210",
    permanentAddress: "42 LAKE VIEW ROAD, INDIRANAGAR, BENGALURU, KARNATAKA 560038",
    presentAddress: language === "hi" ? "स्थायी पते के समान" : "Same as permanent address",
  };
  const row = (label, value) => `<div><dt>${label}</dt><dd>${escapeText(value || "—")}</dd></div>`;
  return `<section class="page review-details-page">
    ${back("login")}
    ${mockBanner(copy.notice)}
    <h1>${copy.title}</h1>
    <p class="lede">${copy.lede}</p>
    <figure class="review-photo">
      <img src="/mock-applicant-aarav.png" width="160" height="160" alt="${copy.photoAlt}" />
      <figcaption>${copy.photo}</figcaption>
    </figure>
    <section class="form-section review-section" aria-labelledby="review-personal-heading">
      <h2 id="review-personal-heading">${copy.personal}</h2>
      <dl class="summary-list">
        ${row(copy.name, details.name)}
        ${row(copy.relative, details.relative)}
        ${row(copy.sex, details.sex)}
        ${row(copy.dob, details.dateOfBirth)}
        ${row(copy.blood, details.bloodGroup)}
        ${row(copy.phone, details.phone)}
      </dl>
    </section>
    <section class="form-section review-section" aria-labelledby="review-address-heading">
      <h2 id="review-address-heading">${copy.address}</h2>
      <dl class="summary-list">
        ${row(copy.permanent, details.permanentAddress)}
        ${row(copy.present, details.presentAddress)}
      </dl>
    </section>
    <div class="decision-actions"><button class="button" type="button" data-go="tasks">${copy.next}</button></div>
    ${footer()}
  </section>`;
}

function mobileAuthPage() {
  const copy = language === "hi" ? {
    title: "अपना मोबाइल नंबर दर्ज करें",
    lede: "आवेदन की स्थिति से जुड़ी जानकारी पाने और अपनी पहचान सत्यापित करने के लिए अपना मोबाइल नंबर दर्ज करें।",
    notice: "एसएमएस और ओटीपी सत्यापन इस प्रोटोटाइप में काल्पनिक हैं। कोई मोबाइल नंबर भेजा या संग्रहीत नहीं किया जाता।",
    phoneLabel: "मोबाइल नंबर",
    phoneHint: "10 अंकों का मोबाइल नंबर दर्ज करें।",
    send: "ओटीपी भेजें",
    otpLabel: "वन-टाइम पासवर्ड (ओटीपी)",
    otpHint: "मोबाइल नंबर पर भेजा गया 6 अंकों का ओटीपी दर्ज करें।",
    resend: "ओटीपी दोबारा भेजें",
    declaration: "मैं अपने मोबाइल नंबर पर आवेदन की स्थिति के अपडेट पाने के लिए सहमत हूँ।",
    next: "आगे बढ़ें",
    another: "दूसरा तरीका आज़माएँ",
  } : {
    title: "Enter your phone number",
    lede: "Enter your mobile number to verify your identity and receive status updates about your application.",
    notice: "SMS and OTP verification are simulated in this prototype. No mobile number is sent or stored.",
    phoneLabel: "Phone number",
    phoneHint: "Enter a 10-digit mobile number.",
    send: "Send OTP",
    otpLabel: "One-time password (OTP)",
    otpHint: "Enter the 6-digit OTP sent to your mobile number.",
    resend: "Resend OTP",
    declaration: "I agree to receive application status updates on my mobile number.",
    next: "Next",
    another: "Try another method",
  };
  return `<section class="page auth-page">
    ${back("aadhar-choice")}
    ${mockBanner(copy.notice)}
    <h1>${copy.title}</h1>
    <p class="lede">${copy.lede}</p>
    <form id="mobile-auth-form" class="auth-form" novalidate>
      <div id="mobile-auth-errors"></div>
      <div class="field">
        <label for="mobile-number">${copy.phoneLabel}</label>
        <p class="hint" id="mobile-hint">${copy.phoneHint}</p>
        <input id="mobile-number" name="mobileNumber" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" aria-describedby="mobile-hint" value="${escapeText(verifiedMobile)}" />
      </div>
      <div class="inline-action"><button id="send-mobile-otp" class="button button--secondary" type="button">${copy.send}</button></div>
      <p id="mobile-otp-status" class="otp-status" aria-live="polite"></p>
      <div class="field">
        <label for="mobile-otp">${copy.otpLabel}</label>
        <p class="hint" id="mobile-otp-hint">${copy.otpHint}</p>
        <input id="mobile-otp" name="mobileOtp" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-describedby="mobile-otp-hint mobile-otp-status" />
      </div>
      <div class="inline-action"><button id="resend-mobile-otp" class="quiet-link" type="button">${copy.resend}</button></div>
      <fieldset class="consent-list single-consent">
        <legend class="visually-hidden">${language === "hi" ? "सहमति" : "Consent"}</legend>
        <label class="consent-option"><input id="mobile-consent" type="checkbox" name="mobileConsent"/><span>${copy.declaration}</span></label>
      </fieldset>
      <div class="decision-actions auth-actions">
        <button class="button" type="submit">${copy.next}</button>
        <button class="button button--secondary" type="button" data-go="aadhar-choice">${copy.another}</button>
      </div>
    </form>
    ${footer()}
  </section>`;
}

function personalDetailsPage() {
  const hi = language === "hi";
  const copy = hi ? {
    title: "अपनी व्यक्तिगत जानकारी दर्ज करें", lede: "अपने लर्नर लाइसेंस आवेदन के लिए व्यक्तिगत और पते की जानकारी भरें।", notice: "यह जानकारी केवल इस प्रोटोटाइप में दिखाई जाती है। इसे किसी सरकारी सेवा को नहीं भेजा जाता।", mandatory: "* चिह्नित फ़ील्ड अनिवार्य हैं", personal: "व्यक्तिगत जानकारी", applicant: "आवेदक का नाम", relative: "रिश्तेदार का नाम", relation: "कार्डधारक के अभिभावक/रिश्तेदार", sex: "कानूनी लिंग", selfDescribe: "अपना विवरण लिखें (वैकल्पिक)", dob: "जन्म तिथि", dobHint: "तारीख DD-MM-YYYY प्रारूप में चुनें।", age: "आयु", blood: "ब्लड ग्रुप", phone: "आवेदक का फोन नंबर", phoneHint: "सत्यापित मोबाइल नंबर से अपने आप भरा गया।", emergency: "आपातकालीन फोन नंबर", emergencyHint: "10 अंकों का वैकल्पिक मोबाइल नंबर दर्ज करें।", mark: "पहचान चिह्न", mark1: "पहचान चिह्न 1", mark2: "पहचान चिह्न 2", address: "पते की जानकारी", same: "वर्तमान पता स्थायी पते के समान है", permanent: "स्थायी पते की जानकारी", present: "वर्तमान पते की जानकारी", state: "राज्य", pin: "पिन कोड", declaration: "घोषणा", consent: "मैं घोषणा करता/करती हूँ कि ऊपर दी गई जानकारी मेरी सर्वोत्तम जानकारी के अनुसार सही है।", submit: "जमा करें", reset: "रीसेट करें", choose: "चुनें", first: "पहला नाम", middle: "मध्य नाम", last: "अंतिम नाम",
  } : {
    title: "Enter your personal details", lede: "Provide your personal and address details for your Learner's Licence application.", notice: "These details are used only within this prototype. Nothing is sent to a government service.", mandatory: "* Marked fields are mandatory", personal: "Personal details", applicant: "Name of Applicant", relative: "Name of Relative", relation: "Cardholder's Guardian/Relative", sex: "Legal Sex", selfDescribe: "Self-describe (optional)", dob: "Date of Birth", dobHint: "Choose the date in DD-MM-YYYY format.", age: "Age", blood: "Blood Group", phone: "Applicant's Phone Number", phoneHint: "Automatically fetched from your verified mobile number.", emergency: "Emergency Phone Number", emergencyHint: "Enter an alternate 10-digit mobile number.", mark: "Identification Mark", mark1: "Identification mark 1", mark2: "Identification mark 2", address: "Address details", same: "Present Address same as Permanent Address", permanent: "Permanent address details", present: "Present address details", state: "State", pin: "Pin code", declaration: "Declaration", consent: "I declare that the details above are correct to the best of my knowledge.", submit: "Submit", reset: "Reset", choose: "Choose", first: "First name", middle: "Middle name", last: "Last name",
  };
  const value = name => escapeText(personalDraft[name] || "");
  const selected = (name, option) => personalDraft[name] === option ? "selected" : "";
  const stateOptions = name => `<option value="">${copy.choose}</option>${indianStates.map(item => `<option value="${item}" ${selected(name, item)}>${item}</option>`).join("")}`;
  const nameFields = prefix => `<div class="name-grid">
    <div class="field"><label for="${prefix}-first">${copy.first}</label><input id="${prefix}-first" name="${prefix}First" type="text" autocomplete="${prefix === "applicant" ? "given-name" : "off"}" value="${value(`${prefix}First`)}" data-uppercase /></div>
    <div class="field"><label for="${prefix}-middle">${copy.middle}</label><input id="${prefix}-middle" name="${prefix}Middle" type="text" autocomplete="${prefix === "applicant" ? "additional-name" : "off"}" value="${value(`${prefix}Middle`)}" data-uppercase /></div>
    <div class="field"><label for="${prefix}-last">${copy.last}</label><input id="${prefix}-last" name="${prefix}Last" type="text" autocomplete="${prefix === "applicant" ? "family-name" : "off"}" value="${value(`${prefix}Last`)}" data-uppercase /></div>
  </div>`;
  const relationOptions = hi ? [["father", "पिता का नाम"], ["mother", "माता का नाम"], ["husband", "पति का नाम"], ["guardian", "अभिभावक का नाम"]] : [["father", "Father's Name"], ["mother", "Mother's Name"], ["husband", "Husband's Name"], ["guardian", "Guardian's Name"]];
  const sexOptions = hi ? [["female", "महिला"], ["male", "पुरुष"], ["non-binary", "नॉन-बाइनरी"], ["prefer-not", "नहीं बताना चाहते"], ["self-describe", "स्वयं वर्णन करें"]] : [["female", "Female"], ["male", "Male"], ["non-binary", "Non-binary"], ["prefer-not", "Prefer not to say"], ["self-describe", "Self-describe"]];
  const bloodOptions = ["A Positive (A+)", "A Negative (A-)", "B Positive (B+)", "B Negative (B-)", "O Positive (O+)", "O Negative (O-)", "AB Positive (AB+)", "AB Negative (AB-)"];
  return `<section class="page details-page">
    ${back("mobile-auth")}${mockBanner(copy.notice)}
    <h1>${copy.title}</h1><p class="lede">${copy.lede}</p><p class="mandatory-note">${copy.mandatory}</p>
    <form id="personal-details-form" novalidate><div id="personal-details-errors"></div>
      <section class="form-section" aria-labelledby="personal-heading"><h2 id="personal-heading">${copy.personal}</h2>
        <fieldset><legend><span aria-hidden="true">* </span>${copy.applicant}</legend>${nameFields("applicant")}</fieldset>
        <fieldset><legend><span aria-hidden="true">* </span>${copy.relative}</legend>
          <div class="field"><label for="relative-type"><span aria-hidden="true">* </span>${copy.relation}</label><select id="relative-type" name="relativeType"><option value="">${copy.choose}</option>${relationOptions.map(([key, label]) => `<option value="${key}" ${selected("relativeType", key)}>${label}</option>`).join("")}</select></div>${nameFields("relative")}
        </fieldset>
        <div class="field"><label for="legal-sex"><span aria-hidden="true">* </span>${copy.sex}</label><select id="legal-sex" name="legalSex"><option value="">${copy.choose}</option>${sexOptions.map(([key, label]) => `<option value="${key}" ${selected("legalSex", key)}>${label}</option>`).join("")}</select></div>
        <div class="field" id="self-describe-field" ${personalDraft.legalSex === "self-describe" ? "" : "hidden"}><label for="self-describe">${copy.selfDescribe}</label><input id="self-describe" name="selfDescribe" type="text" value="${value("selfDescribe")}" data-uppercase /></div>
        <div class="two-column-grid"><div class="field"><label for="date-of-birth"><span aria-hidden="true">* </span>${copy.dob}</label><p class="hint" id="dob-hint">${copy.dobHint}</p><input id="date-of-birth" name="dateOfBirth" type="date" aria-describedby="dob-hint" value="${value("dateOfBirth")}" max="${new Date().toISOString().slice(0, 10)}" /></div><div class="field"><label for="age">${copy.age}</label><input id="age" name="age" type="text" inputmode="numeric" value="${value("age")}" readonly /></div></div>
        <div class="field"><label for="blood-group"><span aria-hidden="true">* </span>${copy.blood}</label><select id="blood-group" name="bloodGroup"><option value="">${copy.choose}</option>${bloodOptions.map(item => `<option value="${item}" ${selected("bloodGroup", item)}>${item}</option>`).join("")}</select></div>
        <div class="field"><label for="applicant-phone"><span aria-hidden="true">* </span>${copy.phone}</label><p class="hint" id="applicant-phone-hint">${copy.phoneHint}</p><input id="applicant-phone" name="applicantPhone" type="tel" value="${escapeText(verifiedMobile)}" aria-describedby="applicant-phone-hint" readonly /></div>
        <div class="field"><label for="emergency-phone"><span aria-hidden="true">* </span>${copy.emergency}</label><p class="hint" id="emergency-phone-hint">${copy.emergencyHint}</p><input id="emergency-phone" name="emergencyPhone" type="tel" inputmode="numeric" maxlength="10" value="${value("emergencyPhone")}" aria-describedby="emergency-phone-hint" data-numeric /></div>
        <fieldset><legend><span aria-hidden="true">* </span>${copy.mark}</legend><div class="two-column-grid"><div class="field"><label for="mark-one">${copy.mark1}</label><input id="mark-one" name="markOne" type="text" value="${value("markOne")}" data-uppercase /></div><div class="field"><label for="mark-two">${copy.mark2}</label><input id="mark-two" name="markTwo" type="text" value="${value("markTwo")}" data-uppercase /></div></div></fieldset>
      </section>
      <section class="form-section" aria-labelledby="address-heading"><h2 id="address-heading">${copy.address}</h2>
        <label class="switch-option" for="same-address"><input id="same-address" name="sameAddress" type="checkbox" role="switch" ${personalDraft.sameAddress !== false ? "checked" : ""}/><span>${copy.same}</span></label>
        <fieldset><legend>${copy.permanent}</legend><div class="two-column-grid"><div class="field"><label for="permanent-state"><span aria-hidden="true">* </span>${copy.state}</label><select id="permanent-state" name="permanentState">${stateOptions("permanentState")}</select></div><div class="field"><label for="permanent-pin"><span aria-hidden="true">* </span>${copy.pin}</label><input id="permanent-pin" name="permanentPin" type="text" inputmode="numeric" maxlength="6" value="${value("permanentPin")}" data-numeric /></div></div></fieldset>
        <fieldset id="present-address-fields" ${personalDraft.sameAddress !== false ? "hidden" : ""}><legend>${copy.present}</legend><div class="two-column-grid"><div class="field"><label for="present-state"><span aria-hidden="true">* </span>${copy.state}</label><select id="present-state" name="presentState">${stateOptions("presentState")}</select></div><div class="field"><label for="present-pin"><span aria-hidden="true">* </span>${copy.pin}</label><input id="present-pin" name="presentPin" type="text" inputmode="numeric" maxlength="6" value="${value("presentPin")}" data-numeric /></div></div></fieldset>
      </section>
      <fieldset class="consent-list single-consent"><legend>${copy.declaration}</legend><label class="consent-option"><input id="details-consent" name="detailsConsent" type="checkbox" ${personalDraft.detailsConsent ? "checked" : ""}/><span>${copy.consent}</span></label></fieldset>
      <div class="decision-actions auth-actions"><button class="button" type="submit">${copy.submit}</button><button id="reset-personal-details" class="button button--secondary" type="reset">${copy.reset}</button></div>
    </form>${footer()}
  </section>`;
}

function taskStatus(step) {
  const aadhaarDocumentsReady = state.documents.photoDecision === "recent" || (state.documents.photoDecision === "replace" && state.documents.photo);
  const identityDocumentsReady = state.aadharRoute === "with-aadhar" ? aadhaarDocumentsReady : Boolean(state.documents.id && state.documents.address);
  const done = { category: Boolean(state.category), documents: Boolean(identityDocumentsReady && state.documents.signature && state.documents.digitallySigned && state.documents.formSubmitted), slot: Boolean(state.slot && state.paymentConfirmed), test: state.testPassed, licence: state.testPassed };
  const prerequisites = { documents: done.category, slot: done.documents, test: done.slot, licence: done.test };
  if (done[step]) return ["Completed", "complete"];
  if (step !== "category" && !prerequisites[step]) return ["Cannot start yet", "blocked"];
  const orderedSteps = ["category", "documents", "slot", "test", "licence"];
  const firstAvailable = orderedSteps.find(key => !done[key] && (key === "category" || prerequisites[key]));
  return step === firstAvailable ? ["In progress", "progress"] : ["Not started", "not-started"];
}
function taskListPage() {
  const tasks = [
    ["category", "Choose vehicle category", "category"], ["documents", "Upload your documents", "documents"],
    ["slot", "Book your test slot", "slots"], ["test", "Take the mock test", "quiz"], ["licence", "Get your Learner's Licence", "certificate"],
  ];
  const completeCount = tasks.filter(([key]) => taskStatus(key)[0] === "Completed").length;
  return `<section class="page task-hub">
    ${mockBanner("Your progress is saved only in this browser for the demo.")}
    <h1>Your application tasks</h1>
    <p class="lede">Complete each task in order. You can return here at any time.</p>
    <p class="progress-note"><strong>${completeCount} of 5 tasks completed.</strong> Complete the next available task to continue.</p>
    <ol class="task-list">${tasks.map(([key, label, route], index) => {
      const [labelStatus, tone] = taskStatus(key); const blocked = labelStatus === "Cannot start yet"; const active = labelStatus === "In progress";
      return `<li class="task task--${tone}"><span class="task-number" aria-hidden="true">${index + 1}</span><div class="task-content"><strong class="task-title">${label}</strong><span class="status status--${tone}">${tone === "complete" ? "Completed" : labelStatus}</span></div>${active ? `<button class="task-action" type="button" data-go="${route}">${key === "documents" ? "Upload documents" : "Continue"}</button>` : (blocked ? "" : `<button class="task-change" type="button" data-go="${route}">${tone === "complete" ? "Change" : "Open"}</button>`)}</li>`;
    }).join("")}</ol>
    ${footer()}
  </section>`;
}

function categoryPage() {
  const selected = state.category;
  return `<section class="page">
    ${back("tasks")}${mockBanner()}
    <h1>What will you drive?</h1><p class="lede">Choose the main type of vehicle you want to learn to drive.</p>
    <form id="category-form" novalidate><div id="category-errors"></div><fieldset><legend class="visually-hidden">Vehicle category</legend>
      ${categoryOptions.map(([id, name, code]) => `<label class="radio-option"><input type="radio" name="category" value="${id}" ${selected === id ? "checked" : ""}/><span>${name}<small>${code}</small></span></label>`).join("")}
    </fieldset><button class="button" type="submit">Continue</button></form>${footer()}
  </section>`;
}

function documentsPage() {
  const hi = language === "hi";
  const isAadhaar = state.aadharRoute === "with-aadhar";
  const copy = hi ? {
    title: "अपने दस्तावेज़ अपलोड करें", lede: isAadhaar ? "अपनी तस्वीर की पुष्टि करें और एक नमूना हस्ताक्षर जोड़ें।" : "आयु प्रमाण, पते का प्रमाण और एक नमूना हस्ताक्षर जोड़ें। सभी फ़ाइलों की जाँच केवल इस ब्राउज़र में होती है।", age: "आयु प्रमाण", address: "पते का प्रमाण", signature: "हस्ताक्षर", proofHint: "500KB से कम की छवि या PDF अपलोड करें। यह फ़ाइल केवल डेमो के लिए आपके ब्राउज़र में रहती है।", photo: "आवेदक की तस्वीर", photoHint: "500KB से कम की हाल की तस्वीर अपलोड करें। फोन पर आप कैमरे से नई तस्वीर ले सकते हैं।", currentPhoto: "आधार से मिली मौजूदा तस्वीर", recentPhotoReady: "आपने पुष्टि की है कि यह तस्वीर हाल की है।", changePhoto: "नई तस्वीर इस्तेमाल करें", useFetchedPhoto: "मौजूदा तस्वीर इस्तेमाल करें", signatureHint: "इस प्रोटोटाइप के लिए तैयार किया गया नमूना हस्ताक्षर जोड़ें। किसी वास्तविक हस्ताक्षर की आवश्यकता नहीं है।", choose: "फ़ाइल चुनें", choosePhoto: "तस्वीर लें या चुनें", none: "कोई फ़ाइल नहीं चुनी गई", mockUpload: "नमूना हस्ताक्षर अपलोड करें", mockReady: "नमूना हस्ताक्षर तैयार है", photoQuestion: "क्या यह आपकी हाल की तस्वीर है?", photoQuestionHint: "हमने यह नमूना तस्वीर आधार से जुड़े एक काल्पनिक सरकारी डेटाबेस से प्राप्त की है।", yes: "हाँ", no: "नहीं", form: "स्व-सत्यापित फॉर्म", formText: "यह पहले से भरा लर्नर लाइसेंस आवेदन आपके पिछले उत्तरों से बनाया गया है। विवरण जाँचें और नमूना हस्ताक्षर से डिजिटल रूप से हस्ताक्षर करें।", preview: "आवेदन फॉर्म देखें", hide: "पूर्वावलोकन छिपाएँ", sign: "डिजिटल हस्ताक्षर करें", signDone: "फॉर्म पर डिजिटल हस्ताक्षर हो गए हैं।", signNeedPreview: "डिजिटल हस्ताक्षर करने से पहले आवेदन फॉर्म देखें।", signNeedMock: "पहले नमूना हस्ताक्षर अपलोड करें।", heading: "लर्नर लाइसेंस आवेदन फॉर्म", applicant: "आवेदक", relative: "रिश्तेदार", phone: "फोन नंबर", dob: "जन्म तिथि और आयु", sexBlood: "कानूनी लिंग और ब्लड ग्रुप", emergency: "आपातकालीन फोन", marks: "पहचान चिह्न", permanent: "स्थायी पता", present: "वर्तमान पता", vehicle: "वाहन श्रेणी", signed: "डिजिटल हस्ताक्षर", noSignature: "फॉर्म की समीक्षा करने के बाद डिजिटल हस्ताक्षर करें।", submit: "जमा करें",
  } : {
    title: "Upload your documents", lede: isAadhaar ? "Confirm your photo and add a mock signature." : "Add your age proof, address proof and a mock signature. Every file is checked only in this browser.", age: "Age proof", address: "Address proof", signature: "Signature", proofHint: "Upload an image or PDF under 500KB. This file remains in your browser for the demo only.", photo: "Applicant photo", photoHint: "Upload a recent image under 500KB. On a phone, you can take a new photo with your camera.", currentPhoto: "Current photo fetched with Aadhar", recentPhotoReady: "You confirmed that this photo is recent.", changePhoto: "Use a new photo", useFetchedPhoto: "Use fetched photo", signatureHint: "Add the signature generated for this prototype. You do not need to provide a real signature.", choose: "Choose a file", choosePhoto: "Take or choose a photo", none: "No file chosen", mockUpload: "Upload mock signature", mockReady: "Mock signature is ready", photoQuestion: "Is this a recent photo of you?", photoQuestionHint: "We fetched this mock photo from a simulated government database linked with your Aadhar.", yes: "Yes", no: "No", form: "Self-Attested form", formText: "This pre-filled Learner's Licence application uses details from your previous answers. Review the details and sign digitally with the mock signature.", preview: "Preview application form", hide: "Hide preview", sign: "Sign digitally", signDone: "The form has been digitally signed.", signNeedPreview: "Preview the application form before signing digitally.", signNeedMock: "Upload the mock signature first.", heading: "Learner's Licence application form", applicant: "Applicant", relative: "Relative", phone: "Phone number", dob: "Date of birth and age", sexBlood: "Legal sex and blood group", emergency: "Emergency phone", marks: "Identification marks", permanent: "Permanent address", present: "Present address", vehicle: "Vehicle category", signed: "Digital signature", noSignature: "Review the form, then use Sign digitally.", submit: "Submit",
  };
  const item = (id, label, stored) => `<section class="upload-row"><h2>${label}</h2><p class="hint">${copy.proofHint}</p><label class="button button--secondary" for="${id}">${copy.choose}</label><input id="${id}" name="${id}" type="file" accept="image/*,.pdf,application/pdf" data-document="${id}" ${stored ? "" : "required"}/><p id="${id}-result" class="file-result ${stored ? "file-result--success" : ""}" aria-live="polite">${stored ? `✓ ${escapeText(stored)}` : copy.none}</p></section>`;
  const photoStep = state.documents.photoDecision === "recent" ? `<section class="upload-row applicant-photo-row"><h2>${copy.photo}</h2><p class="hint">${copy.recentPhotoReady}</p><img class="document-applicant-photo" src="/mock-applicant-aarav.png" width="160" height="160" alt="${copy.currentPhoto}"/><div><button id="replace-fetched-photo" class="quiet-link" type="button">${copy.changePhoto}</button></div></section>` : `<section class="upload-row applicant-photo-row"><h2>${copy.photo}</h2><p class="hint">${copy.photoHint}</p><label class="button button--secondary" for="photo">${copy.choosePhoto}</label><input id="photo" name="photo" type="file" accept="image/*" capture="user" data-document="photo" ${state.documents.photo ? "" : "required"}/><p id="photo-result" class="file-result ${state.documents.photo ? "file-result--success" : ""}" aria-live="polite">${state.documents.photo ? `✓ ${escapeText(state.documents.photo)}` : copy.none}</p><img id="photo-upload-preview" class="document-applicant-photo" src="${photoPreviewUrl}" width="160" height="160" alt="${copy.photo}" ${photoPreviewUrl ? "" : "hidden"}/><button id="use-fetched-photo" class="quiet-link" type="button">${copy.useFetchedPhoto}</button></section>`;
  const fullName = prefix => [personalDraft[`${prefix}First`], personalDraft[`${prefix}Middle`], personalDraft[`${prefix}Last`]].filter(Boolean).join(" ") || "Not provided";
  const relationLabels = { father: "Father", mother: "Mother", husband: "Husband", guardian: "Guardian" };
  const formatDob = value => value ? value.split("-").reverse().join("-") : "Not provided";
  const addressLine = prefix => [personalDraft[`${prefix}State`], personalDraft[`${prefix}Pin`]].filter(Boolean).join(" — ") || "Not provided";
  const permanentAddress = addressLine("permanent");
  const presentAddress = personalDraft.sameAddress !== false ? permanentAddress : addressLine("present");
  const [, vehicleName, vehicleCode] = categoryInfo();
  const summaryRow = (label, value) => `<div><dt>${label}</dt><dd>${escapeText(value)}</dd></div>`;
  return `<section class="page documents-page">
    ${back("tasks")}${mockBanner(hi ? "फ़ाइल और हस्ताक्षर की जाँच आपके ब्राउज़र में होती है। कुछ भी अपलोड या संग्रहीत नहीं किया जाता।" : "File and signature checks happen in your browser. Nothing is uploaded or stored by us.")}
    <h1>${copy.title}</h1><p class="lede">${copy.lede}</p>
    ${isAadhaar && !state.documents.photoDecision ? `<div class="photo-dialog-backdrop"><section class="photo-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-dialog-title" aria-describedby="photo-dialog-description"><img src="/mock-applicant-aarav.png" width="180" height="180" alt="${copy.currentPhoto}"/><div><h2 id="photo-dialog-title">${copy.photoQuestion}</h2><p id="photo-dialog-description">${copy.photoQuestionHint}</p><div class="button-row"><button id="photo-is-recent" class="button" type="button">${copy.yes}</button><button id="photo-is-not-recent" class="button button--secondary" type="button">${copy.no}</button></div></div></section></div>` : ""}
    <form id="documents-form" novalidate><div id="document-errors"></div>
      ${isAadhaar ? photoStep : `${item("id", copy.age, state.documents.id)}${item("address", copy.address, state.documents.address)}`}
      <section class="upload-row"><h2>${copy.signature}</h2><p class="hint">${copy.signatureHint}</p><button id="upload-mock-signature" class="button button--secondary" type="button">${copy.mockUpload}</button><p id="signature-result" class="file-result ${state.documents.signature ? "file-result--success" : ""}" aria-live="polite">${state.documents.signature ? `✓ ${copy.mockReady}` : copy.none}</p><img id="signature-upload-preview" class="signature-upload-preview" src="${signaturePreviewUrl}" alt="${copy.signature}" ${signaturePreviewUrl ? "" : "hidden"}/></section>
      <section class="upload-row self-attested-card"><h2>${copy.form}</h2><p>${copy.formText}</p><div class="document-actions"><button id="preview-app-form" class="button button--secondary" type="button">${selfAttestedPreviewOpen ? copy.hide : copy.preview}</button><button id="sign-digitally" class="button button--secondary" type="button">${copy.sign}</button></div><p id="digital-sign-status" class="otp-status" aria-live="polite">${state.documents.digitallySigned ? `<strong>✓ ${copy.signDone}</strong>` : ""}</p></section>
      <section id="application-form-preview" class="application-preview" aria-labelledby="application-preview-title" ${selfAttestedPreviewOpen ? "" : "hidden"}>
        <div class="application-preview__head"><p class="eyebrow">Sarathi Next</p><h2 id="application-preview-title">${copy.heading}</h2><p class="hint">${hi ? "स्व-सत्यापित प्रोटोटाइप प्रति" : "Self-attested prototype copy"}</p></div>
        <dl class="summary-list application-summary">
          ${summaryRow(copy.applicant, fullName("applicant"))}
          ${summaryRow(copy.relative, `${relationLabels[personalDraft.relativeType] || "Relative"}: ${fullName("relative")}`)}
          ${summaryRow(copy.phone, verifiedMobile || "Not provided")}
          ${summaryRow(copy.dob, `${formatDob(personalDraft.dateOfBirth)}${personalDraft.age ? ` — ${personalDraft.age} years` : ""}`)}
          ${summaryRow(copy.sexBlood, `${personalDraft.legalSex || "Not provided"} — ${personalDraft.bloodGroup || "Not provided"}`)}
          ${summaryRow(copy.emergency, personalDraft.emergencyPhone || "Not provided")}
          ${summaryRow(copy.marks, [personalDraft.markOne, personalDraft.markTwo].filter(Boolean).join("; ") || "Not provided")}
          ${summaryRow(copy.permanent, permanentAddress)}${summaryRow(copy.present, presentAddress)}
          ${summaryRow(copy.vehicle, `${vehicleName} — ${vehicleCode}`)}
        </dl>
        <section class="digital-signature" aria-labelledby="digital-signature-title"><h3 id="digital-signature-title">${copy.signed}</h3><img id="application-signature-preview" src="${signaturePreviewUrl}" alt="${copy.signature}" ${state.documents.digitallySigned && signaturePreviewUrl ? "" : "hidden"}/><p id="signature-placeholder" class="hint" ${state.documents.digitallySigned && signaturePreviewUrl ? "hidden" : ""}>${copy.noSignature}</p></section>
      </section>
      <div class="decision-actions"><button class="button" type="submit">${copy.submit}</button></div>
    </form>${footer()}
  </section>`;
}

function slotsPage() {
  const byDate = slots.reduce((out, slot) => { (out[slot.date] ||= []).push(slot); return out; }, {});
  return `<section class="page">
    ${back("tasks")}${mockBanner("Slot availability and payment are simulated for this prototype.")}
    <h1>Choose a time for your mock test</h1><p class="lede">Seats shown below are mock availability. A selected available slot is held for five minutes while you confirm.</p>
    <form id="slot-form" novalidate><div id="slot-errors"></div><fieldset><legend class="visually-hidden">Available test slots</legend>
      ${Object.entries(byDate).map(([date, daySlots]) => `<section class="slot-day"><h2>${date}</h2>${daySlots.map(slot => `<label class="slot-option"><input type="radio" name="slot" value="${slot.id}" ${slot.id === state.slot ? "checked" : ""}/><span><strong>${slot.time}</strong></span><span class="seat-count ${slot.seats ? "" : "seat-count--full"}">Avl: ${slot.seats}</span></label>`).join("")}</section>`).join("")}
    </fieldset><button class="button" type="submit">Hold this slot</button></form>${footer()}
  </section>`;
}

function holdPage() {
  const slot = slotInfo();
  if (!slot) return slotsPage();
  const isFull = slot.seats === 0;
  return `<section class="page">
    ${back("slots")}${mockBanner("This hold and payment confirmation are simulated. No money is collected.")}
    <h1>${isFull ? "This slot is now full" : "Your slot is being held"}</h1>
    ${isFull ? `<p class="lede">The time you selected has no seats available. You can join the mock waitlist instead of starting again.</p><div class="button-row"><button class="button" type="button" id="waitlist">Join waitlist</button><button class="quiet-link" type="button" data-go="slots">Choose another time</button></div>` : `<p class="lede"><strong>${slot.date}, ${slot.time}</strong></p><section class="hold-box"><p><strong>Held for you while you confirm</strong></p><p class="timer" id="timer" aria-live="polite">5:00</p><p class="hint">Other mock users cannot take this held slot. Confirm before the timer ends.</p></section><dl class="summary-list hold-summary"><div><dt>Test slot</dt><dd>${slot.date}<br>${slot.time}</dd></div></dl><div class="button-row"><button class="button" id="confirm-slot" type="button">Confirm mock payment</button><button class="quiet-link" type="button" data-go="slots">Choose another time</button></div>`}${footer()}
  </section>`;
}

function quizPage() {
  const currentQuestions = activeQuestions();
  const q = currentQuestions[state.quizIndex];
  if (!q) return resultPage();
  return `<section class="page">
    ${back("tasks")}${mockBanner("This short quiz is a mock learning check. It is not a real licensing test or proctored assessment.")}
    <p class="quiz-progress">Question ${state.quizIndex + 1} of ${currentQuestions.length}</p><h1>${q.text}</h1>
    <form id="quiz-form" novalidate><div id="quiz-errors"></div><fieldset><legend class="visually-hidden">Answer options</legend>${q.answers.map((answer, index) => `<label class="radio-option"><input type="radio" name="answer" value="${index}"/><span>${escapeText(answer.text || answer)}</span></label>`).join("")}</fieldset><button class="button" type="submit">Continue</button></form>${footer()}
  </section>`;
}

function resultPage() {
  const currentQuestions = activeQuestions();
  const passed = state.testId ? state.testPassed : state.quizScore >= 4;
  return `<section class="page">${back("tasks")}${mockBanner("The test result is mock data for this prototype.")}
    <section class="result ${passed ? "" : "result--fail"}"><h1>${passed ? "You passed the mock test" : "You can try the mock test again"}</h1><p>You answered <strong>${state.quizScore} of ${currentQuestions.length}</strong> questions correctly. ${passed ? "You can now view your mock e-Learner's Licence." : `You need ${state.testPassMark || 4} correct answers to pass this practice test.`}</p></section>
    <div class="button-row">${passed ? `<button class="button" type="button" data-go="certificate">View your mock licence</button>` : `<button class="button" id="retry-quiz" type="button">Try again</button>`}<button class="quiet-link" type="button" data-go="tasks">Return to tasks</button></div>${footer()}
  </section>`;
}

function certificatePage() {
  const [, category, code] = categoryInfo();
  return `<section class="page">${back("tasks")}${mockBanner("This e-Learner's Licence is a mock artefact. It has no legal validity.")}
    <section class="result"><h1>Your mock e-Learner's Licence is ready</h1><p>This confirms that you completed the demo journey. It is not a legal licence or government record.</p></section>
    <section class="certificate" aria-label="Mock Learner's Licence certificate"><div class="certificate-head"><div><p class="eyebrow">Demo certificate</p><p class="certificate-title">e-Learner's Licence</p></div><span class="certificate-mark">✓ Issued</span></div><dl class="summary-list"><div><dt>Applicant</dt><dd>Demo Applicant</dd></div><div><dt>Vehicle category</dt><dd>${category}<br><span class="muted">${code}</span></dd></div><div><dt>Reference number</dt><dd>SN-DEMO-2026-08123</dd></div><div><dt>Issue date</dt><dd>${dateText()}</dd></div><div><dt>Valid until</dt><dd>${validityDate()}</dd></div></dl></section>
    <button class="button" id="download-certificate" type="button">Download mock certificate</button>
    <section class="section"><h2>What happens next</h2><ol class="timeline"><li><strong>Your mock licence is shown above</strong>This demo certificate lasts for six months.</li><li><strong>Apply for a permanent licence after 30 days</strong>In a real journey, you can apply for a driving test at least 30 days after your Learner's Licence is issued.</li><li><strong>No RTO visit is needed for this demo step</strong>This prototype does not create an official record or require an in-person visit.</li></ol></section>
    <div class="button-row"><button class="quiet-link" type="button" data-go="status">View application status</button></div>${footer()}
  </section>`;
}

function statusPage() {
  if (!state.loggedIn) return startPage();
  const finished = state.testPassed;
  const aadhaarDocumentsReady = state.documents.photoDecision === "recent" || (state.documents.photoDecision === "replace" && state.documents.photo);
  const documentsChecked = Boolean((state.aadharRoute === "with-aadhar" ? aadhaarDocumentsReady : state.documents.id && state.documents.address) && state.documents.signature && state.documents.digitallySigned && state.documents.formSubmitted);
  const documentsCompleteText = state.aadharRoute === "with-aadhar" ? "Applicant photo, mock signature and the digitally signed form were accepted in this browser." : "Age proof, address proof, mock signature and the digitally signed form were accepted in this browser.";
  const documentsPendingText = state.aadharRoute === "with-aadhar" ? "Confirm or upload your photo, add a mock signature, then preview, digitally sign and submit the form." : "Upload your proofs and mock signature, then preview, digitally sign and submit the self-attested form.";
  return `<section class="page">${back(finished ? "certificate" : "tasks")}${mockBanner("Status and dates are generated from mock data in this browser.")}
    <h1>${finished ? "Your mock Learner's Licence status" : "Your application status"}</h1><p class="lede">${remoteApplicationStatus ? `Server status: ${escapeText(remoteApplicationStatus.status.replaceAll("_", " "))}. ${escapeText(remoteApplicationStatus.nextAction || "")}` : (finished ? `Valid until ${validityDate()}.` : "Continue from the next task when you are ready.")}</p>
    <ol class="timeline"><li><strong>Vehicle category ${state.category ? "chosen" : "not chosen"}</strong>${state.category ? categoryInfo()[1] : "Choose a vehicle category to start."}</li><li><strong>Documents ${documentsChecked ? "checked" : "not submitted"}</strong>${documentsChecked ? documentsCompleteText : documentsPendingText}</li><li><strong>${state.slot && state.paymentConfirmed ? "Test slot confirmed" : "Test slot not booked"}</strong>${state.slot && state.paymentConfirmed ? `${slotInfo().date}, ${slotInfo().time}.` : "Choose an available mock test time."}</li><li><strong>${finished ? "Mock licence issued" : "Mock test not yet passed"}</strong>${finished ? "Your downloadable demo certificate is ready." : "Pass the short mock test to complete the journey."}</li></ol>
    <div class="button-row"><button class="button" type="button" data-go="${finished ? "certificate" : "tasks"}">${finished ? "View mock licence" : "Continue application"}</button></div>${footer()}
  </section>`;
}

function render() {
  updateHeader();
  const pages = { start: landingPage, "learner-start": startPage, "aadhar-choice": aadharChoicePage, login: loginPage, "review-details": reviewDetailsPage, "mobile-auth": mobileAuthPage, "personal-details": personalDetailsPage, tasks: taskListPage, category: categoryPage, documents: documentsPage, slots: slotsPage, hold: holdPage, quiz: quizPage, result: resultPage, certificate: certificatePage, status: statusPage };
  main.innerHTML = (pages[currentView] || landingPage)();
  bindEvents();
}

function showFormError(container, fieldId, message) {
  container.innerHTML = `<section class="error-summary" role="alert" tabindex="-1"><h2>There is a problem</h2><ul><li><a href="#${fieldId}">${message}</a></li></ul></section>`;
  const field = document.getElementById(fieldId); if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
}
function showMultipleErrors(container, errors) {
  container.innerHTML = `<section class="error-summary" role="alert" tabindex="-1"><h2>${language === "hi" ? "एक समस्या है" : "There is a problem"}</h2><ul>${errors.map(error => `<li><a href="#${error.id}">${error.message}</a></li>`).join("")}</ul></section>`;
  errors.forEach(error => document.getElementById(error.id)?.setAttribute("aria-invalid", "true"));
  container.querySelector(".error-summary")?.focus();
}
function validateFile(input, result) {
  const file = input.files[0];
  if (!file) return false;
  const imageOnly = input.dataset.document === "signature" || input.dataset.document === "photo";
  const accepted = file.type.startsWith("image/") || (!imageOnly && (file.type === "application/pdf" || /\.pdf$/i.test(file.name)));
  if (!accepted) { result.className = "file-result file-result--error"; result.textContent = imageOnly ? "Choose an image file." : "This file is not an image or PDF. Please choose an image or PDF."; return false; }
  if (file.size > 500 * 1024) { result.className = "file-result file-result--error"; result.textContent = `This file is ${Math.ceil(file.size / 1024)}KB — please upload a file under 500KB.`; return false; }
  result.className = "file-result file-result--success"; result.textContent = `✓ File accepted: ${file.name}`; state.documents[input.dataset.document] = file.name; saveState(); return true;
}
function startTimer() {
  const timer = document.getElementById("timer"); if (!timer) return;
  const update = () => { const mins = Math.floor(holdSeconds / 60); const seconds = String(holdSeconds % 60).padStart(2, "0"); timer.textContent = `${mins}:${seconds}`; if (holdSeconds <= 0) { clearInterval(holdInterval); main.querySelector("#confirm-slot")?.setAttribute("disabled", "disabled"); } holdSeconds -= 1; };
  update(); holdInterval = setInterval(update, 1000);
}
function downloadCertificate() {
  const [, category] = categoryInfo();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850"><rect width="1200" height="850" fill="#faf7f2"/><rect x="45" y="45" width="1110" height="760" fill="#fff" stroke="#dcd6cc" stroke-width="4"/><rect x="45" y="45" width="1110" height="14" fill="#ff9933"/><text x="110" y="175" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="42" font-weight="700">Sarathi Next</text><text x="110" y="250" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="62" font-weight="700">Mock e-Learner's Licence</text><text x="110" y="315" fill="#5a5a5a" font-family="Arial, sans-serif" font-size="26">Demo certificate — not a legal document</text><line x1="110" y1="365" x2="1090" y2="365" stroke="#dcd6cc" stroke-width="3"/><text x="110" y="445" fill="#5a5a5a" font-family="Arial, sans-serif" font-size="24">Applicant</text><text x="110" y="490" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="34" font-weight="700">Demo Applicant</text><text x="600" y="445" fill="#5a5a5a" font-family="Arial, sans-serif" font-size="24">Vehicle category</text><text x="600" y="490" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="34" font-weight="700">${category}</text><text x="110" y="595" fill="#5a5a5a" font-family="Arial, sans-serif" font-size="24">Reference number</text><text x="110" y="640" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="30" font-weight="700">SN-DEMO-2026-08123</text><text x="600" y="595" fill="#5a5a5a" font-family="Arial, sans-serif" font-size="24">Valid until</text><text x="600" y="640" fill="#1a1a1a" font-family="Arial, sans-serif" font-size="30" font-weight="700">${validityDate()}</text><text x="110" y="735" fill="#138808" font-family="Arial, sans-serif" font-size="26" font-weight="700">Issued for demo purposes only</text></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); const a = document.createElement("a"); a.href = url; a.download = "sarathi-next-mock-licence.svg"; a.click(); URL.revokeObjectURL(url);
}
function personalDetailsPayload(field) {
  const sameAddress = document.getElementById("same-address").checked;
  const address = prefix => ({ state: field(`${prefix}-state`), pinCode: field(`${prefix}-pin`) });
  const sexMap = { "non-binary": "non_binary", "prefer-not": "prefer_not_to_say", "self-describe": "self_describe" };
  const bloodMap = { "A Positive (A+)": "A_POSITIVE", "A Negative (A-)": "A_NEGATIVE", "B Positive (B+)": "B_POSITIVE", "B Negative (B-)": "B_NEGATIVE", "O Positive (O+)": "O_POSITIVE", "O Negative (O-)": "O_NEGATIVE", "AB Positive (AB+)": "AB_POSITIVE", "AB Negative (AB-)": "AB_NEGATIVE" };
  return {
    applicantName: { firstName: field("applicant-first"), middleName: field("applicant-middle"), lastName: field("applicant-last") },
    relativeType: field("relative-type"),
    relativeName: { firstName: field("relative-first"), middleName: field("relative-middle"), lastName: field("relative-last") },
    legalSex: sexMap[field("legal-sex")] || field("legal-sex"),
    legalSexSelfDescription: field("self-describe"),
    dateOfBirth: field("date-of-birth"),
    bloodGroup: bloodMap[field("blood-group")] || field("blood-group"),
    applicantPhoneNumber: verifiedMobile,
    emergencyPhoneNumber: field("emergency-phone"),
    identificationMarks: [field("mark-one"), field("mark-two")],
    permanentAddress: address("permanent"),
    presentAddressSameAsPermanent: sameAddress,
    presentAddress: sameAddress ? address("permanent") : address("present"),
    declarationAccepted: document.getElementById("details-consent").checked,
  };
}
async function downloadLicence() {
  if (state.applicationId) {
    try {
      const blob = await sarathiApi.downloadLicence(state.applicationId);
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "learner-licence.pdf"; a.click(); URL.revokeObjectURL(url); return;
    } catch (error) {
      if (!isApiFallbackError(error)) { document.getElementById("download-certificate")?.insertAdjacentHTML("afterend", `<p class="error-message">${escapeText(apiMessage(error))}</p>`); return; }
    }
  }
  downloadCertificate();
}
async function prepareRemoteTest() {
  if (!state.applicationId || state.testId || testStartPending) return;
  testStartPending = true;
  try {
    const attempt = await sarathiApi.startTest(state.applicationId);
    state.testId = attempt.testId;
    state.testPassMark = attempt.passMark || 4;
    state.testQuestions = (attempt.questions || []).map(question => ({ questionId: question.questionId, text: question.text, answers: question.answers }));
    state.quizIndex = 0; state.quizScore = 0; saveState(); render();
  } catch (error) {
    if (!isApiFallbackError(error)) showFormError(document.getElementById("quiz-errors"), "quiz-errors", apiMessage(error));
  } finally { testStartPending = false; }
}
async function loadRemoteSlots() {
  if (!state.applicationId || remoteSlotsLoaded) return;
  remoteSlotsLoaded = true;
  try {
    const response = await sarathiApi.listSlots(state.applicationId);
    const formatDate = value => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(value));
    const formatTime = (start, end) => `${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(start))} to ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(end))}`;
    if (response.slots?.length) {
      slots = response.slots.map(slot => ({ id: slot.slotId, date: formatDate(slot.startsAt), time: formatTime(slot.startsAt, slot.endsAt), seats: slot.availableSeats }));
      render();
    }
  } catch (error) {
    if (!isApiFallbackError(error)) showFormError(document.getElementById("slot-errors"), "slot-errors", apiMessage(error));
  }
}
async function loadRemoteStatus() {
  if (!state.applicationId || remoteApplicationStatus) return;
  try { remoteApplicationStatus = await sarathiApi.getStatus(state.applicationId); render(); }
  catch (error) { if (!isApiFallbackError(error)) document.querySelector(".lede")?.insertAdjacentHTML("afterend", `<p class="error-message">${escapeText(apiMessage(error))}</p>`); }
}
async function loadAadhaarReview() {
  if (!state.applicationId || aadhaarReviewDetails || state.aadharRoute !== "with-aadhar") return;
  try {
    const application = await sarathiApi.getApplication(state.applicationId);
    const details = application.personalDetails;
    if (!details) return;
    const fullName = name => [name?.firstName, name?.middleName, name?.lastName].filter(Boolean).join(" ");
    const address = value => [value?.line1, value?.line2, value?.district, value?.state, value?.pinCode].filter(Boolean).join(", ");
    const date = details.dateOfBirth ? new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${details.dateOfBirth}T00:00:00`)) : "";
    aadhaarReviewDetails = {
      name: fullName(details.applicantName),
      relative: `${fullName(details.relativeName)}${details.relativeType ? ` (${details.relativeType})` : ""}`,
      sex: String(details.legalSex || "").replaceAll("_", " "),
      dateOfBirth: date,
      bloodGroup: String(details.bloodGroup || "").replaceAll("_", " "),
      phone: details.applicantPhoneNumber ? details.applicantPhoneNumber.replace(/\d(?=\d{4})/g, "•") : "",
      permanentAddress: address(details.permanentAddress),
      presentAddress: details.presentAddressSameAsPermanent ? (language === "hi" ? "स्थायी पते के समान" : "Same as permanent address") : address(details.presentAddress),
    };
    render();
  } catch (error) {
    if (!isApiFallbackError(error)) document.querySelector(".lede")?.insertAdjacentHTML("afterend", `<p class="error-message">${escapeText(apiMessage(error))}</p>`);
  }
}
function bindEvents() {
  main.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => go(el.dataset.go)));
  main.querySelectorAll('input[name="aadharRoute"]').forEach(input => input.addEventListener("change", () => {
    document.querySelector(".decision-actions")?.removeAttribute("hidden");
  }));
  document.getElementById("aadhar-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const choice = main.querySelector('input[name="aadharRoute"]:checked');
    if (!choice) return showFormError(document.getElementById("aadhar-errors"), "aadhar-errors", language === "hi" ? "आवेदन का एक तरीका चुनें" : "Choose how you want to apply");
    if (state.aadharRoute && state.aadharRoute !== choice.value) state.documents = { ...defaultState.documents };
    state.aadharRoute = choice.value;
    saveState();
    go(choice.value === "with-aadhar" ? "login" : "mobile-auth");
  });
  document.getElementById("send-otp")?.addEventListener("click", async () => {
    const input = document.getElementById("aadhar-number");
    const errors = document.getElementById("auth-errors");
    if (!/^\d{12}$/.test(input.value.trim())) return showFormError(errors, "aadhar-number", language === "hi" ? "12 अंकों का आधार नंबर दर्ज करें" : "Enter a 12-digit Aadhar number");
    input.removeAttribute("aria-invalid");
    errors.innerHTML = "";
    try {
      const challenge = await sarathiApi.sendAadhaarOtp(input.value.trim(), language);
      state.aadhaarChallengeId = challenge.challengeId;
      saveState();
      document.getElementById("otp-status").innerHTML = `<strong>${language === "hi" ? "ओटीपी भेजा गया" : "OTP sent"}</strong><br><span>${escapeText(challenge.maskedDestination || "your Aadhaar-linked mobile number")}</span>`;
    } catch (error) {
      if (!isApiFallbackError(error)) return showFormError(errors, "aadhar-number", apiMessage(error));
      generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById("otp-status").innerHTML = `<strong>${language === "hi" ? "इस प्रोटोटाइप के लिए ओटीपी" : "OTP for this prototype"}: ${generatedOtp}</strong><br><span>${language === "hi" ? "वास्तविक सेवा इसे आधार से जुड़े मोबाइल नंबर पर एसएमएस से भेजेगी।" : "A live service would send this by SMS to the mobile number linked with Aadhar."}</span>`;
    }
    document.getElementById("otp").focus();
  });
  document.getElementById("login-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const aadhar = document.getElementById("aadhar-number").value.trim();
    const otp = document.getElementById("otp").value.trim();
    const checked = main.querySelectorAll('input[name="consent"]:checked');
    const errors = [];
    if (!/^\d{12}$/.test(aadhar)) errors.push({ id: "aadhar-number", message: language === "hi" ? "12 अंकों का आधार नंबर दर्ज करें" : "Enter a 12-digit Aadhar number" });
    if (!generatedOtp && !state.aadhaarChallengeId) errors.push({ id: "send-otp", message: language === "hi" ? "पहले ओटीपी भेजें" : "Send an OTP before authenticating" });
    else if (generatedOtp && otp !== generatedOtp) errors.push({ id: "otp", message: language === "hi" ? "सही 6 अंकों का ओटीपी दर्ज करें" : "Enter the correct 6-digit OTP" });
    if (checked.length !== 3) errors.push({ id: "consent-1", message: language === "hi" ? "जारी रखने के लिए तीनों घोषणाओं से सहमत हों" : "Agree to all three declarations to continue" });
    if (errors.length) return showMultipleErrors(document.getElementById("auth-errors"), errors);
    if (state.aadhaarChallengeId) {
      try {
        const result = await sarathiApi.verifyAadhaarOtp(state.aadhaarChallengeId, otp, ["identity_verification", "transaction_only", "confidentiality"]);
        state.applicationId = result.applicationId || state.applicationId;
      } catch (error) { return showFormError(document.getElementById("auth-errors"), "otp", apiMessage(error)); }
    }
    state.loggedIn = true;
    saveState();
    go("review-details");
  });
  const detailsForm = document.getElementById("personal-details-form");
  const updatePersonalDraft = target => {
    if (!target.name) return;
    personalDraft[target.name] = target.type === "checkbox" ? target.checked : target.value;
  };
  detailsForm?.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("input", event => {
      const target = event.currentTarget;
      if (target.matches("[data-uppercase]")) {
        const start = target.selectionStart;
        target.value = target.value.toUpperCase();
        if (start !== null) target.setSelectionRange(start, start);
      }
      if (target.matches("[data-numeric]")) target.value = target.value.replace(/\D/g, "");
      if (target.id === "date-of-birth") {
        const dob = new Date(`${target.value}T00:00:00`);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const beforeBirthday = today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
        if (beforeBirthday) age -= 1;
        const ageField = document.getElementById("age");
        ageField.value = Number.isFinite(age) && age >= 0 ? String(age) : "";
        personalDraft.age = ageField.value;
      }
      updatePersonalDraft(target);
    });
    input.addEventListener("change", event => {
      const target = event.currentTarget;
      updatePersonalDraft(target);
      if (target.id === "legal-sex") document.getElementById("self-describe-field").hidden = target.value !== "self-describe";
      if (target.id === "same-address") document.getElementById("present-address-fields").hidden = target.checked;
    });
  });
  document.getElementById("reset-personal-details")?.addEventListener("click", event => {
    event.preventDefault();
    personalDraft = { sameAddress: true };
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  detailsForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const field = id => document.getElementById(id)?.value.trim() || "";
    const errors = [];
    const requiredText = language === "hi" ? "यह जानकारी दर्ज करें" : "Enter this information";
    [["applicant-first", requiredText], ["applicant-last", requiredText], ["relative-type", requiredText], ["relative-first", requiredText], ["relative-last", requiredText], ["legal-sex", requiredText], ["date-of-birth", requiredText], ["blood-group", requiredText], ["mark-one", requiredText], ["mark-two", requiredText], ["permanent-state", requiredText]].forEach(([id, message]) => { if (!field(id)) errors.push({ id, message }); });
    if (!/^\d{10}$/.test(field("emergency-phone"))) errors.push({ id: "emergency-phone", message: language === "hi" ? "10 अंकों का आपातकालीन फोन नंबर दर्ज करें" : "Enter a 10-digit emergency phone number" });
    if (!/^\d{6}$/.test(field("permanent-pin"))) errors.push({ id: "permanent-pin", message: language === "hi" ? "6 अंकों का पिन कोड दर्ज करें" : "Enter a 6-digit pin code" });
    if (!document.getElementById("same-address").checked) {
      if (!field("present-state")) errors.push({ id: "present-state", message: requiredText });
      if (!/^\d{6}$/.test(field("present-pin"))) errors.push({ id: "present-pin", message: language === "hi" ? "6 अंकों का पिन कोड दर्ज करें" : "Enter a 6-digit pin code" });
    }
    if (!document.getElementById("details-consent").checked) errors.push({ id: "details-consent", message: language === "hi" ? "जमा करने से पहले घोषणा से सहमत हों" : "Agree to the declaration before submitting" });
    if (errors.length) return showMultipleErrors(document.getElementById("personal-details-errors"), errors);
    if (state.applicationId) {
      try { await sarathiApi.savePersonalDetails(state.applicationId, personalDetailsPayload(field)); }
      catch (error) { return showFormError(document.getElementById("personal-details-errors"), "applicant-first", apiMessage(error)); }
    }
    state.loggedIn = true;
    saveState();
    go("tasks");
  });
  const issueMobileOtp = async () => {
    const input = document.getElementById("mobile-number");
    const errors = document.getElementById("mobile-auth-errors");
    if (!/^\d{10}$/.test(input.value.trim())) return showFormError(errors, "mobile-number", language === "hi" ? "10 अंकों का मोबाइल नंबर दर्ज करें" : "Enter a 10-digit mobile number");
    input.removeAttribute("aria-invalid");
    errors.innerHTML = "";
    try {
      const challenge = await sarathiApi.sendMobileOtp(input.value.trim(), language);
      state.mobileChallengeId = challenge.challengeId;
      saveState();
      document.getElementById("mobile-otp-status").innerHTML = `<strong>${language === "hi" ? "ओटीपी भेजा गया" : "OTP sent"}</strong><br><span>${escapeText(challenge.maskedDestination || input.value.trim().replace(/\d(?=\d{4})/g, "•"))}</span>`;
    } catch (error) {
      if (!isApiFallbackError(error)) return showFormError(errors, "mobile-number", apiMessage(error));
      generatedMobileOtp = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById("mobile-otp-status").innerHTML = `<strong>${language === "hi" ? "इस प्रोटोटाइप के लिए ओटीपी" : "OTP for this prototype"}: ${generatedMobileOtp}</strong><br><span>${language === "hi" ? "वास्तविक सेवा इसे आपके मोबाइल नंबर पर एसएमएस से भेजेगी।" : "A live service would send this by SMS to your mobile number."}</span>`;
    }
    document.getElementById("mobile-otp").focus();
  };
  document.getElementById("send-mobile-otp")?.addEventListener("click", issueMobileOtp);
  document.getElementById("resend-mobile-otp")?.addEventListener("click", issueMobileOtp);
  document.getElementById("mobile-auth-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const mobile = document.getElementById("mobile-number").value.trim();
    const otp = document.getElementById("mobile-otp").value.trim();
    const consent = document.getElementById("mobile-consent").checked;
    const errors = [];
    if (!/^\d{10}$/.test(mobile)) errors.push({ id: "mobile-number", message: language === "hi" ? "10 अंकों का मोबाइल नंबर दर्ज करें" : "Enter a 10-digit mobile number" });
    if (!generatedMobileOtp && !state.mobileChallengeId) errors.push({ id: "send-mobile-otp", message: language === "hi" ? "पहले ओटीपी भेजें" : "Send an OTP before continuing" });
    else if (generatedMobileOtp && otp !== generatedMobileOtp) errors.push({ id: "mobile-otp", message: language === "hi" ? "सही 6 अंकों का ओटीपी दर्ज करें" : "Enter the correct 6-digit OTP" });
    if (!consent) errors.push({ id: "mobile-consent", message: language === "hi" ? "जारी रखने के लिए घोषणा से सहमत हों" : "Agree to the declaration to continue" });
    if (errors.length) return showMultipleErrors(document.getElementById("mobile-auth-errors"), errors);
    if (state.mobileChallengeId) {
      try {
        const result = await sarathiApi.verifyMobileOtp(state.mobileChallengeId, otp, true);
        state.applicationId = result.applicationId || state.applicationId;
        saveState();
      } catch (error) { return showFormError(document.getElementById("mobile-auth-errors"), "mobile-otp", apiMessage(error)); }
    }
    verifiedMobile = mobile;
    go("personal-details");
  });
  document.getElementById("category-form")?.addEventListener("submit", async event => { event.preventDefault(); const choice = main.querySelector("input[name=category]:checked"); if (!choice) return showFormError(document.getElementById("category-errors"), "category", "Choose the type of vehicle you will drive"); if (state.applicationId) { try { await sarathiApi.saveVehicleCategory(state.applicationId, choice.value.replaceAll("-", "_")); } catch (error) { return showFormError(document.getElementById("category-errors"), "category", apiMessage(error)); } } state.category = choice.value; saveState(); go("tasks"); });
  document.getElementById("photo-is-recent")?.addEventListener("click", () => { state.documents.photoDecision = "recent"; state.documents.photo = "aadhaar-linked-mock-photo.png"; state.documents.formSubmitted = false; saveState(); render(); });
  document.getElementById("photo-is-not-recent")?.addEventListener("click", () => { state.documents.photoDecision = "replace"; state.documents.photo = ""; state.documents.formSubmitted = false; saveState(); render(); document.getElementById("photo")?.focus(); });
  document.getElementById("replace-fetched-photo")?.addEventListener("click", () => { state.documents.photoDecision = "replace"; state.documents.photo = ""; state.documents.formSubmitted = false; saveState(); render(); document.getElementById("photo")?.focus(); });
  document.getElementById("use-fetched-photo")?.addEventListener("click", () => { state.documents.photoDecision = "recent"; state.documents.photo = "aadhaar-linked-mock-photo.png"; state.documents.formSubmitted = false; photoPreviewUrl = ""; saveState(); render(); });
  main.querySelectorAll("[data-document]").forEach(input => input.addEventListener("change", async event => {
    const target = event.currentTarget;
    const file = target.files[0];
    state.documents[target.dataset.document] = "";
    state.documents.formSubmitted = false;
    saveState();
    const result = document.getElementById(`${target.id}-result`);
    if (!file || !validateFile(target, result)) return;
    if (target.dataset.document === "photo") {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      photoPreviewUrl = URL.createObjectURL(file);
      const preview = document.getElementById("photo-upload-preview");
      preview.src = photoPreviewUrl; preview.hidden = false;
    }
    if (state.applicationId) {
      const documentType = target.dataset.document === "id" ? "age_proof" : target.dataset.document === "address" ? "address_proof" : "photo";
      try { await sarathiApi.uploadDocument(state.applicationId, documentType, file); }
      catch (error) { result.className = "file-result file-result--error"; result.textContent = apiMessage(error); state.documents[target.dataset.document] = ""; saveState(); }
    }
  }));
  document.getElementById("upload-mock-signature")?.addEventListener("click", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 180;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1a1a1a"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(38, 139); context.bezierCurveTo(170, 126, 330, 154, 595, 128); context.stroke();
    context.fillStyle = "#1a1a1a"; context.font = "italic 58px Georgia, serif";
    const mockName = [personalDraft.applicantFirst, personalDraft.applicantLast].filter(Boolean).join(" ") || "Demo Applicant";
    context.fillText(mockName, 42, 116, 550);
    signaturePreviewUrl = canvas.toDataURL("image/png");
    state.documents.signature = "sarathi-next-mock-signature.png";
    state.documents.digitallySigned = false;
    state.documents.formSubmitted = false;
    if (state.applicationId) {
      try { const signature = await sarathiApi.createMockSignature(state.applicationId); state.signatureId = signature.signatureId || ""; }
      catch (error) { if (!isApiFallbackError(error)) { const result = document.getElementById("signature-result"); result.className = "file-result file-result--error"; result.textContent = apiMessage(error); return; } }
    }
    saveState();
    const result = document.getElementById("signature-result"); result.className = "file-result file-result--success"; result.textContent = language === "hi" ? "✓ नमूना हस्ताक्षर तैयार है" : "✓ Mock signature is ready";
    const uploadPreview = document.getElementById("signature-upload-preview"); uploadPreview.src = signaturePreviewUrl; uploadPreview.hidden = false;
    const formPreview = document.getElementById("application-signature-preview"); formPreview.src = signaturePreviewUrl; formPreview.hidden = true;
    document.getElementById("signature-placeholder").hidden = false;
    document.getElementById("digital-sign-status").textContent = "";
  });
  document.getElementById("preview-app-form")?.addEventListener("click", async event => {
    selfAttestedPreviewOpen = !selfAttestedPreviewOpen;
    const preview = document.getElementById("application-form-preview");
    preview.hidden = !selfAttestedPreviewOpen;
    event.currentTarget.textContent = selfAttestedPreviewOpen ? (language === "hi" ? "पूर्वावलोकन छिपाएँ" : "Hide preview") : (language === "hi" ? "आवेदन फॉर्म देखें" : "Preview application form");
    if (selfAttestedPreviewOpen && state.applicationId) {
      try { await sarathiApi.getSelfAttestedForm(state.applicationId); }
      catch (error) { if (!isApiFallbackError(error)) { const status = document.getElementById("digital-sign-status"); status.className = "otp-status otp-status--error"; status.textContent = apiMessage(error); } }
    }
    if (selfAttestedPreviewOpen) preview.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("sign-digitally")?.addEventListener("click", async () => {
    const status = document.getElementById("digital-sign-status");
    if (!selfAttestedPreviewOpen) { status.className = "otp-status otp-status--error"; status.textContent = language === "hi" ? "डिजिटल हस्ताक्षर करने से पहले आवेदन फॉर्म देखें।" : "Preview the application form before signing digitally."; return; }
    if (!state.documents.signature || !signaturePreviewUrl) { status.className = "otp-status otp-status--error"; status.textContent = language === "hi" ? "पहले नमूना हस्ताक्षर अपलोड करें।" : "Upload the mock signature first."; return; }
    if (state.applicationId) {
      try { await sarathiApi.signSelfAttestedForm(state.applicationId, state.signatureId); }
      catch (error) { status.className = "otp-status otp-status--error"; status.textContent = apiMessage(error); return; }
    }
    state.documents.digitallySigned = true;
    state.documents.formSubmitted = false;
    saveState();
    status.className = "otp-status"; status.innerHTML = `<strong>✓ ${language === "hi" ? "फॉर्म पर डिजिटल हस्ताक्षर हो गए हैं।" : "The form has been digitally signed."}</strong>`;
    const image = document.getElementById("application-signature-preview"); image.src = signaturePreviewUrl; image.hidden = false;
    document.getElementById("signature-placeholder").hidden = true;
  });
  document.getElementById("documents-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const errors = [];
    if (state.aadharRoute === "with-aadhar") {
      if (!state.documents.photoDecision) errors.push({ id: "photo-is-recent", message: language === "hi" ? "बताएँ कि मौजूदा तस्वीर हाल की है या नहीं" : "Confirm whether the fetched photo is recent" });
      if (state.documents.photoDecision === "replace" && !state.documents.photo) errors.push({ id: "photo", message: language === "hi" ? "हाल की तस्वीर लें या चुनें" : "Take or choose a recent photo" });
    } else {
      const id = document.getElementById("id"); const address = document.getElementById("address");
      if (!state.documents.id && !validateFile(id, document.getElementById("id-result"))) errors.push({ id: "id", message: language === "hi" ? "आयु प्रमाण फ़ाइल चुनें" : "Choose an age proof file" });
      if (!state.documents.address && !validateFile(address, document.getElementById("address-result"))) errors.push({ id: "address", message: language === "hi" ? "पते का प्रमाण फ़ाइल चुनें" : "Choose an address proof file" });
    }
    if (!state.documents.signature) errors.push({ id: "upload-mock-signature", message: language === "hi" ? "नमूना हस्ताक्षर अपलोड करें" : "Upload the mock signature" });
    if (!selfAttestedPreviewOpen) errors.push({ id: "preview-app-form", message: language === "hi" ? "जमा करने से पहले आवेदन फॉर्म देखें" : "Preview the application form before submitting" });
    if (!state.documents.digitallySigned) errors.push({ id: "sign-digitally", message: language === "hi" ? "जमा करने से पहले फॉर्म पर डिजिटल हस्ताक्षर करें" : "Sign the form digitally before submitting" });
    if (errors.length) return showMultipleErrors(document.getElementById("document-errors"), errors);
    if (state.applicationId) {
      try { await sarathiApi.submitDocuments(state.applicationId); }
      catch (error) { return showFormError(document.getElementById("document-errors"), "sign-digitally", apiMessage(error)); }
    }
    state.documents.formSubmitted = true;
    saveState();
    go("tasks");
  });
  document.getElementById("slot-form")?.addEventListener("submit", async event => { event.preventDefault(); const selected = main.querySelector("input[name=slot]:checked"); if (!selected) return showFormError(document.getElementById("slot-errors"), "slot-errors", "Choose a test time"); if (state.applicationId) { try { const hold = await sarathiApi.holdSlot(selected.value, state.applicationId); state.holdId = hold.holdId || ""; holdSeconds = hold.expiresAt ? Math.max(0, Math.floor((new Date(hold.expiresAt) - Date.now()) / 1000)) : 300; } catch (error) { if (!isApiFallbackError(error)) return showFormError(document.getElementById("slot-errors"), "slot-errors", apiMessage(error)); } } state.slot = selected.value; state.paymentConfirmed = false; if (!state.holdId) holdSeconds = 300; saveState(); go("hold"); });
  document.getElementById("confirm-slot")?.addEventListener("click", async () => { if (state.holdId) { try { await sarathiApi.confirmHold(state.holdId); } catch (error) { const box = document.querySelector(".hold-box"); if (box) box.insertAdjacentHTML("afterend", `<p class="error-message">${escapeText(apiMessage(error))}</p>`); return; } } state.paymentConfirmed = true; saveState(); go("tasks"); });
  document.getElementById("waitlist")?.addEventListener("click", async () => { if (state.applicationId && state.slot) { try { await sarathiApi.joinWaitlist(state.slot, state.applicationId); } catch (error) { if (!isApiFallbackError(error)) { main.querySelector(".button-row").insertAdjacentHTML("beforebegin", `<p class="error-message">${escapeText(apiMessage(error))}</p>`); return; } } } main.querySelector(".button-row").innerHTML = `<p class="progress-note"><strong>You are on the mock waitlist.</strong> We would notify you if a demo seat became available.</p><button class="quiet-link" type="button" data-go="slots">Choose another time</button>`; bindEvents(); });
  document.getElementById("quiz-form")?.addEventListener("submit", async event => { event.preventDefault(); const selected = main.querySelector("input[name=answer]:checked"); if (!selected) return showFormError(document.getElementById("quiz-errors"), "quiz-errors", "Choose an answer before continuing"); const currentQuestions = activeQuestions(); const currentQuestion = currentQuestions[state.quizIndex]; if (state.testId) { try { const answer = currentQuestion.answers[Number(selected.value)]; await sarathiApi.answerTest(state.testId, currentQuestion.questionId, answer.answerId); state.quizIndex += 1; if (state.quizIndex >= currentQuestions.length) { const result = await sarathiApi.submitTest(state.testId); state.quizScore = result.score; state.testPassed = result.passed; } } catch (error) { return showFormError(document.getElementById("quiz-errors"), "quiz-errors", apiMessage(error)); } } else { if (Number(selected.value) === currentQuestion.correct) state.quizScore += 1; state.quizIndex += 1; if (state.quizIndex >= currentQuestions.length) state.testPassed = state.quizScore >= 4; } saveState(); go(state.quizIndex >= currentQuestions.length ? "result" : "quiz"); });
  document.getElementById("retry-quiz")?.addEventListener("click", () => { state.quizIndex = 0; state.quizScore = 0; state.testPassed = false; state.testId = ""; state.testQuestions = []; state.testPassMark = 4; saveState(); go("quiz"); });
  document.getElementById("download-certificate")?.addEventListener("click", downloadLicence);
  if (currentView === "hold") startTimer();
  if (currentView === "quiz") prepareRemoteTest();
  if (currentView === "slots") loadRemoteSlots();
  if (currentView === "status") loadRemoteStatus();
  if (currentView === "review-details") loadAadhaarReview();
  if (currentView === "documents") document.getElementById("photo-is-recent")?.focus();
}
statusLink.addEventListener("click", () => go("status"));
languageTabs.forEach(tab => tab.addEventListener("click", () => {
  language = tab.dataset.language;
  localStorage.setItem(languageKey, language);
  applyLanguage();
  if (currentView === "start" || currentView === "aadhar-choice" || currentView === "login" || currentView === "review-details" || currentView === "mobile-auth" || currentView === "personal-details") render();
}));
window.addEventListener("popstate", () => { currentView = location.hash.slice(1) || "start"; render(); });
currentView = location.hash.slice(1) || "start";
render();

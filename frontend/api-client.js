const API_ROOT = "/api/backend/v1";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR", fieldErrors = {}, requestId = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

export function isApiFallbackError(error) {
  return error instanceof ApiError && ["API_NOT_CONFIGURED", "API_UNAVAILABLE", "API_TIMEOUT", "NOT_IMPLEMENTED", "NETWORK_ERROR"].includes(error.code);
}

function idempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `sarathi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function request(path, { method = "GET", body, headers = {}, idempotent = false, responseType = "json" } = {}) {
  const requestHeaders = new Headers({ Accept: responseType === "blob" ? "*/*" : "application/json", ...headers });
  let payload = body;
  if (body && !(body instanceof FormData) && !(body instanceof Blob)) {
    requestHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  if (idempotent) requestHeaders.set("Idempotency-Key", idempotencyKey());

  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, { method, headers: requestHeaders, body: payload, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new ApiError("The API server could not be reached.");
  }
  if (!response.ok) {
    let payloadError = {};
    try { payloadError = (await response.json()).error || {}; } catch { /* non-JSON upstream error */ }
    throw new ApiError(payloadError.message || `The request failed with status ${response.status}.`, {
      status: response.status,
      code: payloadError.code || "API_ERROR",
      fieldErrors: payloadError.fieldErrors || {},
      requestId: payloadError.requestId || response.headers.get("x-request-id") || "",
    });
  }
  if (response.status === 204) return null;
  return responseType === "blob" ? response.blob() : response.json();
}

const application = id => `/applications/${encodeURIComponent(id)}`;

export const sarathiApi = {
  health: () => request("/health"),
  sendMobileOtp: (mobileNumber, locale) => request("/auth/mobile/challenges", { method: "POST", body: { mobileNumber, locale }, idempotent: true }),
  verifyMobileOtp: (challengeId, otp, consentToStatusUpdates) => request(`/auth/mobile/challenges/${encodeURIComponent(challengeId)}/verify`, { method: "POST", body: { otp, consentToStatusUpdates }, idempotent: true }),
  sendAadhaarOtp: (aadhaarNumber, locale) => request("/auth/aadhaar/challenges", { method: "POST", body: { aadhaarNumber, locale }, idempotent: true }),
  verifyAadhaarOtp: (challengeId, otp, declarationsAccepted) => request(`/auth/aadhaar/challenges/${encodeURIComponent(challengeId)}/verify`, { method: "POST", body: { otp, declarationsAccepted }, idempotent: true }),
  createApplication: (applicationRoute, locale) => request("/applications", { method: "POST", body: { applicationRoute, locale }, idempotent: true }),
  getApplication: id => request(application(id)),
  savePersonalDetails: (id, details) => request(`${application(id)}/personal-details`, { method: "PUT", body: details, idempotent: true }),
  saveVehicleCategory: (id, category) => request(`${application(id)}/vehicle-category`, { method: "PUT", body: { category }, idempotent: true }),
  uploadDocument: (id, type, file) => { const form = new FormData(); form.append("file", file); return request(`${application(id)}/documents/${encodeURIComponent(type)}`, { method: "PUT", body: form, idempotent: true }); },
  createMockSignature: id => request(`${application(id)}/mock-signature`, { method: "POST", body: {}, idempotent: true }),
  getSelfAttestedForm: id => request(`${application(id)}/self-attested-form`),
  signSelfAttestedForm: (id, signatureId) => request(`${application(id)}/self-attested-form/sign`, { method: "POST", body: { signatureId }, idempotent: true }),
  submitDocuments: id => request(`${application(id)}/documents/submit`, { method: "POST", body: {}, idempotent: true }),
  listSlots: (applicationId, from) => request(`/slots?applicationId=${encodeURIComponent(applicationId)}${from ? `&from=${encodeURIComponent(from)}` : ""}`),
  holdSlot: (slotId, applicationId) => request(`/slots/${encodeURIComponent(slotId)}/holds`, { method: "POST", body: { applicationId }, idempotent: true }),
  confirmHold: holdId => request(`/holds/${encodeURIComponent(holdId)}/confirm`, { method: "POST", body: {}, idempotent: true }),
  joinWaitlist: (slotId, applicationId) => request(`/slots/${encodeURIComponent(slotId)}/waitlist`, { method: "POST", body: { applicationId }, idempotent: true }),
  startTest: id => request(`${application(id)}/tests`, { method: "POST", body: {}, idempotent: true }),
  answerTest: (testId, questionId, answerId) => request(`/tests/${encodeURIComponent(testId)}/answers`, { method: "POST", body: { questionId, answerId }, idempotent: true }),
  submitTest: testId => request(`/tests/${encodeURIComponent(testId)}/submit`, { method: "POST", body: {}, idempotent: true }),
  getStatus: id => request(`${application(id)}/status`),
  downloadLicence: id => request(`${application(id)}/licence`, { responseType: "blob" }),
};

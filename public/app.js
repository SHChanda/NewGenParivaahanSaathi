const startView = document.querySelector('#start-view');
const appView = document.querySelector('#application-view');
const storageKey = 'sarathi-next-demo-application';
let current;

const taskNames = { vehicle_category: 'Choose vehicle category', documents: 'Upload your documents', test_slot: 'Book your mock test slot', mock_test: 'Take the mock test', learner_licence: 'Get your Learner\'s Licence' };
const prettyStatus = status => ({ not_started: 'Not started', cannot_start_yet: 'Cannot start yet', in_progress: 'In progress', completed: 'Completed' }[status] || status);
const escapeHtml = text => String(text ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The demo could not complete that request.');
  return data;
}
function showError(message) { appView.insertAdjacentHTML('afterbegin', `<div class="errors" role="alert">${escapeHtml(message)}</div>`); }
function taskList(application) {
  return `<ol class="task-list">${application.tasks.map(task => `<li class="task"><div><strong>${taskNames[task.task_code]}</strong><p>${task.task_code === 'documents' ? 'Add one age proof and one address proof.' : task.task_code === 'test_slot' ? 'Select an available mock slot.' : 'Continue the application when this task is available.'}</p></div><span class="tag ${task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'progress' : ''}">${prettyStatus(task.status)}</span></li>`).join('')}</ol>`;
}
function dashboard(application) {
  current = application;
  localStorage.setItem(storageKey, application.id);
  startView.hidden = true; appView.hidden = false;
  const categoryTask = application.tasks.find(task => task.task_code === 'vehicle_category');
  const documentTask = application.tasks.find(task => task.task_code === 'documents');
  const slotTask = application.tasks.find(task => task.task_code === 'test_slot');
  appView.innerHTML = `<p class="eyebrow">Application reference</p><h1>${escapeHtml(application.reference_number)}</h1><p class="lead">Welcome, ${escapeHtml(application.name)}. Your demo application is saved between visits on this browser.</p>${taskList(application)}
    ${categoryTask.status === 'in_progress' ? categoryPanel() : ''}
    ${documentTask.status === 'in_progress' ? documentsPanel(application) : ''}
    ${slotTask.status === 'in_progress' ? slotsPanel() : ''}
    ${application.booking ? `<div class="success"><strong>Mock test slot confirmed</strong><br>${escapeHtml(application.booking.slot_date)} at ${escapeHtml(application.booking.start_time)} — ${escapeHtml(application.booking.centre_name)}<br>Booking reference: ${escapeHtml(application.booking.booking_number)}</div>` : ''}`;
  attachHandlers();
}
function categoryPanel() { return `<section class="card"><h2>Choose vehicle category</h2><p>Select the type of vehicle for this demo application.</p><form id="category-form"><div class="field"><label for="category">Vehicle category</label><select id="category" required><option value="">Select a category</option><option value="cat-mcwg">Scooter or motorcycle — MCWG</option><option value="cat-lmv-nt">Car for personal use — LMV-NT</option><option value="cat-transport">Commercial or goods vehicle — Transport</option></select></div><button class="button">Continue</button></form></section>`; }
function documentsPanel(application) { const uploaded = new Set(application.documents.map(doc => doc.document_type)); return `<section class="card"><h2>Upload your documents</h2><p>Use test files only. Each file must be a JPG, PNG, or PDF under 500 KB.</p><div class="two-col">${[['age_proof','Age proof'],['address_proof','Address proof']].map(([type,label]) => `<form class="upload-form" data-type="${type}"><div class="field"><label for="${type}">${label}</label><input id="${type}" type="file" accept=".jpg,.jpeg,.png,.pdf" ${uploaded.has(type) ? 'disabled' : ''} required />${uploaded.has(type) ? '<p class="hint">Uploaded and accepted.</p>' : ''}</div>${uploaded.has(type) ? '' : '<button class="button">Upload file</button>'}</form>`).join('')}</div></section>`; }
function slotsPanel() { return `<section class="card"><h2>Book your mock test slot</h2><p>Availability is mock data. Confirming a slot records a mock payment confirmation.</p><div id="slots"><p class="hint">Loading available slots…</p></div></section>`; }
async function loadSlots() { const container = document.querySelector('#slots'); if (!container) return; try { const slots = await request(`/api/applications/${current.id}/slots`); container.innerHTML = slots.map(slot => `<button class="slot" data-slot="${slot.id}"><strong>${escapeHtml(slot.slot_date)} · ${escapeHtml(slot.start_time)}–${escapeHtml(slot.end_time)}</strong><br><span class="hint">${escapeHtml(slot.centre_name)} · ${slot.capacity - slot.booked_count} places available</span></button>`).join(''); container.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => bookSlot(button.dataset.slot, button))); } catch (error) { container.innerHTML = `<div class="errors">${escapeHtml(error.message)}</div>`; } }
function attachHandlers() {
  const categoryForm = document.querySelector('#category-form');
  if (categoryForm) categoryForm.addEventListener('submit', async event => { event.preventDefault(); const button = categoryForm.querySelector('button'); button.disabled = true; try { dashboard(await request(`/api/applications/${current.id}/category`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({categoryId: document.querySelector('#category').value}) })); } catch (error) { showError(error.message); button.disabled = false; } });
  document.querySelectorAll('.upload-form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; const body = new FormData(); body.append('documentType', form.dataset.type); body.append('file', form.querySelector('input').files[0]); try { dashboard(await request(`/api/applications/${current.id}/documents`, { method: 'POST', body })); } catch (error) { showError(error.message); button.disabled = false; } }));
  if (document.querySelector('#slots')) loadSlots();
}
async function bookSlot(slotId, button) { button.disabled = true; try { dashboard(await request(`/api/applications/${current.id}/booking`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({slotId}) })); } catch (error) { button.disabled = false; showError(error.message); } }

document.querySelector('#start-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget, errorBox = document.querySelector('#start-errors'); errorBox.hidden = true;
  const values = new FormData(form); const button = form.querySelector('button'); button.disabled = true;
  try { dashboard(await request('/api/applications', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(values)) })); }
  catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; button.disabled = false; errorBox.focus(); }
});
(async () => { const saved = localStorage.getItem(storageKey); if (!saved) return; try { dashboard(await request(`/api/applications/${saved}`)); } catch { localStorage.removeItem(storageKey); } })();

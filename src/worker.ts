export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  ASSETS: Fetcher;
}

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

async function application(DB: D1Database, applicationId: string) {
  const app = await DB.prepare(`SELECT a.id, a.reference_number, a.status, a.current_step, a.created_at,
      u.name, vc.code AS category_code, vc.display_name AS category_name
    FROM applications a JOIN users u ON u.id = a.user_id
    LEFT JOIN vehicle_categories vc ON vc.id = a.vehicle_category_id WHERE a.id = ?`).bind(applicationId).first();
  if (!app) return null;
  const [tasks, documents, booking] = await Promise.all([
    DB.prepare('SELECT task_code, status, completed_at FROM application_tasks WHERE application_id = ? ORDER BY CASE task_code WHEN \'vehicle_category\' THEN 1 WHEN \'documents\' THEN 2 WHEN \'test_slot\' THEN 3 ELSE 4 END').bind(applicationId).all(),
    DB.prepare('SELECT id, document_type, original_filename, validation_status, uploaded_at FROM documents WHERE application_id = ? ORDER BY created_at').bind(applicationId).all(),
    DB.prepare(`SELECT b.booking_number, b.status, s.slot_date, s.start_time, c.name AS centre_name
      FROM bookings b JOIN test_slots s ON s.id = b.slot_id JOIN test_centres c ON c.id = s.centre_id
      WHERE b.application_id = ? AND b.status = 'confirmed'`).bind(applicationId).first()
  ]);
  return { ...app, tasks: tasks.results, documents: documents.results, booking };
}

async function api(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  if (request.method === 'POST' && path === '/api/applications') {
    const body = await request.json<{ name?: string; mobile?: string; method?: string }>();
    if (!body.name?.trim() || !/^\d{10}$/.test(body.mobile || '') || !['aadhaar', 'mobile'].includes(body.method || '')) {
      return json({ error: 'Enter your name, a 10-digit mobile number, and an application method.' }, 400);
    }
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE mobile_number = ?').bind(body.mobile).first<{ id: string }>();
    const userId = existingUser?.id ?? id(), applicationId = id(), reference = `DEMO-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const taskCodes = ['vehicle_category', 'documents', 'test_slot', 'mock_test', 'learner_licence'];
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO users (id, name, mobile_number, mobile_verified_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(mobile_number) DO UPDATE SET name = excluded.name, mobile_verified_at = excluded.mobile_verified_at`)
        .bind(userId, body.name.trim(), body.mobile, now()),
      env.DB.prepare(`INSERT INTO applications (id, user_id, application_method, identity_verified_at, reference_number) VALUES (?, ?, ?, ?, ?)`)
        .bind(applicationId, userId, body.method, now(), reference),
      ...taskCodes.map((code, index) => env.DB.prepare('INSERT INTO application_tasks (id, application_id, task_code, status) VALUES (?, ?, ?, ?)')
        .bind(id(), applicationId, code, index === 0 ? 'in_progress' : 'cannot_start_yet'))
    ]);
    return json(await application(env.DB, applicationId), 201);
  }

  const match = path.match(/^\/api\/applications\/([^/]+)(?:\/(.*))?$/);
  if (!match) return json({ error: 'Not found' }, 404);
  const [, applicationId, action = ''] = match;
  if (request.method === 'GET' && !action) {
    const result = await application(env.DB, applicationId);
    return result ? json(result) : json({ error: 'Application not found.' }, 404);
  }
  if (request.method === 'PUT' && action === 'category') {
    const { categoryId } = await request.json<{ categoryId?: string }>();
    const category = await env.DB.prepare('SELECT id FROM vehicle_categories WHERE id = ? AND active = 1').bind(categoryId).first();
    if (!category) return json({ error: 'Choose a vehicle category.' }, 400);
    await env.DB.batch([
      env.DB.prepare("UPDATE applications SET vehicle_category_id = ?, status = 'documents_pending', current_step = 'documents' WHERE id = ?").bind(categoryId, applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'completed', completed_at = ? WHERE application_id = ? AND task_code = 'vehicle_category'").bind(now(), applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'in_progress' WHERE application_id = ? AND task_code = 'documents'").bind(applicationId)
    ]);
    return json(await application(env.DB, applicationId));
  }
  if (request.method === 'POST' && action === 'documents') {
    const form = await request.formData();
    const file = form.get('file');
    const documentType = String(form.get('documentType') || '');
    if (!(file instanceof File) || !['age_proof', 'address_proof'].includes(documentType)) return json({ error: 'Choose an age or address proof file.' }, 400);
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 512000 || file.size === 0) return json({ error: 'Use a JPG, PNG, or PDF no larger than 500 KB.' }, 400);
    const documentId = id(), storageKey = `${applicationId}/${documentId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await env.DOCUMENTS.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type } });
    await env.DB.prepare(`INSERT INTO documents (id, application_id, document_type, original_filename, storage_key, mime_type, file_size_bytes, validation_status, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted', ?)`)
      .bind(documentId, applicationId, documentType, file.name, storageKey, file.type, file.size, now()).run();
    const count = await env.DB.prepare("SELECT count(DISTINCT document_type) AS count FROM documents WHERE application_id = ? AND document_type IN ('age_proof', 'address_proof') AND validation_status = 'accepted'").bind(applicationId).first<{ count: number }>();
    if (count?.count === 2) await env.DB.batch([
      env.DB.prepare("UPDATE applications SET status = 'slot_pending', current_step = 'slot' WHERE id = ?").bind(applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'completed', completed_at = ? WHERE application_id = ? AND task_code = 'documents'").bind(now(), applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'in_progress' WHERE application_id = ? AND task_code = 'test_slot'").bind(applicationId)
    ]);
    return json(await application(env.DB, applicationId));
  }
  if (request.method === 'GET' && action === 'slots') {
    const slots = await env.DB.prepare(`SELECT s.id, s.slot_date, s.start_time, s.end_time, s.capacity, s.booked_count, c.name AS centre_name
      FROM test_slots s JOIN test_centres c ON c.id = s.centre_id WHERE s.status = 'open' ORDER BY s.slot_date, s.start_time`).all();
    return json(slots.results);
  }
  if (request.method === 'POST' && action === 'booking') {
    const { slotId } = await request.json<{ slotId?: string }>();
    if (!slotId) return json({ error: 'Choose a test slot.' }, 400);
    const slotUpdate = await env.DB.prepare("UPDATE test_slots SET booked_count = booked_count + 1 WHERE id = ? AND status = 'open' AND booked_count < capacity").bind(slotId).run();
    if (!slotUpdate.meta.changes) return json({ error: 'That slot is no longer available. Choose another time.' }, 409);
    try {
      await env.DB.prepare(`INSERT INTO bookings (id, application_id, slot_id, booking_number, mock_payment_confirmed_at)
        VALUES (?, ?, ?, ?, ?)`)
        .bind(id(), applicationId, slotId, `BOOK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, now()).run();
    } catch {
      await env.DB.prepare('UPDATE test_slots SET booked_count = booked_count - 1 WHERE id = ?').bind(slotId).run();
      return json({ error: 'This application already has that slot. Choose another time.' }, 409);
    }
    await env.DB.batch([
      env.DB.prepare("UPDATE applications SET status = 'test_pending', current_step = 'mock_test' WHERE id = ?").bind(applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'completed', completed_at = ? WHERE application_id = ? AND task_code = 'test_slot'").bind(now(), applicationId),
      env.DB.prepare("UPDATE application_tasks SET status = 'in_progress' WHERE application_id = ? AND task_code = 'mock_test'").bind(applicationId)
    ]);
    return json(await application(env.DB, applicationId));
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(request, env, url); }
      catch (error) { console.error(error); return json({ error: 'The demo could not complete that request.' }, 500); }
    }
    return env.ASSETS.fetch(request);
  }
};

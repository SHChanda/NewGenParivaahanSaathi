INSERT OR IGNORE INTO vehicle_categories (id, code, display_name, description) VALUES
  ('cat-mcwg', 'MCWG', 'Scooter or motorcycle', 'Motorcycle with gear'),
  ('cat-lmv-nt', 'LMV-NT', 'Car for personal use', 'Light motor vehicle — non-transport'),
  ('cat-transport', 'TRANSPORT', 'Commercial or goods vehicle', 'Transport vehicle');

INSERT OR IGNORE INTO test_centres (id, name, address, district, state) VALUES
  ('centre-demo', 'Demo Driving Test Centre', 'Mock Civic Services Campus, Sector 18', 'Noida', 'Uttar Pradesh');

INSERT OR IGNORE INTO test_slots (id, centre_id, slot_date, start_time, end_time, capacity, booked_count) VALUES
  ('slot-demo-1', 'centre-demo', '2026-09-08', '10:00', '10:30', 12, 3),
  ('slot-demo-2', 'centre-demo', '2026-09-08', '11:00', '11:30', 12, 7),
  ('slot-demo-3', 'centre-demo', '2026-09-09', '14:00', '14:30', 12, 2);

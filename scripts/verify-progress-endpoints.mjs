/**
 * Live verification for the Progress / Measures screens against a running backend.
 *
 * Replays the exact request sequences the Angular pages build:
 *   MeansuresPage  -> GET/POST /api/my/measurements
 *   MyProgressPage -> GET /api/my/measurements + GET /api/my/progress-report
 *   ClientMeasuresPage (staff) -> GET /api/client-profiles/{clientId}/measures
 *
 * Also proves the coach-self path (a Coach hitting their own /api/my/* — the
 * CoachId==userId check used to 403 this).
 *
 *   node scripts/verify-progress-endpoints.mjs --api https://localhost:7256 \
 *     --client-email <client> --client-password <pw> \
 *     --coach-email <coach>  --coach-password <pw> \
 *     --staff-client-profile-id <guid>   # a client assigned to that coach
 *
 * Exits 0 when every check passes.
 */
import { argv, exit } from 'node:process';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function arg(name, fb) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fb;
}
const API = arg('api', 'https://localhost:7256').replace(/\/$/, '');
const CLIENT_EMAIL = arg('client-email');
const CLIENT_PW = arg('client-password');
const COACH_EMAIL = arg('coach-email');
const COACH_PW = arg('coach-password');
const STAFF_CP = arg('staff-client-profile-id');

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}
async function login(email, pw) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  });
  if (!r.ok) { console.error(`login ${email} -> ${r.status}`); exit(1); }
  return (await r.json()).accessToken;
}
function makeReq(token) {
  return async (method, path, body) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = null; const t = await res.text();
    if (t) { try { json = JSON.parse(t); } catch { /* */ } }
    return { status: res.status, json };
  };
}
const iso = (d) => d.toISOString().slice(0, 10);

// ── CLIENT: /api/my/* ────────────────────────────────────────────────────────
if (CLIENT_EMAIL && CLIENT_PW) {
  const req = makeReq(await login(CLIENT_EMAIL, CLIENT_PW));
  console.log(`\n── CLIENT ${CLIENT_EMAIL} — /api/my/* ──`);

  const m = await req('GET', '/api/my/measurements');
  check('GET /api/my/measurements -> 200', m.status === 200, `got ${m.status}`);
  check('  ...newest-first array', Array.isArray(m.json) && m.json.length >= 1);
  check('  ...row shape {id,weight,...,recordedAt}',
    !!m.json?.[0] && ['id', 'weight', 'bodyFatPercentage', 'muscleMass', 'waist', 'chest', 'arms', 'recordedAt']
      .every((k) => k in m.json[0]),
    m.json?.[0] ? `keys: ${Object.keys(m.json[0]).join(',')}` : '');
  if (Array.isArray(m.json) && m.json.length >= 2) {
    check('  ...sorted newest-first',
      new Date(m.json[0].recordedAt) >= new Date(m.json[1].recordedAt));
  }

  const rep = await req('GET', '/api/my/progress-report');
  check('GET /api/my/progress-report -> 200', rep.status === 200, `got ${rep.status}`);
  check('  ...has weight/bodyFatPercentage/waist/completedSets metrics',
    !!rep.json && ['weight', 'bodyFatPercentage', 'waist', 'completedSets'].every((k) => k in rep.json));
  check('  ...each metric is {current, previous, delta}',
    !!rep.json?.weight && ['current', 'previous', 'delta'].every((k) => k in rep.json.weight));

  // POST for "today" — MeansuresPage omits recordedAt
  const addToday = await req('POST', '/api/my/measurements',
    { weight: 76.5, bodyFatPercentage: 15, muscleMass: 35, waist: 79, chest: 101, arms: 39 });
  check('POST /api/my/measurements (no recordedAt) -> 204', addToday.status === 204, `got ${addToday.status}`);

  // POST for a past date — MeansuresPage sends `${date}T12:00:00Z`
  const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const addPast = await req('POST', '/api/my/measurements',
    { weight: 77, bodyFatPercentage: 16, muscleMass: 35, waist: 80, chest: 101, arms: 39, recordedAt: `${iso(past)}T12:00:00Z` });
  check('POST /api/my/measurements (past date) -> 204', addPast.status === 204, `got ${addPast.status}`);

  // future date -> 400 (server enforces; the FE also blocks this client-side)
  const addFuture = await req('POST', '/api/my/measurements',
    { weight: 77, bodyFatPercentage: 16, muscleMass: 35, waist: 80, chest: 101, arms: 39, recordedAt: '2099-01-01T00:00:00Z' });
  check('POST /api/my/measurements (future date) -> 400', addFuture.status === 400, `got ${addFuture.status}`);

  // staff routes must be closed to a plain Client
  const staffRoute = await req('GET', '/api/client-profiles');
  check('GET /api/client-profiles (staff list) -> 403 for a Client', staffRoute.status === 403, `got ${staffRoute.status}`);
}

// ── COACH: coach-self /api/my/* + staff read on an assigned client ────────────
if (COACH_EMAIL && COACH_PW) {
  const req = makeReq(await login(COACH_EMAIL, COACH_PW));
  console.log(`\n── COACH ${COACH_EMAIL} — coach-self /api/my/* + staff read ──`);

  const m = await req('GET', '/api/my/measurements');
  check('coach GET /api/my/measurements -> 200 (was 403 for CoachSelf)', m.status === 200, `got ${m.status}`);
  const rep = await req('GET', '/api/my/progress-report');
  check('coach GET /api/my/progress-report -> 200', rep.status === 200, `got ${rep.status}`);

  if (STAFF_CP) {
    const staff = await req('GET', `/api/client-profiles/${STAFF_CP}/measures`);
    check('coach GET /api/client-profiles/{assignedClient}/measures -> 200 (ClientMeasuresPage)',
      staff.status === 200, `got ${staff.status}`);
    check('  ...array', Array.isArray(staff.json));
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) console.log('FAILED:', failed.map((f) => f.label).join(' | '));
exit(failed.length === 0 ? 0 : 1);

/**
 * Live integration check for the "My Area" (self-service) plan endpoints.
 *
 * Unit specs (HttpTestingController) can only prove which URL the Angular services
 * *build*. This script proves the account can actually *reach* those URLs on a
 * running backend, and that the staff meal-plan route the pages used to call does
 * NOT serve a caller their own My-Area data — so if someone repoints
 * MyNutritionPage / MyTrainingPage back at the staff routes, this fails loudly.
 *
 * Works for both roles that have a personal ClientProfile:
 *   - Client
 *   - Coach (backend commit 77b7043 gives every gym-assigned Coach a personal
 *     ClientProfile, Kind=CoachSelf, reachable only via /api/my/*, /me, start-today)
 *
 * The role is read from the JWT and expectations adjust:
 *   both  : /me 200, /my/meal-plans 200, /my/training-plans 200,
 *           /api/meal-plans/client/{cp}/active 403  (staff route won't serve your own profile)
 *   Client: /api/workoutroutines?status=Published 403  (Client is not routine staff)
 *   Coach : /api/workoutroutines?status=Published 200  (Coach IS routine staff)
 *
 * NOT part of `ng test` (needs a live backend + a seeded account). Run manually:
 *
 *   node scripts/verify-client-endpoints.mjs \
 *     --api https://localhost:7256 \
 *     --email e2e.client@fitros.com --password 'TestPass123!'
 *
 * Env vars also work: FITROS_API, FITROS_CLIENT_EMAIL, FITROS_CLIENT_PASSWORD.
 * Exits 0 when every assertion holds, 1 otherwise.
 */
import { argv, env, exit } from 'node:process';

// Local dev backend uses a self-signed cert.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const API = arg('api', env.FITROS_API ?? 'https://localhost:7256').replace(/\/$/, '');
const EMAIL = arg('email', env.FITROS_CLIENT_EMAIL);
const PASSWORD = arg('password', env.FITROS_CLIENT_PASSWORD);

if (!EMAIL || !PASSWORD) {
  console.error('Missing --email / --password (or FITROS_CLIENT_EMAIL / FITROS_CLIENT_PASSWORD).');
  exit(2);
}

const results = [];
function check(label, actual, expected) {
  const ok = actual === expected;
  results.push({ label, actual, expected, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (got ${actual}, want ${expected})`);
}

async function status(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.status;
}

function roleFromJwt(token) {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return (
      p.role ??
      p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      'unknown'
    );
  } catch {
    return 'unknown';
  }
}

const login = await fetch(`${API}/api/Auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!login.ok) {
  console.error(`Login failed: ${login.status}`);
  exit(1);
}
const { accessToken, userId } = await login.json();
const role = roleFromJwt(accessToken);

const meRes = await fetch(`${API}/api/client-profiles/me`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const cp = meRes.ok ? (await meRes.json()).id : '00000000-0000-0000-0000-000000000000';

console.log(`\n${role} ${EMAIL} (user ${userId}, profile ${cp}) against ${API}\n`);

// Holds for every role that owns a personal ClientProfile.
check('GET /api/client-profiles/me is reachable', meRes.status, 200);
check('GET /api/my/meal-plans is reachable', await status('/api/my/meal-plans', accessToken), 200);
check('GET /api/my/training-plans is reachable', await status('/api/my/training-plans', accessToken), 200);

// The staff meal-plan route must not serve the caller their OWN My-Area data
// (Client: 403 at the controller; Coach: 403 in the handler — CoachId mismatch on
// their CoachSelf profile). Either way MyNutritionPage must never rely on it.
check('GET /api/meal-plans/client/{cp}/active does NOT serve own data', await status(`/api/meal-plans/client/${cp}/active`, accessToken), 403);

// The published-routines catalogue: staff-only. Client can't read it (403), which is
// why MyTrainingPage's picker must use /api/my/training-plans; Coach IS staff (200).
check(
  'GET /api/workoutroutines?status=Published matches role',
  await status('/api/workoutroutines?status=Published', accessToken),
  role === 'Coach' ? 200 : 403,
);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
exit(failed.length === 0 ? 0 : 1);

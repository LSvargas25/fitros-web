/**
 * Live end-to-end check for the weekly training plan feature.
 *
 * Unit specs (HttpTestingController) only prove which URL / method / body the
 * Angular services *build*. This script replays those exact request sequences
 * against a running backend and asserts the real status codes + a few response
 * fields, for:
 *   - the STAFF management screen  (WeeklyPlansPage + TrainingPlanService)
 *   - the COACH-SELF path          (WeeklyPlansPage in selfMode, same service)
 *   - the /active endpoints        (MyNutritionPage / MyTrainingPage)
 *
 * NOT part of `ng test` (needs a live backend + seeded accounts). Run manually:
 *
 *   node scripts/verify-weekly-plan-flow.mjs \
 *     --api https://localhost:7256 \
 *     --staff-email fe.coach.x@fitros.com --staff-password 'Passw0rd!' \
 *     --client-profile-id <guid> \
 *     --coach-self-profile-id <guid> \
 *     --published-routine-id <guid> --draft-routine-id <guid>
 *
 * Exits 0 when every assertion holds, 1 otherwise.
 */
import { argv, exit } from 'node:process';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // local dev self-signed cert

function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const API = arg('api', 'https://localhost:7256').replace(/\/$/, '');
const STAFF_EMAIL = arg('staff-email');
const STAFF_PASSWORD = arg('staff-password');
const CLIENT_PROFILE_ID = arg('client-profile-id');
const COACH_SELF_PROFILE_ID = arg('coach-self-profile-id');
const PUBLISHED_ROUTINE_ID = arg('published-routine-id');
const DRAFT_ROUTINE_ID = arg('draft-routine-id');

for (const [k, v] of Object.entries({
  STAFF_EMAIL, STAFF_PASSWORD, CLIENT_PROFILE_ID,
  COACH_SELF_PROFILE_ID, PUBLISHED_ROUTINE_ID, DRAFT_ROUTINE_ID,
})) {
  if (!v) { console.error(`Missing --${k.toLowerCase().replace(/_/g, '-')}`); exit(2); }
}

let token = '';
const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  if (text) { try { json = JSON.parse(text); } catch { /* non-JSON */ } }
  return { status: res.status, json, text };
}

// ── login (matches SessionFacade / AuthService: POST /api/Auth/login) ──────────
{
  const res = await fetch(`${API}/api/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
  });
  if (!res.ok) { console.error(`Login failed: ${res.status}`); exit(1); }
  token = (await res.json()).accessToken;
}

console.log(`\nweekly-plan flow against ${API} as ${STAFF_EMAIL}\n`);
console.log('── STAFF: manage a client\'s weekly plan ──');

// create (TrainingPlanService.create -> POST { clientProfileId, name })
const create1 = await req('POST', '/api/training-plans', {
  clientProfileId: CLIENT_PROFILE_ID,
  name: `FE verify ${Date.now()}`,
});
check('POST /api/training-plans -> 201', create1.status === 201, `got ${create1.status}`);
const plan1 = create1.json?.id;
check('create response carries { id }', typeof plan1 === 'string' && plan1.length > 0);

// getById (TrainingPlanService.getById)
const detail0 = await req('GET', `/api/training-plans/${plan1}`);
check('GET /api/training-plans/{id} -> 200', detail0.status === 200, `got ${detail0.status}`);
check('new plan has no assigned days', Array.isArray(detail0.json?.days) && detail0.json.days.length === 0);
check('plan status is Draft (1)', detail0.json?.status === 1, `got ${detail0.json?.status}`);

// assignDay Monday=1 with the PUBLISHED routine (changeDayRoutine -> PUT /days/{day} { workoutRoutineId, notes })
const assignMon = await req('PUT', `/api/training-plans/${plan1}/days/1`, {
  workoutRoutineId: PUBLISHED_ROUTINE_ID,
  notes: null,
});
check('PUT /days/1 (published routine) -> 204', assignMon.status === 204, `got ${assignMon.status}`);

// assignDay Tuesday=2 with the DRAFT routine -> 400 (only Published assignable)
const assignDraft = await req('PUT', `/api/training-plans/${plan1}/days/2`, {
  workoutRoutineId: DRAFT_ROUTINE_ID,
  notes: null,
});
check('PUT /days/2 (draft routine) -> 400', assignDraft.status === 400, `got ${assignDraft.status}`);

// re-read: Monday assigned, camelCase workoutRoutineName present
const detail1 = await req('GET', `/api/training-plans/${plan1}`);
const mon = detail1.json?.days?.find((d) => d.day === 1);
check('day 1 now assigned', !!mon && mon.workoutRoutineId === PUBLISHED_ROUTINE_ID);
check('day DTO field is `workoutRoutineName` (camelCase)',
  !!mon && typeof mon.workoutRoutineName === 'string' && mon.workoutRoutineName.length > 0,
  mon ? `keys: ${Object.keys(mon).join(',')}` : 'no day');

// clearDay (changeDayRoutine('') -> DELETE /days/{day}) while the plan is still editable
const clearMon = await req('DELETE', `/api/training-plans/${plan1}/days/1`);
check('DELETE /days/1 -> 204', clearMon.status === 204, `got ${clearMon.status}`);
const detailCleared = await req('GET', `/api/training-plans/${plan1}`);
check('day 1 is a rest day again after clear',
  !detailCleared.json?.days?.some((d) => d.day === 1));
// re-assign so the rest of the flow has an assigned day
await req('PUT', `/api/training-plans/${plan1}/days/1`, { workoutRoutineId: PUBLISHED_ROUTINE_ID, notes: null });

// activate (TrainingPlanService.activate -> PATCH /activate)
const act1 = await req('PATCH', `/api/training-plans/${plan1}/activate`);
check('PATCH /activate -> 204', act1.status === 204, `got ${act1.status}`);

// client active plan (TrainingPlanService.getClientActivePlan)
const active1 = await req('GET', `/api/training-plans/client/${CLIENT_PROFILE_ID}/active`);
check('GET /client/{cp}/active -> 200', active1.status === 200, `got ${active1.status}`);
check('active plan is the one just activated', active1.json?.id === plan1);
check('active plan status is Active (2)', active1.json?.status === 2, `got ${active1.json?.status}`);

// one-active rule: create + activate a 2nd plan -> the 1st becomes Archived (3)
const create2 = await req('POST', '/api/training-plans', {
  clientProfileId: CLIENT_PROFILE_ID,
  name: `FE verify 2 ${Date.now()}`,
});
const plan2 = create2.json?.id;
await req('PATCH', `/api/training-plans/${plan2}/activate`);
const detail1After = await req('GET', `/api/training-plans/${plan1}`);
check('activating a 2nd plan archives the 1st (status 3)', detail1After.json?.status === 3,
  `got ${detail1After.json?.status}`);
const active2 = await req('GET', `/api/training-plans/client/${CLIENT_PROFILE_ID}/active`);
check('.../active now returns the 2nd plan', active2.json?.id === plan2);
check('client history list still returns both plans',
  (await req('GET', `/api/training-plans/client/${CLIENT_PROFILE_ID}`)).json?.length >= 2);

// an archived plan is read-only — the FE disables day edits; the backend enforces it too
const editArchived = await req('PUT', `/api/training-plans/${plan1}/days/4`, {
  workoutRoutineId: PUBLISHED_ROUTINE_ID, notes: null,
});
check('PUT /days on an archived plan is rejected (FE also disables this)',
  editArchived.status === 400 || editArchived.status === 409, `got ${editArchived.status}`);

console.log('\n── COACH-SELF: manage own CoachSelf weekly plan (same endpoints) ──');

const me = await req('GET', '/api/client-profiles/me');
check('GET /api/client-profiles/me -> 200', me.status === 200, `got ${me.status}`);
check('own profile id matches the expected CoachSelf id', me.json?.id === COACH_SELF_PROFILE_ID,
  `got ${me.json?.id}`);

// Exact sequence WeeklyPlansPage issues on selfMode load: getMyProfile() -> id ->
// onClientChange() -> loadPlans() -> getClientPlans(id) i.e. the staff-scoped
// GET /api/training-plans/client/{coachSelfId}. This 403'd for a CoachSelf profile
// (CoachId=null) until backend 438d9a8 — if it regresses, the screen goes blank.
const selfList = await req('GET', `/api/training-plans/client/${COACH_SELF_PROFILE_ID}`);
check('coach GET /api/training-plans/client/{ownCoachSelfId} -> 200 (was 403)',
  selfList.status === 200, `got ${selfList.status}`);
check('  ...and returns an array', Array.isArray(selfList.json));
const selfActive0 = await req('GET', `/api/training-plans/client/${COACH_SELF_PROFILE_ID}/active`);
check('coach GET /api/training-plans/client/{ownCoachSelfId}/active -> 200 or 404 (not 403)',
  selfActive0.status === 200 || selfActive0.status === 404, `got ${selfActive0.status}`);

const selfCreate = await req('POST', '/api/training-plans', {
  clientProfileId: COACH_SELF_PROFILE_ID,
  name: `FE self verify ${Date.now()}`,
});
check('coach POST /api/training-plans for own profile -> 201', selfCreate.status === 201, `got ${selfCreate.status}`);
const selfPlan = selfCreate.json?.id;
const selfAssign = await req('PUT', `/api/training-plans/${selfPlan}/days/3`, {
  workoutRoutineId: PUBLISHED_ROUTINE_ID, notes: null,
});
check('coach PUT own /days/3 -> 204', selfAssign.status === 204, `got ${selfAssign.status}`);
const selfActivate = await req('PATCH', `/api/training-plans/${selfPlan}/activate`);
check('coach PATCH own /activate -> 204', selfActivate.status === 204, `got ${selfActivate.status}`);

// what the selfMode screen shows after activate (staff-scoped reads on own profile)
const selfActiveAfter = await req('GET', `/api/training-plans/client/${COACH_SELF_PROFILE_ID}/active`);
check('coach .../client/{own}/active -> 200 the just-activated self plan',
  selfActiveAfter.status === 200 && selfActiveAfter.json?.id === selfPlan,
  `status ${selfActiveAfter.status}, id ${selfActiveAfter.json?.id}`);
check('  ...its day 3 carries the assigned Published routine',
  selfActiveAfter.json?.days?.some((d) => d.day === 3 && d.workoutRoutineId === PUBLISHED_ROUTINE_ID));
const selfListAfter = await req('GET', `/api/training-plans/client/${COACH_SELF_PROFILE_ID}`);
check('coach .../client/{own} list includes the self plan',
  Array.isArray(selfListAfter.json) && selfListAfter.json.some((p) => p.id === selfPlan));

console.log('\n── /active endpoints consumed by MyTraining / MyNutrition ──');

// WorkoutSessionService.getMyAssignedRoutines -> GET /api/my/training-plans/active
const myTrainingActive = await req('GET', '/api/my/training-plans/active');
check('GET /api/my/training-plans/active -> 200 (coach has an active plan)',
  myTrainingActive.status === 200, `got ${myTrainingActive.status}`);
check('my active training plan is the coach-self plan just activated',
  myTrainingActive.json?.id === selfPlan);
const dayThree = myTrainingActive.json?.days?.find((d) => d.day === 3);
check('client-facing day DTO also uses `workoutRoutineName`',
  !!dayThree && typeof dayThree.workoutRoutineName === 'string');

// MealPlanService.getMyActivePlan -> GET /api/my/meal-plans/active ; 404 == no plan
const myMealActive = await req('GET', '/api/my/meal-plans/active');
check('GET /api/my/meal-plans/active -> 404 (coach has no meal plan) or 200',
  myMealActive.status === 404 || myMealActive.status === 200, `got ${myMealActive.status}`);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) console.log('FAILED:', failed.map((f) => f.label).join(' | '));
exit(failed.length === 0 ? 0 : 1);

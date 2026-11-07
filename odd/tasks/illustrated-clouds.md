# Illustrated Clouds
Build a complete standalone cloud-motion studio. Branch: `feat/illustrated-clouds`; delivery: single-pr (local work units only; no publishing).
Runner: Vitest + protected Playwright functional delivery. Forecast: approximately 1,000 authored lines. First-delivery tier: 4. Engram mirror pending (server rejects project context).

## Specs
- S1: "quiero hacer un video de unas nubes pasando por un cielo transparente. estas nubes pasan de izuqierda a derecha de forma suave, dando sensación de calma, de forma caotica(desordenada, nubes separadas, nubes juntas, espacios grandes, espacios pequeños, variación en forma, tamaño y distancia vertical, unas mas arriba que otras y otras bajas, pero siempre estando en la parte superior. en la parte superior". Transparency is superseded by S3; preserve the remaining motion and composition intent. Test seeded layout, direction, upper confinement and loop continuity.
- S2: "serían tipo ilustradas". Use rounded illustrated silhouettes rather than realistic textures. Inspect actual product composition.
- S3: "calla calla, prefiero que añadas un bg y ya, configurable. empieza el proyecto de incio a fin". Use the canonical configurable runtime background and complete image/video export; no transparent-video changes or upstream checkout.
- S4: "no solo lo empieces , terminalo de principio a fil". Complete native controls, timeline, exports, cover, acceptance and first-delivery functional proof. Do not claim completion while checks are pending.

## Tasks
- T1 [S1,S2] inline — complete: deterministic domain model; missing-module RED followed by 4 passing domain tests; commit pending.
- T2 [S1–S3] inline then delegated — complete: native schema, assessed pipeline, shared live/export geometry; typecheck/build and product browser proof pass; commit pending.
- T3 [S1–S4] delegated then inline correction — partial: acceptance, 22 product browser tests, actual cover and product worklog complete; protected full-delivery proof remains blocked by framework/tooling failures; commit pending.

## Log
- L1 Original request: "buenas crack usa la $toolcraft-lab-architect para crear esto. quiero hacer un video de unas nubes pasando por un cielo transparente. estas nubes pasan de izuqierda a derecha de forma suave, dando sensación de calma, de forma caotica(desordenada, nubes separadas, nubes juntas, espacios grandes, espacios pequeños, variación en forma, tamaño y distancia vertical, unas mas arriba que otras y otras bajas, pero siempre estando en la parte superior. en la parte superior"
- L2 Style clarification: "serían tipo ilustradas".
- L3 Scope clarification: "no solo lo empieces , terminalo de principio a fil".
- L4 Latest scope replaces transparent video: "calla calla, prefiero que añadas un bg y ya, configurable. empieza el proyecto de incio a fin".
- L5 Read-only explorer (GPT-6.1 Sol explicitly approved) mapped the public runtime. The opaque video limitation no longer blocks S3. No runtime, signed config or dependency changes are planned. Default 1920×1080, 40-second cycle and upper-third band are design assumptions, not user quotes.
- L6 Routes: assembly, controls, renderer, timeline, export and acceptance. Applicable Plan docs read; Implementation docs read before code. Parent writes inline because units depend on one another; no parallel writer reason. Domain is additive, with no shared command changes. Risk: none for the planned product-only implementation.
- L7 Rollback: remove cloud-owned modules/tests and restore product assembly/config/worklog together. No stored-format migrations. Functional delivery only; no measured performance audit.
- L8 Implementation was handed to a bounded Sol writer at the long-session context backstop, with explicit product-only edit surfaces. Final suite execution used a separate bounded test runner, not an independent risk verifier. Risk: none (additive product behavior; signed runtime unchanged).
- L9 Final correction: persistence proof was moved out of signed `e2e/app-persistence.spec.ts` into app-owned `e2e/product-clouds-persistence.ts`, called from `e2e/product-clouds.spec.ts`. Signed persistence bytes were restored exactly; integrity passed all 877 files. The schema test now names the new product proof owner.
- L10 Observed final proof: production build passed; typecheck passed; all 22 product browser tests passed with zero skips. Parent reran the new persistence proof (1 passed) and all 11 product/domain/schema assertions passed in a focused run. No measured performance was run.
- L11 Full proof is NOT green: `npm run test` passed docs/integrity but its script suite reported failures and stopped making progress; its exact test process was terminated, not recorded as a natural completed verdict. Direct Vitest reported 714 passed/3 failed/9 skipped before the stale schema-test location was corrected. The remaining signed alias-path mismatch and mixed-budget timeout both reproduce at base `45b169c` in an isolated archive. Full logs live under `.toolcraft/browser-artifacts/clouds-final-*.log`. `test:feature` also hits a signed Windows journal-directory rename EPERM. No gate was weakened, skipped into PASS, or patched.
- L12 Needs your decision: a passing protected initial-delivery receipt requires the Toolcraft Windows verification failures to be resolved upstream or a separately authorized framework fork. The implemented app and its product-specific functional proof are usable; S4's aggregate proof remains pending. Engram mirror remains unavailable.

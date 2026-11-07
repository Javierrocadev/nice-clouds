# Toolcraft App Agent Worklog

## Status
Mode: product
Active change: illustrated-clouds-v1
First product delivery is in progress; functional verification tier 4. No measured performance is authorized.

## Decision Trail
### illustrated-clouds-v1
- Change ID: illustrated-clouds-v1
- Request: "calla calla, prefiero que añadas un bg y ya, configurable. empieza el proyecto de incio a fin"
- Task type: New standalone procedural motion product.
- User-visible result: Illustrated upper-region clouds move calmly right over a configurable background, with native image/video export.
- Source/reference checked: Original user messages and generated app contracts.
- Reference inputs: None; referenceInputs is empty.
- Docs/contracts read: workflow; runtime-boundary; assembly-workflow; control-selection; layout; slider-ranges; timeline-animation; setup-export; media-upload; schema-reference; component-rules; decision-contract; renderer-technique; core/performance; performance; acceptance-testing; app-cover.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, controls-product-coverage, renderer-view-interaction, timeline-enabled-behavior, output-export-required, persistence-policy-explicit.
- View interaction intent: non-spatial; this is flat illustration, not a 3D scene.
- Interaction ownership: Global cloud properties belong to the panel. No mirrored canvas handles.
- Decision: Seeded periodic vector silhouettes; one forward cycle per runtime duration. Background uses the canonical runtime pair, enabled by default. Transparency of video was explicitly superseded by the latest user request.
- Alternatives rejected: Photorealistic textures contradict the illustrated style. A GPU backend is unnecessary. A Canvas preview adds raster backing invalidation to geometry naturally retained as SVG; use identical paths with runtime Canvas2D artifact export instead. No SVG export was requested.
- State/output mapping: clouds.* controls feed the pure seeded layout and shared silhouette; timeline progress translates normalized x; appearance.background/export.includeBackground feed runtime background composition; export settings remain module-owned.
- Verification: Model RED observed (missing module), then 4 domain tests passed. Typed render-plan assessment passed before renderer implementation. Typecheck passed after explicit pipeline availability guards. Browser smoke shows real product and native controls without console errors. Full proof remains pending.
- Risks: Native browser video codecs can report a typed unsupported result. No signed framework source, root config or runtime files are changed.

- Completion scope: Finish S1–S4 with a configurable background.
- Changed owners: Cloud drawing, public acceptance metadata, product browser tests and performance adapters.
- Decision: Shared normalized cubic segments feed both SVG serialization and direct Canvas2D bezier commands. Flat illustrated fill is consistent across preview and artifacts; no optional gradient or Path2D capability is needed. The protected AST rejected CanvasGradient/Path2D, so the simpler supported implementation preserves intended illustrated behavior without patching guards.
- Development checks: Domain/assembly/acceptance assertions and typecheck passed. Final product browser selection passed 22/22 with zero skips, including exact canvas/values/panels/timeline persistence after reload. Count and other sliders proved live pixels before pointer release. Native JPG/PNG 2K/4K/8K and MP4/WebM/current/4K downloads decoded successfully.
- Blocker: test:feature twice fails before app loading with Windows EPERM in signed journal code renaming a directory after opening events.jsonl inside it. No signed file changed. Initial delivery first attempt stopped during catalog collection because acceptance IDs spanned domains in one spec; IDs are now consistently clouds.*. No receipt or completion claimed.
- Final boundary: The extended persistence proof is now app-owned; the signed original persistence spec was restored byte-for-byte. Integrity passes 877 files. Parent spot checks passed the new persistence case and all 11 product assertions. Production build and typecheck pass. The script test suite failed and stopped making progress; it was terminated without a natural verdict. Two remaining signed Vitest failures (Windows alias separators and mixed-plan timeout) both reproduce at the original base commit. The full first-delivery receipt remains unavailable, not passed. No measured performance audit was run.


## Decisions
### Renderer
- Decision: SVG preview with shared analytic paths rasterized by the runtime Canvas2D export callback.
- Reason: Few smooth vector silhouettes remain crisp through pan/zoom without raster backing churn.
- Evidence: clouds-pipeline.ts, clouds-renderer.tsx, clouds-drawing.ts; both preview and export use shared cloudCurves geometry.
### View Interaction
- Decision: non-spatial, from product semantics; no orientation targets.
- Reason: Flat illustrated clouds do not expose a spatial model.
- Evidence: appProductReadiness.viewInteraction. Fixed/orbit cameras are not applicable.
### Interaction Ownership
- Decision: Panel-owned global property editing.
- Reason: Procedural distribution settings are not manually selected entities.
- Evidence: Typed interactionOwnership links every clouds.* target to acceptance.
### Timeline
- Decision: Native playback timeline, initially 40 seconds, forward-only seamless loop.
- Reason: A 1920px traversal in 40 seconds gives a calm initial drift; duration remains editable.
- Evidence: timelineModule and product-derived loopDuration; pure periodic model tests.
### Layers
- Decision: Disabled.
- Reason: No user-requested layer workflow.
- Evidence: No layersModule in schema.
### Controls
- Decision: One Clouds entity plus canonical runtime Background and export settings.
- Reason: Distribution, silhouette variation and fill share one reset scope. Seven cloud controls are sufficient without duplicating timeline duration.
- Evidence: appControlSectionInventory and native schema controls. Count is limited to 24 by supported workload; upper band to the upper half by user intent; normalized clustering/variation have semantic 0..1 domains. Size has a bounded supported illustration domain; seed is a deterministic integer bank.
### Export
- Decision: Default image plus explicitly requested video, no SVG artifact.
- Reason: Latest request allows a configurable opaque background. Native export satisfies this without upstream changes.
- Evidence: Original user message identity retained in exportIntent; subsequent background amendment retained in the task log. Shared rasterFrameRenderer; no custom encoder or download path.
### Performance
- Decision: Bounded vector geometry and runtime-owned batch export; functional proof only.
- Reason: At most 24 silhouettes and wrap copies, no pixel filters or textures.
- Evidence: Assessed canonical pipeline, numeric workload envelope, derived paths and matching adapters. Preview work coalesces during viewport interaction; no independent animation clock. Full measured audit not run.

## Evidence
- Source reviewed: Generated schema, native composition/export/timeline contracts and public runtime API.
- Cover: Native PNG export captured at phase 0 in an isolated browser context; app-cover-state.json preserves settings and public/toolcraft/cover.png is output-only 16:9.

## Verification
- Focused domain tests: 4 passed after RED.
- Render-plan assessment: passed.
- Typecheck: passed.
- Product browser proof: 22 passed, zero failed/skipped.
- Production build: passed (large-chunk warnings only).
- Protected integrity: 877 files passed; code health passed.
- First-delivery functional gate: blocked; no successful receipt. See the exact failures in odd/tasks/illustrated-clouds.md and `.toolcraft/browser-artifacts/clouds-final-unit.log` / `clouds-final-vitest.log`.
- Performance measurements: not run; no performance complaint or audit request.

## Risks
- Risk: No stored-format migration or shared runtime/API change. Native codec support must be tested, not assumed.
- Risk: Engram rejects the resolved project; local feature document is authoritative and its mirror remains pending.

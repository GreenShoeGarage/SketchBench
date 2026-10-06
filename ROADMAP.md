# SKETCHBENCH v2 roadmap and release status

October 6, 2026 · **2.0.0-rc.5**

The user authorized development through v2.0 without intermediate batch approvals. Fillets and chamfers are required features. They are implemented with a native CAD kernel and included in this candidate.

| Batch | Result in this candidate | Evidence / boundary |
| --- | --- | --- |
| 1.1 · CAD foundation | Bundled Replicad/OpenCascade WASM worker, BREP plus display mesh, kernel validation, cancellation | Real kernel tests and shipped-bundle execution; no remote runtime dependency |
| 1.2 · Connected solids | Face drawing/division, native region extrusion, cuts/openings, coplanar merge, migration and mesh conversion | Controller-level through-cut and nested analytic-hole tests |
| 1.3 · Chamfers | Equal, two distances, distance + angle; selected/all/chain edges; preview/apply/cancel; editable last operation | All three modes, circular bore and invalid-input preservation |
| 1.4 · Fillets | Constant and start/end variable radius, internal/external corners, multi-edge rounds | Rounded block, thin enclosure, variable-radius edit, translated-history regression |
| 1.5 · Modeling | Booleans/trim, split plane, offsets, hollow sweeps, planar resize, repeat/to-face push/pull | Native volume/validity tests and exported solids |
| 1.6 · Precision | Unit fractions, guides/inference, extra sketch gestures, transforms/pivots, selection and mesh stretching | Controller/geometry tests; no parametric solver or arbitrary native vertex deformation |
| 1.7 · Assemblies | Group hierarchy/context, linked definitions, copy identity, propagation and Make Unique | Translated-instance geometry, color, member addition/deletion tests |
| 1.8 · Presentation | Materials/textures/opacity, smooth display, camera modes/walk, pinch, scenes/transitions, simple shadows | Projection and software pixel checks; GPU/touch/interaction acceptance pending |
| 1.9 · Documentation | Section/fill/SVG, attached bounds dimensions, angular/leader/fixed dimensions, native 3D text, STEP | Section-hole, dimension persistence, native text and STEP readback |
| 2.0 · Integration | Scoped offline assets, full source package, examples, updated help/docs and format limits | Automated suite and export readback pass; stable release gate remains open |

## Remaining stable-v2.0 gate

1. Real desktop-browser model sessions: rectangle → extrusion → face cut → fillet/chamfer preview/cancel/apply/edit → save/reload → export.
2. WebGL and Canvas display on desktop/tablet/phone; pole-crossing orbit, grid occlusion, smooth seams, textures/transparency and sections.
3. Mouse, keyboard, pen and touch operation, dialog focus, small-screen layout, and screen-reader labeling.
4. Real IndexedDB, storage denial/quota exhaustion and multiple-tab conflict behavior.
5. First install and offline reload under a nested HTTPS route, including the worker, WASM, font and an app upgrade.
6. Browser file pickers/downloads, screenshots and print/PDF output; independent viewer/slicer inspection.

The hosted rc.1 startup failure was reproduced. rc.2 bundles a single `.js` worker and adds explicit WASM validation and recovery diagnostics; its HTTP/VM tests pass. Upload and browser acceptance of rc.2 are still required. No GPU, touch, native browser-storage or offline-load pass is claimed. The deliverable remains **rc.5**, pending that acceptance.

## Broader gaps that remain outside this candidate

Native SKP/OpenSketch/DWG/DXF compatibility; a full parametric constraint solver and feature tree; LayOut-style multi-page drawings; physical/geographic lighting and advanced rendering; UV unwrap and fully textured interchange; extension/warehouse ecosystems; multi-user collaboration; unrestricted native vertex deformation and difficult imported-shape repair.

These are explicit remaining gaps, not hidden placeholders. The app remains self-hosted and local-first. AI, prompts, API keys, analytics and cloud account features remain excluded.

### rc.4 addition

Shell supports inward wall thickness, one or multiple face openings, and closed cavities, with native validation, preview/apply/cancel, and undo. Filleted planar openings have an offset/cut fallback. Automated coverage passes; browser acceptance remains part of the release gate.

### rc.5 addition

Visible in-viewport dimensions now share the mouse drawing draft. Workplane creation and face picking have explicit controls and finite plane visualization. Split Body selects two ordered parallel planar faces, with midpoint or a unit-aware offset from the first face, native preview and undo. Controller/kernel checks cover invalid selection, cancellation, transforms and linked components; browser acceptance remains open.

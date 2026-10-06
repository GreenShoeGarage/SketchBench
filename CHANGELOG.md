# 2.0.0-rc.5 — October 6, 2026

- Add visible drawing dimensions for rectangles, circles, lines/profiles and rotated rectangles. Unit-aware fields share the mouse preview, preserve drawing direction, and support Tab/Enter, keyboard numeric entry, click-drag and two-click drawing.
- Add Workplane… and Pick face controls, blue plane patch/border and U/V/N axes, explicit normal offsets, face view, visibility, and persistent face-plane preferences. Explicit planes no longer get silently replaced by automatic face alignment.
- Add guided Split Body using two ordered parallel planar faces, midpoint or a distance from the first face, an orange plane, colored native preview, validation, cancellation and undo. Split linked members propagate without overlapping originals.
- Check native split volume conservation and reject no-op/outside splits. Distances work with transformed solids and unit fractions; stale previews cannot commit after settings or model changes.
- Add native-kernel, controller, shipped-script/worker and render-depth regressions. Real browser/GPU/touch acceptance remains open.

# 2.0.0-rc.4 — October 6, 2026

- Add Solid tools → Shell with inward wall thickness, clicked-face preselection, multiple openings, a face-view chooser, and fully closed hollow bodies.
- Add preview/apply/cancel and transactional undo. Parameter changes and late worker results cannot restore stale previews or apply cancelled edits.
- Validate native topology, connected material, volume removal, and exterior containment. Add a native offset/cut path for closed cavities and planar openings on filleted bodies when the thick-solid operation fails.
- Correct the previously unexposed shell operation’s thickness direction and reject no-op kernel results.
- Add shell geometry, worker, and controller regressions; all 128 tests pass.

# 2.0.0-rc.3 — October 6, 2026

- Align face sketch grids to a stable world-axis reference and projected world origin. Selecting a different triangle of the same face no longer rotates or offsets the grid.
- Add Left and Bottom view buttons, preserving the model, zoom, and camera target. Keep the view-button group horizontally scrollable on narrow screens.
- Add regression checks for all six native box faces, tilted faces, and button-driven camera orientation. Existing grid occlusion and full-orbit checks still pass.

# 2.0.0-rc.2 — October 6, 2026

- Bundle the deployed CAD worker and its JavaScript dependencies into `cad/worker.js`, removing the runtime requirement for `.mjs` MIME configuration.
- Fetch and validate WASM bytes explicitly; support binary MIME responses and report missing/forbidden files, HTML fallbacks, truncated binaries, and compilation errors.
- Preserve useful startup errors in Solid tools, reject pending operations on failure, add Retry solid engine, and bound silent initialization to 90 seconds. Ignore stale worker messages and diagnostics after a restart.
- Update the offline manifest/cache and revalidate assets during installation. Existing projects remain untouched.
- Add integration coverage for the shipped worker over nested HTTP paths with real WASM, plus startup failures and retry races. This is Node VM coverage, not a claim of browser acceptance.

# 2.0.0-rc.1 — October 6, 2026

- Added a bundled native CAD kernel, connected face drawing/cutting, native region extrusion and exact STEP interchange.
- Added mandatory fillets (constant/variable) and chamfers (equal/two-distance/angle), preview/cancel, tangent chains and last-treatment editing.
- Added linked components, more precision/sketch/selection tools, materials/textures, perspective/walk, scenes/transitions, sections, attached dimensions and native 3D text.
- Preserved the unrestricted orbit, grid occlusion and nested-region fixes; retained old mesh project migration and recovery paths.
- Added native example projects, closed-mesh export verification and STEP readback; bundled dependency sources/notices.
- Changed deployment: the complete runtime folder is required. `index.html` alone no longer provides the solid tools.
- Kept release-candidate status: actual browser, GPU, touch, offline storage/load and print acceptance remain open.

---

# Changelog

## 1.0.0-rc.5 — 2026-10-04

Reworked extrusion and surface display after the reported broken-looking frame. Border extrusion now constructs caps and walls directly instead of repeatedly subtracting solids. Connected coplanar pieces select and push/pull as a whole face, including older boolean-generated and imported triangulated models. The new cap remains selected for continued editing. Shaded/solid modes hide internal coplanar seams. Standard views use Z up, while full orbit remains available. The software fallback now resolves triangle visibility with a per-pixel depth buffer and clips hidden edges; WebGL uses a tighter scene depth range and reduced polygon offset. Added ten targeted tests and an inspected software-renderer image. Actual browser/GPU acceptance remains outstanding.

## 1.0.0-rc.4 — 2026-10-04

Added selection and extrusion of nested sketch regions. Clicking between coplanar closed outlines selects the border, while clicking the center selects the smaller profile. Selection highlighting excludes inner loops. Numeric and dragged border extrusion create a closed solid with cutouts while keeping the center profiles flat and independently editable. Touching/crossing outlines are rejected with a clear message, and failed operations preserve the sketches. Existing saved projects work without migration. Added nine regression tests; browser acceptance remains outstanding.

## 1.0.0-rc.3 — 2026-10-04

Fixed the grid showing through opaque models. The WebGL workplane grid and world-axis guides now draw as a backdrop without writing model depth, matching the Canvas fallback. Solid faces cover them from above, below and on face-aligned workplanes. Empty space, openings and wireframe retain visible guides; model-to-model depth remains enabled. Added two software draw-batch regression checks; actual GPU/browser acceptance is still outstanding.

## 1.0.0-rc.2 — 2026-10-04

Removed the vertical orbit clamp. Horizontal and vertical drags now continue through complete rotations, including both poles and upside-down views. Angles wrap after full turns without changing the view. Added pointer-handler regression checks for complete turns in both directions, pole continuity, repeated drags, inverted panning, picking and saved-view restoration. Browser acceptance remains outstanding.

## 1.0.0-rc.1 — 2026-10-04

Completed the implementation batches authorized toward v1.0. Added three embedded example projects with JSON/STL/GLB files, independent export checks, geometry caching and current documentation. Preserved a release-candidate designation because actual browser acceptance remains blocked by the test environment.

## v0.5 batch — 2026-10-04

Multiple scoped local projects; previews, copies and recoverable trash; guarded project switching; schema 1 migration to schema 2; per-project previous-save recovery; cross-tab warnings; layers; reusable parts; OBJ/MTL ZIP and GLB interchange.

## v0.4 batch — 2026-10-04

Arc/ellipse/polygon numeric profiles, spline generation, face offsets, profile sweeps, radial arrays, mirror planes, recorded dimensions and named camera views.

## v0.3 batch — 2026-10-04

Bounded BSP union/subtract/intersect with source preservation; topology and crossing diagnostics; vertex welding, triangulation and face-normal reversal. Verified a drilled through-hole and closed STL round trip.

## v0.2 batch — 2026-10-04

Replaced inward solid-face extrusion's overlapping-wall behavior with checked shared-vertex movement. Added numeric drawing, face-aligned sketch planes, plane-facing views, direction constraints, vertex coordinate editing and workplane-consistent movement snapping.

## 0.1.0 — 2026-10-04

Initial independent local-first 3D modeling preview, static deployment, editable source, GPL v3 and 23 initial automated checks.

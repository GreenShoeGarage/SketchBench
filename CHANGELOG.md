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

# SKETCHBENCH release status and roadmap

Current deliverable: **1.0.0-rc.4**, dated October 4, 2026.

The user authorized development in batches through v1.0 without intermediate permission requests. All scheduled implementation batches were completed; the stable release gate remains open because the browser environment blocks local application URLs. An RC identifies this limitation honestly.

| Batch | Implemented | Verification |
| --- | --- | --- |
| v0.1 | Core profiles, primitives, viewport, transforms, project interchange and exports | Original geometry/controller suite |
| v0.2 | Numeric sketching, face-aligned planes, direction constraints, vertex editing, safer inward face edits | Exact oblique-plane rectangle/extrusion, frame inversion and collapse rejection |
| v0.3 | Union, subtract, intersect, bounded solid checks, diagnostics and explicit repair commands | Analytical box volumes, containment, disjoint/touching/identical cases, round through-hole and STL topology |
| v0.4 | Arcs, ellipses, splines, offsets, sweeps, radial arrays, mirror planes, dimensions and views | Curve endpoints, offset rejection, straight/bent sweep topology and schema round trips |
| v0.5 | Local projects, thumbnails, copies, trash, layer locking/visibility, reusable parts, OBJ/MTL and GLB | Project switching/failure/recovery, migration, colored interchange and independent export checks |
| v1.0 RC | Three representative examples, geometry cache, source/docs/package consistency and release checks | Automated tests and independent Python checks; real-browser acceptance outstanding |

## Stable v1.0 gate — still required

1. Real browser create → edit → save → reload → reopen → import/export sessions.
2. Actual WebGL and software-fallback display; screenshots at desktop, tablet and phone sizes.
3. Pointer, pen/touch, keyboard, themes and inspector usability.
4. Actual IndexedDB persistence, browser storage denial and cross-tab behavior.
5. Service-worker installation and offline reload at a nested HTTPS route.
6. File picking/downloading, paired OBJ/MTL import, PNG pixels and print/PDF output.
7. Open exported bracket, enclosure and furniture models in an independent viewer/slicer.

Automated controller tests and an IndexedDB-shaped adapter are not substitutes for these checks. No stable-v1.0 claim is made until this gate passes.

## Deliberately deferred

- Fillets/chamfers: evaluated and deferred because the current mesh kernel cannot guarantee robust general edge treatment. There is no placeholder control.
- Parametric constraints/history, advanced vertex/edge topology tools and native OpenSketch/SketchUp/STEP compatibility.
- Freehand sketching, extruded text and capsule primitives.
- Linked component instances, broader GLB features, perspective camera and touch pinch gestures.
- Complex offset/sweep repair and a more comprehensive intersection/manufacturability analyzer.

AI chat, agents, API keys, prompt-generated geometry, account profiles, cloud collaboration and telemetry remain excluded. The next work should close release blockers before expanding the feature set.

# SKETCHBENCH 2.0.0-rc.6 verification

October 6, 2026. **Release candidate; real-browser acceptance remains open.**

## Automated evidence

**148 tests passed; zero failures.**

`npm test` runs the original regression suite plus native-kernel, v2 controller, shipped-bundle and offline-manifest checks. The recorded output is in `verification/automated-tests.txt`.

The suite covers:

- Runtime compatibility: exact reported “Unsupported solid operation.” error reproduced by sending `splitBetweenFaces` to the rc.4 worker. The new versioned path is ignored by the real rc.4 cache handler while the old path with a version query is intercepted. The current handler serves only its own worker version. Missing/wrong worker versions are rejected before any geometry request; matching retry recovers.
- Shipped worker: matching release handshake and Shell → Split Body with midpoint and numeric offsets create two valid solids and conserve material volume through the real WASM kernel under a nested HTTP path.

- Exact drawing: negative-quadrant rectangle widths/heights with unit fractions; mixed mouse/typed dimensions; analytic circle radius; line length/angle; rotated rectangle edge direction; invalid values; numeric focus; click-drag and two-click retention.
- Workplanes: normal-offset plane geometry, sketch coplanarity, show/hide, native face picking, offset-host separation and preference round trip with invalid-frame rejection. Software samples of actual draw batches confirm the finite plane backdrop does not occlude opaque solids.
- Two-face Split Body: midpoint and offsets in both click orders; real viewport face hits across opposing views; native transformed, cylindrical and filleted solids; valid part volumes and conservation. Invalid, curved, nonparallel and out-of-range references reject without source changes. Controller preview/apply/save/undo, repicking, cancelled/stale results and linked-definition replacement pass. The shipped worker executes a distance split under a nested HTTP path, and the shipped inline app initializes the new workflows together.

- Shell geometry: exact expected volumes for box top/side openings, opposite openings, closed box/sphere cavities, and a translated cylindrical cup; analytic curved walls retained. Single-edge and all-edge filleted boxes exercise the offset/cut fallback. Oversized thickness and invalid face selection reject without source changes.
- Shell controller: clicked-face preselection, preview without model mutation, parameter invalidation, apply/save/undo, closed mode, inline failures, and cancelled/stale worker results. Shipped worker HTTP/VM test also creates a valid shell.
- New viewport regressions: Left and Bottom button events select the correct camera basis while preserving framing and model data; all triangles on six translated native box faces produce consistent world-aligned grids; tilted-face frames remain coplanar and orthonormal.
- Earlier regressions: unrestricted orbit and pole crossings, grid occlusion, nested outline selection, whole connected planar caps, mesh booleans, imports/exports, rollback/undo and project recovery.
- Actual OpenCascade WASM: native primitives; exact volumes; all-edge and variable fillets; internal/external enclosure fillets; all three chamfer modes; circular bore treatments; oversized-radius failure without source mutation; editable treatment history after translation.
- Native topology: face division, inward opening cut, coplanar merge, split plane, offset, planar resize, analytic circular holes, hollow sweeps, native text, and preservation of holes already present in a BREP face.
- Controller using a DOM stub: native save/migration/undo, face-plane sketch and cut, exact rectangle/circle region extrusion, linked instance geometry/color and added/deleted members, late-preview cancellation, perspective inversion/clipping, filled sections with holes, attached dimensions, angular/leader persistence and texture payload validation.
- Actual software rasterizer: per-pixel depth ordering, smooth vertex colors, texture samples, transparency compositing, clear/resize behavior. These produce pixel arrays, not mocked screenshots.
- Shipped `cad/core.bundle.mjs` with shipped loader/WASM: successful primitive creation, fillet and kernel validation.
- Shipped `cad/worker-2.0.0-rc.6.js` evaluated in a Node VM with a browser-like global (no Node process), fetched from a nested HTTP path. Real WASM bytes served as `application/octet-stream` start successfully; profile creation, extrusion, all-edge fillet/chamfer and validity checks pass. No JavaScript dependency requests are made. HTTP 404/403, HTML fallback and truncated WASM produce specific errors. This is an HTTP/VM integration test, not a browser test.
- Startup controller: wrong MIME and HTTP error diagnostics, timeout, pending-operation rejection, unsupported browser, direct-file rejection, and retry/stale-response races.
- Service-worker manifest: worker/bundle/WASM/font paths exist and the handler ignores an unrelated application's URL. This is a source/manifest check, not an actual offline browser test.

The DOM harness does not implement browser layout, WebGL, real pointer capture, native IndexedDB, service-worker installation, file dialogs or printing. Storage tests use localStorage and IndexedDB-shaped adapters. Touch gestures, scene animation timing, accessible focus, imported texture decoding and the actual Web Worker startup require browser acceptance.

## Export readback

`python3 tests/independent_exports.py` reads STL/GLB bytes using Python's standard library, without the application's geometry implementation. All six shipped mesh examples pass nondegenerate triangles, paired directed edges, positive signed volume, and GLB structure/accessor/bounds checks. Output: `verification/independent-exports.txt`.

| New example | Mesh triangles | Native volume (mm³) | STL volume (mm³) |
| --- | ---: | ---: | ---: |
| Rounded block, R4 on all twelve edges | 2,396 | 70,300.223714 | 70,288.532613 |
| Circular bore with 1.5 mm chamfers | 480 | 38,081.648563 | 38,089.308059 |
| Enclosure with internal/external R2 fillets | 508 | 36,097.699112 | 36,097.630258 |

Small native/mesh volume differences are due to tessellation. These files are closed surface meshes; printability, wall thickness and fabrication suitability were not certified.

The three STEP files were imported with CadQuery/Python OCCT, a separate reader/build from the JavaScript runtime. Each returned a valid shape, and each volume matched the native source within 0.001 mm³. This checks STEP round trip with another implementation path, not a completely independent geometry-kernel family. Results: `verification/step-readback.json`.

`verification/native-finishes-software.png` was generated from the actual application's software rasterizer and inspected for coherent rounded/beveled surfaces and open interiors. It is explicitly labeled as software output, not a browser screenshot. The older `extrusion-software.png` documents the v1 cap/wall regression.

## Packaging checks

- All runtime files are local and referenced by relative paths.
- The complete static folder and editable source are included; no `node_modules` or application server is required for runtime.
- App version, HTML branding, package metadata and worker cache version identify `2.0.0-rc.6`.
- Pinned JS dependencies, vendor licenses, CAD source archives and SHA-256 provenance manifest are included.
- `PACKAGE-CHECKSUMS.sha256` records the packaged files. The ZIP is checked for archive integrity and required runtime entries before delivery.

## Browser evidence and remaining release gate

On October 6, the hosted rc.5 app at `https://mbparks.com/sketchbench/` successfully initialized in the cloud Chrome browser. Native box → top-opening Shell → two-face midpoint Split Body succeeded. Undo followed by all-edge fillet → closed Shell → two-face midpoint Split Body also succeeded; the result was two native parts with the original hidden and material volume preserved. Rounded shell shading appeared coherent in that test.

The user's newer screenshot shows “Unsupported solid operation.” while the Split Body panel has two valid parallel face references. The legacy-worker reproduction above establishes a matching failure mode, but does not inspect the user's actual cache contents. The separately reported Shell display change remains unreproduced without that project file.

rc.6's compatibility changes have been checked with Node VM, HTTP, actual WASM and service-worker handler simulations. This build has not been deployed to the user's host or verified through an actual browser upgrade/offline cycle. Full desktop/GPU, touch, browser storage, accessibility and print acceptance remain open. No completed stable-v2.0 acceptance is claimed.

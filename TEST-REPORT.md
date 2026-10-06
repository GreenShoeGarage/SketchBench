# SKETCHBENCH 2.0.0-rc.1 verification

October 6, 2026. **Release candidate; real-browser acceptance remains open.**

## Automated evidence

**111 tests passed; zero failures.**

`npm test` runs the original regression suite plus native-kernel, v2 controller, shipped-bundle and offline-manifest checks. The recorded output is in `verification/automated-tests.txt`.

The suite covers:

- Earlier regressions: unrestricted orbit and pole crossings, grid occlusion, nested outline selection, whole connected planar caps, mesh booleans, imports/exports, rollback/undo and project recovery.
- Actual OpenCascade WASM: native primitives; exact volumes; all-edge and variable fillets; internal/external enclosure fillets; all three chamfer modes; circular bore treatments; oversized-radius failure without source mutation; editable treatment history after translation.
- Native topology: face division, inward opening cut, coplanar merge, split plane, offset, planar resize, analytic circular holes, hollow sweeps, native text, and preservation of holes already present in a BREP face.
- Controller using a DOM stub: native save/migration/undo, face-plane sketch and cut, exact rectangle/circle region extrusion, linked instance geometry/color and added/deleted members, late-preview cancellation, perspective inversion/clipping, filled sections with holes, attached dimensions, angular/leader persistence and texture payload validation.
- Actual software rasterizer: per-pixel depth ordering, smooth vertex colors, texture samples, transparency compositing, clear/resize behavior. These produce pixel arrays, not mocked screenshots.
- Shipped `cad/core.bundle.mjs` with shipped loader/WASM: successful primitive creation, fillet and kernel validation.
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
- App version, HTML branding, package metadata and worker cache version identify `2.0.0-rc.1`.
- Pinned JS dependencies, vendor licenses, CAD source archives and SHA-256 provenance manifest are included.
- `PACKAGE-CHECKSUMS.sha256` records the packaged files. The ZIP is checked for archive integrity and required runtime entries before delivery.

## Unpassed release gate

The available browser environment rejects the local app route. No alternative browser/control path was used to bypass that restriction.

A stable v2.0 release still requires a reachable app installation for:

1. Desktop/browser create → sketch → push/pull → round/bevel → undo → save/reload → STEP/STL export sessions.
2. WebGL and Canvas displays, texture decoding, sections and transparency; desktop/tablet/phone layouts.
3. Mouse/keyboard/pen/touch, pinch, context selection, dialogs, scene playback and accessibility checks.
4. Real IndexedDB persistence, quota/denial, recovery and cross-tab behavior.
5. Nested-route HTTPS install, all offline assets, offline reload and upgrade activation.
6. Native file picking/downloads, PNG capture and print/PDF output, plus independent viewer/slicer visual inspection.

The Green Shoe release convention requires this evidence before a stable version claim. The candidate contains the implementation; these missing checks are not represented as passes.

# SKETCHBENCH 2.0.0-rc.1

Self-hosted, local-first 3D modeling for Green Shoe Garage. No accounts, AI, telemetry, cloud modeling service, API keys, or runtime CDN dependencies.

**This is the v2.0 release candidate.** Automated geometry, controller, export and software-rendering checks pass. Actual browser/GPU, touch, browser storage, offline reload and print acceptance are outstanding; see `TEST-REPORT.md`. This package is an independent implementation, not an OpenSketch fork or a claim of complete SketchUp parity.

## Install

Extract the ZIP. Serve the `sketchbench/` directory with a static HTTP server or upload it to a static HTTPS host. No application backend or runtime package installation is needed.

```sh
cd sketchbench
python3 -m http.server 8080
```

Open `http://localhost:8080/`. A hosted subdirectory such as `/tools/sketchbench/` also works: runtime paths are relative.

**v2 requires more than the HTML file.** Keep these runtime files together:

```text
index.html
sw.js
cad/worker.mjs
cad/core.bundle.mjs
vendor/occt.js
vendor/replicad_single.wasm
vendor/DejaVuSans.ttf
```

Serve `.mjs` and `.js` as JavaScript and `.wasm` as `application/wasm`. HTTPS or localhost enables the service worker. Direct `file://` opening is unsupported for the solid engine. The single-threaded engine does not need cross-origin isolation headers.

The service worker installs a complete version of the runtime, including the solid engine and font, for subsequent offline loads. Initial installation needs the hosted files to be available. It only handles the listed assets in this installation's directory. An updated worker waits for previous app tabs to close before taking over. Close all tabs for this installation and reopen after uploading an update. A failed asset download keeps the previous worker in place.

Source files, tests, examples, licenses and upstream source archives are included. They do not need to be publicly hosted. The compressed package is larger because it contains the upstream CAD source archives as well as the ready-to-run app.

## First model

1. Choose **Rectangle**, draw two corners, or enter `80, 60` in the bottom dimensions field. Choose **Push/pull**, drag the face, or enter `30` and Apply.
2. Draw another rectangle or circle directly on a planar native face. It divides that solid's face. Click the new region and pull inward to recess it or through the body to make an opening.
3. To extrude a frame, draw nested closed profiles on the same plane and select the region between them. The center profile stays flat. Circles retain analytic circular holes in new native profiles.
4. Switch **Faces / objects** to **Edges**. Click an edge; Shift-click adds edges. Open **Fillet** or **Chamfer**, set dimensions, Preview, and Apply.
5. Export a JSON project backup for further editing. Use STEP for one selected native solid or STL for a triangulated printing mesh.

**File → Example models** includes a rounded block, a chamfered bore, and an enclosure with inner and outer corner fillets. Their JSON, STEP, STL and GLB files are also in `examples/`. Earlier mesh examples remain available.

## Solid modeling

- Native box, cylinder, sphere, cone, torus and open enclosure primitives.
- Connected planar face division with closed outlines or crossing lines; coplanar face merge.
- Positive and negative push/pull, openings, repeat distance, and push/pull to a parallel target plane.
- Planar face offset, profile sweeps including holes, solid union/subtraction/intersection/trim, and splitting by the work plane.
- Constant-radius and start/end variable-radius fillets. Equal-distance, two-distance, and distance-plus-angle chamfers. Explicit edge selection, all edges and tangent-chain expansion.
- Preview/apply/cancel with kernel validation. Invalid geometry leaves the original model unchanged. Cancel calculation restarts the worker if a computation is taking too long.
- Edit/remove the last edge treatment. Its original edge selection is retained. This is one editable treatment, not a complete parametric feature tree; another geometry operation replaces that history. Session undo remains available.
- Rigid moves, rotation, reflection and uniform scaling preserve native solids. Native width/depth/height edits extend an available planar end face; arbitrary nonuniform deformation is rejected.
- Closed mesh conversion, bounded to 5,000 faces. Conversion makes a faceted solid; it cannot reconstruct analytic cylinders or the original design intent from arbitrary tessellation.
- STEP import/export retains CAD surfaces. JSON stores native BREP geometry plus a display mesh and project metadata.

A fillet cannot succeed at every requested radius or across every topology. If a treatment intersects itself or removes a thin wall, reduce the radius or change the edge selection. Larger/complex CAD jobs can exceed the worker's time limit; the UI preserves the source.

## Sketching and assembly

- Rectangle, rotated rectangle, circle, closed profiles, lines, freehand and three-point arcs; numeric arcs, ellipses, polygons; polyline spline smoothing.
- XY/XZ/YZ and selected-face work planes; elevation; face view; Shift/U/V direction locks.
- Endpoint, midpoint, center, on-edge, local line-intersection, parallel/perpendicular, guide and circle-tangent inference. Snapping is tolerance based, not a constraint solver.
- Unit-aware bottom-field lengths, guides and transforms, including `2in`, `.5in`, `1 1/2in`, and `3ft 2in`. Separate dimensions with commas. Storage uses millimeters; fields labeled mm continue to use mm.
- Numeric transforms with a custom pivot and copy option; move/rotate/uniform-scale handles; mirror, linear/radial arrays, duplicate and internal copy/paste.
- Object/face/edge selection, object bounding-box window/crossing selection, hide/isolate/show, and mesh vertex selection/stretching. Native vertex deformation uses face tools rather than arbitrary mesh edits.
- Groups with parent hierarchy and an outliner; group editing context; layer visibility and locks.
- Linked component definitions and instances. Open an instance to edit its definition: geometry, color, additions and deletions propagate to other instances in their own placements. Make Unique separates an instance. Close exits the editing context. Independent reusable parts remain available for older workflows.

## Views and documents

- Full horizontal and vertical orbit, including over poles; pan/zoom; orthographic, perspective and two-point perspective; walk controls.
- Two-finger pan/pinch zoom and explicit Orbit/Pan tools. Touch behavior still requires device acceptance.
- Shaded, solid, wireframe and X-ray; smooth curved surfaces and softened tangent seams; simple directional ground shadows. Shadows are a display aid, not a geographic solar study.
- Per-object/per-face materials, opacity and local PNG/JPEG/WebP textures with planar tiling, rotation and offsets. Textures are embedded in project JSON. The transparent renderer uses approximate weighted blending.
- Scenes store camera, object/layer visibility, display style, material-independent theme and section state. Restore, update, delete and play transitions. Pointer navigation or Escape stops playback.
- Axis-aligned section clipping, filled closed section regions, and SVG section outlines in millimeters. Sections affect views and printed images; solid exports keep the whole body.
- Attached object width/depth/height dimensions update with object bounds and report missing objects. Linear measurements, radii, angular dimensions and leaders use fixed points. Dimensions do not constrain geometry.
- Offline 3D text with a bundled font. Move the text then union/subtract it for raised/recessed lettering.
- PNG viewport output and printable model sheets.

## Data and recovery

Autosave is browser-local, scoped to the installation's origin and directory. Export JSON backups: browser storage is not a disk or server backup.

Projects offers multiple local slots, copies, recoverable trash and a previous committed save. Outgoing projects are saved before switching; storage failures or cross-tab conflicts pause switching. IndexedDB is preferred, with a smaller localStorage fallback. Undo/redo is session-only, bounded by 50 steps and approximately 20 MB of snapshots. Native CAD and texture data can make projects larger than old mesh projects.

Schema 1 and 2 projects migrate to schema 3 on load. Original meshes remain meshes until explicitly converted; existing file contents are never silently overwritten. Keep old backups: v1 cannot open schema 3 files.

Project validation rejects malformed geometry/reference data and unsupported image payloads. Imported files are data; the app has no imported-script execution feature. The solid worker operates locally.

## Interchange boundaries

| Format | Scope |
| --- | --- |
| JSON / `.sketchbench` | Complete project, native shapes, definitions, materials/textures, scenes and annotations |
| STEP | One selected native object; exact surfaces, including curved fillets/chamfers |
| STL | Triangulated geometry in millimeters; no colors, textures, linework or native history |
| OBJ + MTL ZIP | Mesh geometry, lines and object colors; no full texture/face-material fidelity |
| GLB | Static geometry, object colors and names; meter/Y-up interchange converted to/from mm/Z-up; textures and animations are not retained |
| PNG / print | Current visible view, materials, sections and annotations |
| SVG section | Closed section outlines in millimeters |

Mesh exports include selected visible objects, or all visible objects when nothing is selected. Overlapping objects are not implicitly unioned. The mesh inspector and paired-edge tests are not a wall-thickness or fabrication guarantee.

Remaining limits include native SKP/OpenSketch/DWG/DXF file compatibility, a full parametric sketch solver/history tree, multi-page LayOut-style documentation, UV unwrap/render engines, plugins/warehouse/cloud collaboration, exact freehand/spline reconstruction, and arbitrary BREP vertex deformation. See `ROADMAP.md` for release status. AI features remain excluded.

## Build and test

The ready-to-run package needs no build. For source changes, use Node 20+ and Python 3:

```sh
npm ci
npm run build
npm test
npm run verify:exports
```

`make-native-examples.mjs` regenerates the native examples and their exports. `tests/render-native.mjs` emits software-renderer pixel data for inspection; it does not run a browser. `build.py` assembles the HTML from readable source modules. `build-cad.mjs` bundles the CAD adapter and copies pinned runtime assets. `package-lock.json` pins JS dependencies. Keep vendor assets and application code from the same release.

SKETCHBENCH code is GPL-3.0-only. It uses Replicad and facilities provided by Open CASCADE Technology. Their licenses and source provenance are in `THIRD-PARTY.md`, `licenses/`, and `third-party-source/`.

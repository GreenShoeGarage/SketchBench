# SKETCHBENCH 2.0.0-rc.5

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
cad/worker.js
vendor/replicad_single.wasm
vendor/DejaVuSans.ttf
```

Serve `.js` as `text/javascript` or `application/javascript`. The runtime no longer loads any `.mjs` files: the solid worker and its JavaScript dependencies are bundled into `cad/worker.js`. Serve `.wasm` as `application/wasm` when possible; `application/octet-stream` also works because the loader instantiates the downloaded bytes. HTTPS or localhost enables the service worker. Direct `file://` opening is unsupported for the solid engine. The single-threaded engine does not need cross-origin isolation headers.

The service worker installs a complete version of the runtime, including the solid engine and font, for subsequent offline loads. Initial installation needs the hosted files to be available. It only handles the listed assets in this installation's directory. Installation revalidates assets rather than reusing the HTTP cache. An updated worker waits for previous app tabs to close before taking over. After uploading an update, reload once to discover it, allow the engine file to download, then close all tabs for this installation and reopen. A failed asset download keeps the previous worker in place. The header must show **v2.0.0-rc.5** after this update. Do not clear site data to update: it contains locally saved projects.

### Updating an existing v2.0.0-rc.1 installation

Replace `index.html` and `sw.js`, and upload the new `cad/worker.js` beside the existing `vendor/replicad_single.wasm` and `vendor/DejaVuSans.ttf`. Keep the directory layout: for `/sketchbench/`, the worker belongs at `/sketchbench/cad/worker.js`. The old `.mjs` files and `vendor/occt.js` can remain; the new runtime does not request them. They are retained in the full source package for development and tests.

### If the solid engine cannot start

HTTPS alone does not guarantee that a worker or its WebAssembly file is available. The Solid tools status now reports the failing asset URL, HTTP status, incorrect JavaScript content type, invalid binary response, or initialization error. It preserves the error after a drawing attempt and offers **Retry solid engine** without changing the model.

- HTTP 404: upload the named file at the reported path.
- HTTP 401/403: inspect the site's access rules for that specific static asset. A browser challenge or HTML login page is not a usable worker or WASM response.
- Worker delivered as HTML or a binary content type: correct the `.js` MIME mapping and any HTML fallback/rewrite affecting `cad/worker.js`.
- Invalid WASM response: verify `vendor/replicad_single.wasm` was uploaded as a binary file, without truncation or replacement by an HTML page.
- Compilation failure: retain the exact error shown and check browser WebAssembly support; the underlying message is no longer replaced by generic HTTP/HTTPS advice.

Correct the affected asset or server configuration, then choose **Retry solid engine**. If the page still shows rc.1, complete the update/reopen steps above first.

Source files, tests, examples, licenses and upstream source archives are included. They do not need to be publicly hosted. The compressed package is larger because it contains the upstream CAD source archives as well as the ready-to-run app.

## First model

1. Choose **Rectangle**, click-drag or click two corners. After the first point, type width/height in the visible dimensions panel and press Enter (Tab moves between fields). Choose **Push/pull**, drag the face, or enter `30` and Apply.
2. Draw another rectangle or circle directly on a planar native face. It divides that solid's face. Click the new region and pull inward to recess it or through the body to make an opening.
3. To extrude a frame, draw nested closed profiles on the same plane and select the region between them. The center profile stays flat. Circles retain analytic circular holes in new native profiles.
4. Switch **Faces / objects** to **Edges**. Click an edge; Shift-click adds edges. Open **Fillet** or **Chamfer**, set dimensions, Preview, and Apply.
5. Export a JSON project backup for further editing. Use STEP for one selected native solid or STL for a triangulated printing mesh.

**File → Example models** includes a rounded block, a chamfered bore, and an enclosure with inner and outer corner fillets. Their JSON, STEP, STL and GLB files are also in `examples/`. Earlier mesh examples remain available.

## Solid modeling

- Native box, cylinder, sphere, cone, torus and open enclosure primitives.
- Shell: hollow one connected native solid with inward wall thickness. Remove one or more faces, or retain every outside face to create a closed cavity. Preview/apply/cancel and undo preserve the source until a valid result is committed.
- Connected planar face division with closed outlines or crossing lines; coplanar face merge.
- Positive and negative push/pull, openings, repeat distance, and push/pull to a parallel target plane.
- Planar face offset, profile sweeps including holes, solid union/subtraction/intersection/trim, and splitting by the work plane or between two selected parallel faces.
- Constant-radius and start/end variable-radius fillets. Equal-distance, two-distance, and distance-plus-angle chamfers. Explicit edge selection, all edges and tangent-chain expansion.
- Preview/apply/cancel with kernel validation. Invalid geometry leaves the original model unchanged. Cancel calculation restarts the worker if a computation is taking too long.
- Edit/remove the last edge treatment. Its original edge selection is retained. This is one editable treatment, not a complete parametric feature tree; another geometry operation replaces that history. Session undo remains available.
- Rigid moves, rotation, reflection and uniform scaling preserve native solids. Native width/depth/height edits extend an available planar end face; arbitrary nonuniform deformation is rejected.
- Closed mesh conversion, bounded to 5,000 faces. Conversion makes a faceted solid; it cannot reconstruct analytic cylinders or the original design intent from arbitrary tessellation.
- STEP import/export retains CAD surfaces. JSON stores native BREP geometry plus a display mesh and project metadata.

A fillet cannot succeed at every requested radius or across every topology. If a treatment intersects itself or removes a thin wall, reduce the radius or change the edge selection. Larger/complex CAD jobs can exceed the worker's time limit; the UI preserves the source.

## Exact drawing and visible workplanes

Choose Rectangle, Circle, Line, Profile, or Rotated rectangle to show the dimensions panel in the viewport. Click the starting point, move the pointer to choose direction, then type exact measurements. Rectangle has width/height, Circle has radius, and Line/Profile has segment length/angle. For Rotated rectangle, first click the starting edge direction. Typing a digit after the starting point focuses the first field; Tab moves to the second, and Enter applies. The preview uses the entered dimensions, including negative drawing directions. Each edited field is locked; clear it or choose **Use mouse sizes** to release it. Mouse click-drag and two-click rectangle/circle drawing both remain available. Line/Profile uses **Add segment**, then **Finish outline**.

Fields accept explicit units and fractions such as `25mm`, `2in`, and `1/2in`. Unlabeled numbers use the selected input units (default mm). The bottom comma-separated input and **Sketch by dimensions** remain available for other numeric profiles, including ellipses and arcs.

The viewport **Workplane…** control creates XY/XZ/YZ or face-based offset planes. **Pick face** lets you click a planar model face directly. A finite blue patch, border and U/V/N axes depict the active plane; **Face view** looks normal to it and **Hide plane** hides only its visual guide. The grid remains on the active plane, and opaque models cover the guides. Offset is measured along N; the XY normal is +Z, XZ is −Y, and YZ is +X. Negative offsets go in the opposite direction.

Explicit plane selection keeps sketches on that plane. Enable **Sketch setup → Auto align to clicked face** to resume automatic face alignment. The active face reference and visibility persist in browser preferences. Offset face planes create separate sketches; drawing directly on a picked native face can divide that face. Workplanes are drawing references, not solid objects.

## Split a body between two faces

1. Choose **Solid tools → Split Body**. No body preselection or separate workplane is needed.
2. Click the first planar face, then a second parallel face on the same body. Right-drag to orbit or use Top/Bottom/Left/Right buttons between clicks. Blue and purple boundaries identify the ordered selections; click either selection button to repick it.
3. Choose **Midpoint between faces**, or **Distance from first face**. Enter a distance with optional units. The direction always points from face 1 toward face 2. The orange plane previews the cut position.
4. **Preview** checks the geometry and colors the resulting bodies without modifying the model. **Split body** commits the separate native solids. **Cancel** leaves the original unchanged, and **Undo** restores it after applying.

The faces must be planar, parallel and on different planes. Offset distance must lie strictly between 0 and their perpendicular spacing, and the cut must actually divide solid material. Curved or nonparallel references are rejected with an explanation; **Solid operations & recovery → Split by work plane** remains available for other plane orientations. Native placements, volume validation and independent resulting bodies are preserved. The ordinary source object is retained hidden. In an open linked component, the original member is replaced by split members in every linked instance; Undo restores the definition.

## Hollow an object with Shell

1. Select the face you want to open, then choose **Solid tools → Shell**. The clicked logical face is preselected, rather than an individual display triangle.
2. Enter **Wall thickness (mm)**. Walls go inward, keeping the outside dimensions.
3. Check additional opening faces if needed. **View** turns the model toward the corresponding face. Choose **Closed hollow** to keep all outside faces; use a section view to see the cavity.
4. Choose **Preview**, then **Apply**. Changing settings clears the old preview. **Cancel** leaves the model unchanged, and **Undo** restores the original after applying.

Shell works on one connected native solid. Convert an imported closed mesh to a solid first; conversion produces faceted geometry. The result is checked for valid, connected walls and actual material removal. Planar openings on filleted solids have a native offset-and-cut fallback. Complex intersections, tiny details, or walls too thick for the available interior can still fail; the error preserves the original and suggests reducing thickness or shelling before small details. This does not certify fabrication suitability or minimum printable wall thickness.

## Sketching and assembly

- Rectangle, rotated rectangle, circle, closed profiles, lines, freehand and three-point arcs; numeric arcs, ellipses, polygons; polyline spline smoothing.
- XY/XZ/YZ and selected-face work planes; elevation; face view; Shift/U/V direction locks. Face grids use a stable world-axis reference rather than triangulation edges. Axis-aligned faces align with world coordinates; tilted faces keep a coplanar grid.
- Endpoint, midpoint, center, on-edge, local line-intersection, parallel/perpendicular, guide and circle-tangent inference. Snapping is tolerance based, not a constraint solver.
- Unit-aware bottom-field lengths, guides and transforms, including `2in`, `.5in`, `1 1/2in`, and `3ft 2in`. Separate dimensions with commas. Storage uses millimeters; fields labeled mm continue to use mm.
- Numeric transforms with a custom pivot and copy option; move/rotate/uniform-scale handles; mirror, linear/radial arrays, duplicate and internal copy/paste.
- Object/face/edge selection, object bounding-box window/crossing selection, hide/isolate/show, and mesh vertex selection/stretching. Native vertex deformation uses face tools rather than arbitrary mesh edits.
- Groups with parent hierarchy and an outliner; group editing context; layer visibility and locks.
- Linked component definitions and instances. Open an instance to edit its definition: geometry, color, additions and deletions propagate to other instances in their own placements. Make Unique separates an instance. Close exits the editing context. Independent reusable parts remain available for older workflows.

## Views and documents

- Full horizontal and vertical orbit, including over poles; pan/zoom; direct 3D, Top, Bottom, Front, Left and Right view buttons; orthographic, perspective and two-point perspective; walk controls.
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

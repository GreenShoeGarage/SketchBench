# SKETCHBENCH 1.0.0-rc.4

A self-hosted, local-first 3D sketching and mesh-modeling instrument for Green Shoe Garage.

**SKETCH → SHAPE → ARRANGE → EXPORT**

This release candidate implements the planned precision, solid-operation, curve, organization, and interchange batches. **Stable v1.0 is pending real-browser acceptance.** The available cloud browser blocks local application URLs; no browser/GPU/touch/offline/print acceptance is claimed. Geometry, controller, storage-adapter and independent export checks are documented in `TEST-REPORT.md`.

Independent implementation inspired by the non-AI modeling workflow at https://opensketch.app/. It is not an OpenSketch fork, is not affiliated with OpenSketch, and does not reproduce every reference feature. No OpenSketch source or assets are included. No AI features are included or planned.

## Run or deploy

**Only `index.html` is required.** Open it directly in a modern browser, or upload it into any static-server directory, for example `/sketchbench/index.html`. No runtime installation, build, npm, account, database server, API key, or backend is required.

For hosted offline reload, put **`sw.js` beside `index.html`** and use HTTPS. Visit once online to install the app cache. The service worker caches only this app's HTML, scoped to its own directory. Browser security disables service workers on ordinary HTTP except localhost. Directly opening the downloaded HTML works without a service worker; browser-local storage behavior for `file://` varies, so export JSON backups.

Local HTTP use:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Uploading the other package files is optional: all runtime code and example models are embedded in the supplied HTML. Subdirectory paths are relative.

## Your first model

1. Choose **Rectangle** and click two corners, or type `80, 40` in the bottom Dimensions field and press Enter.
2. Choose **3D**. The new face is selected; drag with **Push/pull**, or enter a millimeter distance in the inspector and Apply.
3. **Select** a face or object to edit its position, dimensions, material, or name.
4. Shift-select two closed solids and choose **Combine solids**. Use subtraction for holes, union for assemblies that should become one shell, or intersection for shared volume.
5. Choose **Inspect** to check topology, then **Export → Editable project** for a backup. Use STL, OBJ + MTL, or GLB for interchange.

**File → Example models** opens a drilled L-bracket, an electronics enclosure with a cable port and separate lid, or an editable furniture assembly. Each opens as a new local project after saving the current one. These files are also in `examples/` as JSON, STL and GLB.

## Implemented capabilities

### Sketch

- Rectangle, circle, polygon profile and connected line drawing.
- Numeric drawing input: rectangle `width, depth`; circle `radius`; line/profile segment `length, angle`; push/pull `distance`.
- Numeric arc, ellipse and regular polygon creation through **Sketch by dimensions**.
- XY, XZ, YZ and selected-face work planes; elevation; plane-facing view.
- Grid and vertex snapping, U/V direction constraints and Shift direction locking.
- Advanced mesh vertex coordinates.
- Nested coplanar closed profiles: select the border independently from its center; the selection highlight excludes the inner outlines.

### Shape

- Flat-profile extrusion; solid-face push/pull with shared-vertex motion, collapse checks and bounded intersection checks.
- Border extrusion by dragging or numeric distance, leaving the inner profiles flat. Supports multiple inner loops, either extrusion direction and tilted planes.
- Box, cylinder, cone, sphere and torus primitives with numeric dimensions.
- Union, subtraction and intersection of two closed meshes. Optional hidden source preservation and undo.
- Selected-face offsets; splines from open-line control points; profile sweeps along open paths.
- Inspection for open edges, over-shared edges, inconsistent winding, degenerate/nonplanar faces, disconnected shells and supported triangle crossings.
- Explicit vertex welding, face triangulation and normal reversal. Repair commands are undoable; they do not invent missing surfaces.

### Arrange

- Object/face selection, Shift multi-selection, numeric dimensions and position, drag move, rotation, colors and editable names.
- Duplicate, internal copy/paste, grouping, linear and radial arrays, and mirror copies across XY/XZ/YZ planes.
- Searchable object list with visibility and locking; layers with group visibility/locking.
- Reusable parts containing one or more objects. Insertions are independent copies, centered at the current camera target.
- Measurement, saved fixed-endpoint dimensions and saved camera views.
- Unrestricted 360° horizontal and vertical orthographic orbit, including over the poles; pan/zoom, standard views, fit, shaded/solid/wireframe render modes.
- Workplane grid and world-axis guides stay behind opaque model faces in every view; guides remain visible through holes and in wireframe.

### Keep and export

- Multiple local project slots with thumbnails, copies and recoverable trash.
- Autosave status, previous-save recovery, per-project storage records and schema 1 migration.
- JSON project backups include geometry, colors, layers, dimensions, views and reusable parts.
- ASCII/binary STL import and ASCII STL export.
- OBJ import, including paired MTL color import through the file picker; OBJ + MTL ZIP export.
- Static GLB 2.0 geometry/color import and export, including node transforms and independent line primitives.
- PNG export, including saved dimensions, and a printable model sheet with object sizes and a dimension table.
- Easy/Advanced mode, light/dark/high-contrast themes, collapsible inspector, responsive CSS, shortcuts and context-menu alternatives.

## Controls

| Action | Control |
| --- | --- |
| Select | V |
| Rectangle / Circle / Profile / Line | R / C / G / L |
| Push/pull / Move | P / M |
| Orbit / Pan / Measure | O / H / T |
| Fit visible model | F |
| Finish line/profile | Enter or double-click |
| Apply numeric sketch dimensions | Enter in Dimensions field |
| Cancel operation / Select | Escape |
| Undo / Redo | Ctrl/Command Z / Ctrl/Command Shift Z |
| Duplicate / JSON backup | Ctrl/Command D / Ctrl/Command S |
| Select all / internal copy / paste | Ctrl/Command A / C / V |
| Delete unlocked selection | Delete / Backspace |
| Nudge X/Y | Arrow keys; Shift uses grid spacing |
| Orbit | Right/middle-drag, Alt-drag, or Orbit tool |
| Pan | Space-drag, Shift + right/middle-drag, or Pan tool |
| Zoom | Wheel or + / − controls |
| Context actions | Right-click or Shift F10; inspector alternatives available |

On touchscreens use explicit Orbit/Pan tools and zoom controls; pinch is not implemented. The inspector overlays the viewport on narrow screens. Pointer drawing is not fully accessible to nonvisual users; numeric solid/sketch creation and object-list editing provide keyboard paths. Mobile and assistive-technology behavior still need browser acceptance.

## Extrude a rectangular frame

Draw one rectangle inside another on the same work plane. Choose **Push/pull**, then click the area **between the outlines**. Only the border is highlighted; the inspector says **Border region**. Drag it or enter a distance and press Apply. The inner rectangle stays flat and can be selected and extruded separately by clicking its center. Existing saved sketches gain this behavior automatically.

Inner profiles must be visible, planar, closed, fully contained, and separated from the outer boundary and other inner outlines. Nested regions use their immediate inner boundaries. Hidden profiles do not form cutouts; hide an inner profile to extrude the full outer face. Locked inner profiles can define a cutout and remain unchanged. Touching, crossing or overlapping outlines require separation or explicit solid boolean modeling.

Region extrusion supports up to 16 inner outlines and 1,000 total outline vertices, subject to the existing boolean complexity limits. If geometry cannot be validated, the original sketches are preserved. Centers remain separate flat profiles; select the resulting frame when exporting only that solid to STL. Boolean-generated caps contain multiple mesh faces; there is no linked parametric extrusion history.

## Data and recovery

- Everything stays in your browser, scoped by origin and application directory. Separate installation directories use separate stores.
- IndexedDB is the preferred backend; localStorage is a fallback with a much smaller quota. Browser storage is not a backup.
- New/open project operations save the outgoing project first. If saving fails or another tab has changed the active project, switching is blocked and export remains available.
- Each project retains the prior committed save. **File → Restore previous save** restores it with an undo path.
- Trash is recoverable. This build has no permanent-delete control. Open another project before moving the active one to trash.
- Schema 1 JSON files migrate to schema 2. On first run at a new scoped store, the old `sketchbench-v1` active model is copied when available; the old store is preserved.
- Autosave does not overwrite imported disk files or write to your server. Export explicitly to save disk backups.
- Another tab saving the same active project pauses autosave here. This is conflict notification, not a simultaneous-edit merge system.
- Undo is session-only, limited to 50 steps and approximately 20 MB of snapshots. Camera state is saved only through Saved views. Preferences are separate from project data.
- Imports are validated before applying them. Invalid files preserve the active project. No imported scripts or external resources are executed/fetched.
- No telemetry, analytics, remote fonts, CDN code, cloud AI or account authentication.

## Geometry and format boundaries

**Polygon meshes, millimeters, orthographic view.** No parametric constraints, feature history, NURBS, fillets/chamfers, native OpenSketch/SketchUp, STEP, capsule primitive, extruded text, freehand brush, or plugin scripting. These remain future work; this is not full OpenSketch parity.

Curves are sampled polylines. Sweeps center the profile on the path start and transport it along the path; tight bends can self-intersect. Offsets reject simple collapse/crossing cases and may fail on complex concave profiles. Face-aligned sketches create separate objects; use a boolean for a cut. Direct solid-face push/pull rejects nonplanar side faces and is limited to 1,200 triangles. More complex changes should use booleans.

Boolean operations are bounded mesh operations, with a combined 3,000-input-triangle limit and complexity/time guards. Coincident or complex geometry can fail; errors preserve the inputs. Results are checked for closed, consistently oriented edge topology. This is not a tolerance-certified CAD kernel.

Inspect's crossing scan covers noncoplanar triangle crossings up to 1,200 triangles per object; larger scans report a skip. It does not detect every coplanar overlap, nested coincident shell or minimum-wall-thickness problem. Closed topology is not a printability certificate. Check geometry in an independent slicer before fabrication. Exporting multiple overlapping objects does not union them automatically.

Saved dimensions are fixed endpoints and do not constrain or follow edited geometry. Reusable parts insert independent copies, not linked parametric instances. Layer-locked objects remain fixed when transforming a mixed selection; the selection label indicates locked members and fields describe editable members.

STL excludes colors and lines. STL/OBJ coordinates are interpreted as millimeters on import. GLB uses standard meters/Y-up interchange, converted to/from this app's millimeters/Z-up. GLB import supports embedded uncompressed triangle and independent-line geometry plus base colors and node transforms. Required extensions, compressed meshes, sparse accessors, morph targets and skinning are rejected. Textures and animation are not retained. OBJ + MTL export produces two files in one ZIP; select both OBJ and MTL through Open to import their colors. External textures are not loaded.

Model mesh exports use selected visible objects if selected, otherwise all visible objects. JSON includes hidden objects and all project metadata. PNG/print use the whole visible viewport. The Canvas 2D fallback uses triangle depth sorting with limited accuracy for intersecting geometry; WebGL is preferred.

Limits: 25 MB imported file, 2 MB MTL, 1,000 active objects / 150,000 active vertices, 250,000 vertices including reusable parts, 100 layers, 50 reusable parts, 100 saved dimensions, 50 views, 50 copies per array action. Imported meshes: 100,000 vertices / 60,000 faces; at most 1,000 vertices per profile/face. Curves: up to 256 samples; spline control points: up to 100; sweep: up to 200 profile and 200 path points. Large operations run synchronously and may pause the interface briefly.

## Source and maintenance

The deployable HTML is self-contained. Corresponding editable source is included:

| File | Responsibility |
| --- | --- |
| `shell.html`, `style.css` | Interface markup and responsive styles |
| `kernel.js` | Base vector and mesh geometry |
| `geometry-plus.js` | Planes, checked face edits, curves, offsets, sweeps and diagnostics |
| `solids.js` | Bounded BSP boolean operations |
| `interchange.js` | GLB, OBJ/MTL and ZIP codecs |
| `app.js` | Viewport, interactions and baseline controller |
| `precision.js` | Numeric sketching and face-plane controls |
| `sketch-regions.js` | Nested-profile selection, border highlighting and extrusion |
| `studio.js` | Solid/detail commands, annotations and views |
| `projects.js` | Schema migration, storage, projects, layers and reusable parts |
| `export-ui.js`, `finish.js` | Interchange UI, printing, contextual help and geometry cache |
| `examples.js`, `make-examples.cjs` | Embedded examples and reproducible example generation |
| `bootstrap.js`, `sw.js` | Initialization and optional offline caching |

Later controller files extend the baseline functions before bootstrap initializes the app. Runtime requests do not load these source files separately.

Maintainer commands:

```sh
node make-examples.cjs
python3 build.py
node --test tests/*.test.cjs
python3 tests/independent_exports.py
```

No npm dependencies are needed. These packaging/testing commands are for maintainers only; hosting the supplied HTML needs no build. Keep the visible version, service-worker version and packaged HTML synchronized.

The GLB implementation was checked against the Khronos glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html . No third-party implementation code is bundled.

## License

Copyright © 2026 Green Shoe Garage. GNU General Public License version 3 only (`GPL-3.0-only`). Full text is in `LICENSE`; corresponding source is included.

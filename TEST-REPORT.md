# SKETCHBENCH 1.0.0-rc.3 verification

Date: October 4, 2026.

**Release candidate. Implementation batches are complete; stable-v1.0 browser acceptance is outstanding.**

## Automated checks

`node --test tests/*.test.cjs` — **59 tests pass**, 0 failed.

- Geometry: primitives, exact volume/area, positive/negative profile extrusion, checked inward solid-face edits, collapse rejection, concave profiles, oblique planes, offsets, arc/spline endpoints, straight and bent sweeps, topology diagnostics.
- Solids: union/subtract/intersect analytical volumes; identical, touching, disjoint and contained cases; through-hole construction and closed STL round trip.
- Interchange: ASCII/binary STL; OBJ with lines/negative indices; OBJ/MTL colors and object separation; GLB units, coordinates, colors, names and linework; malformed-file rejection; ZIP structure.
- Controller (DOM stub): creating/editing/undo/redo, rollback, locking/grouping, duplicate, project migration, numeric drawing on a tilted plane, export/help/detail command wiring, projection and picking math.
- Orbit regression (DOM stub): full horizontal/vertical/diagonal turns in both directions; continuous pole crossings; ten turns across successive drags; picking throughout rotation; inverted screen-space panning and saved-view restore. All four new regression tests failed against rc.1 and pass with the fix.
- Grid occlusion: a software sampler consumes the actual WebGL draw batches and checks opaque-face coverage from above/below/side/tilted workplanes, guides in empty space/holes/wireframe, and nearer-model occlusion. The coverage regression fails on rc.2 and passes with the fix. These two checks do not execute a GPU or browser.
- Storage (localStorage stub and IndexedDB-shaped transaction adapter): active-project save/reload/recovery; outgoing project preservation; slot switching; recoverable trash; storage failure; transaction failure; same-project cross-tab conflict; layers, annotations, views and reusable-part round trips.
- Shipped examples: all three validate and survive project serialization.

`python3 tests/independent_exports.py` independently reads the generated STL and GLB bytes without using the app's geometry implementation:

| Model | STL triangles | STL result | GLB result |
| --- | ---: | --- | --- |
| Drilled L-bracket | 2,080 | Nondegenerate triangles; paired directed edges; positive volume | Header, lengths, alignment, accessors and bounds pass |
| Electronics enclosure + separate lid | 644 | Same checks pass | Same checks pass |
| Workbench assembly | 208 | Same checks pass | Same checks pass |

Independent Python `zipfile` CRC inspection verifies the OBJ/MTL archive. Syntax checks cover all JavaScript sources. The self-contained HTML is regenerated from the included source. A local HTTP check compares served `index.html` and `sw.js` bytes at a nested route against the packaged files. ZIP integrity and standalone-HTML identity are checked before delivery.

## What these checks do not establish

DOM stubs do not render CSS or execute real browser UI. The IndexedDB adapter verifies controller transaction use, not a browser's implementation. Structural export checks do not replace independent slicer/viewer inspection. The software draw-batch sampler checks selected fragments and depth state, not full GPU rasterization or antialiasing. Shader compilation, GPU behavior, touch input, downloaded image pixels and print layout are not established by these tests.

Earlier browser attempts returned `ERR_BLOCKED_BY_CLIENT` for local app URLs, and browser URL policy also rejected a local-content preview. Those restrictions were respected; no alternative browser surface or bypass was used. As a result, the following remain unverified:

- Actual desktop/mobile rendering and screenshot review.
- WebGL and Canvas fallback visuals, pointer/touch gestures, keyboard focus and assistive technology.
- Real IndexedDB persistence and browser storage restrictions.
- Actual service-worker install and hosted offline reload.
- Browser file picker/download/drag-drop, PNG output and print/PDF dialogs.
- Safari, Firefox, iOS, Android or a production host.

## First acceptance session at an accessible HTTPS route

1. Open a clean project. Create a rectangle with exact dimensions, extrude, resize, recolor, save and reload.
2. Open each included example. Use view tools, selection, locks, layers, groups and undo/redo. Orbit through full horizontal and vertical turns in both directions, crossing both poles. Check pan, zoom and saved views while upside down. Verify that grids never cross opaque faces in shaded/solid mode, including from below and on face workplanes; check openings and wireframe too.
3. Drill a bracket by subtracting cylinders; inspect and compare the STL in an independent slicer.
4. Exercise an offset, spline, sweep and radial array; save a dimension and camera view.
5. Create, copy, switch and trash/restore projects; export JSON; reimport and compare metadata.
6. Import/export STL, paired OBJ/MTL and GLB; confirm dimensions, orientation and colors.
7. Refresh offline after caching. Repeat at a nested route and with direct local HTML.
8. Inspect all themes at 390, 768 and 1440 pixel widths. Verify touch tools, focus and dialogs.
9. Export PNG and print a PDF. Inspect the actual files.
10. Simulate quota/denied storage and concurrent-tab changes; confirm clear warnings and preserved work.

Do not mark stable v1.0 until critical failures from these checks are resolved.

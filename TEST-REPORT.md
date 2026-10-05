# SKETCHBENCH 1.0.0-rc.5 verification

Date: October 4, 2026.

**Release candidate. Implementation batches are complete; stable-v1.0 browser acceptance is outstanding.**

## Automated checks

`node --test tests/*.test.cjs` — **78 tests pass**, 0 failed.

- Geometry: primitives, exact volume/area, positive/negative profile extrusion, checked inward solid-face edits, collapse rejection, concave profiles, oblique planes, offsets, arc/spline endpoints, straight and bent sweeps, topology diagnostics.
- Solids: union/subtract/intersect analytical volumes; identical, touching, disjoint and contained cases; through-hole construction and closed STL round trip.
- Interchange: ASCII/binary STL; OBJ with lines/negative indices; OBJ/MTL colors and object separation; GLB units, coordinates, colors, names and linework; malformed-file rejection; ZIP structure.
- Controller (DOM stub): creating/editing/undo/redo, rollback, locking/grouping, duplicate, project migration, numeric drawing on a tilted plane, export/help/detail command wiring, projection and picking math.
- Orbit regression (DOM stub): full horizontal/vertical/diagonal turns in both directions; continuous pole crossings; ten turns across successive drags; picking throughout rotation; inverted screen-space panning and saved-view restore. All four new regression tests failed against rc.1 and pass with the fix.
- Grid occlusion: a software sampler consumes the actual WebGL draw batches and checks opaque-face coverage from above/below/side/tilted workplanes, guides in empty space/holes/wireframe, and nearer-model occlusion. The coverage regression fails on rc.2 and passes with the fix. These two checks do not execute a GPU or browser.
- Nested sketch regions (DOM stub): border/center picking in either creation order, highlight loops and inspector hint, numeric/drag extrusion, cancel and undo/redo, JSON/STL round trips, negative extrusion on an oblique plane, multiple/deeply nested loops, circular cutouts, hidden/noncoplanar/locked profiles, cache invalidation and nonmutating rejection of touching/crossing outlines.
- Connected surfaces and display: stable direct-frame topology across positive/negative heights, all four wall directions, repeated cap pulls, collapse rejection, older boolean/STL cap editing, concave outlines with multiple holes, clean feature-edge length, upright standard views, pointer cancellation and hidden-edge clipping.
- Software rasterizer: crossing triangles resolve depth independently at each pixel and in either draw order; scaling, empty-scene clearing and resize buffer handling.
- Storage (localStorage stub and IndexedDB-shaped transaction adapter): active-project save/reload/recovery; outgoing project preservation; slot switching; recoverable trash; storage failure; transaction failure; same-project cross-tab conflict; layers, annotations, views and reusable-part round trips.
- Shipped examples: all three validate and survive project serialization.

`python3 tests/independent_exports.py` independently reads the generated STL and GLB bytes without using the app's geometry implementation:

| Model | STL triangles | STL result | GLB result |
| --- | ---: | --- | --- |
| Drilled L-bracket | 2,080 | Nondegenerate triangles; paired directed edges; positive volume | Header, lengths, alignment, accessors and bounds pass |
| Electronics enclosure + separate lid | 644 | Same checks pass | Same checks pass |
| Workbench assembly | 208 | Same checks pass | Same checks pass |

Independent Python `zipfile` CRC inspection verifies the OBJ/MTL archive. Syntax checks cover all JavaScript sources. The self-contained HTML is regenerated from the included source. A local HTTP check compares served `index.html` and `sw.js` bytes at a nested route against the packaged files. ZIP integrity and standalone-HTML identity are checked before delivery.

## Inspected software-renderer output

`verification/extrusion-software.png` was captured from the actual JavaScript software rasterizer and visible-edge calculations for a 50 × 60 mm rectangular frame, 20 mm tall, with its flat center retained. The image was inspected: the frame shows complete walls and clean caps without internal triangle bleed-through. This caught the old average-depth ordering failure and verified its replacement with per-pixel depth. It does not verify browser canvas composition, interface layout or GPU rendering.

## What these checks do not establish

DOM stubs do not render CSS or execute real browser UI. The software rasterizer itself does compute its actual pixel buffer during controller tests. The IndexedDB adapter verifies controller transaction use, not a browser's implementation. Structural export checks do not replace independent slicer/viewer inspection. The WebGL draw-batch sampler checks selected fragments and depth state, not full GPU rasterization or antialiasing. Shader compilation, GPU behavior, touch input, downloaded image pixels and print layout are not established by these tests.

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
3. Draw nested rectangles on the same plane. Click the border and center separately; verify the highlight. Extrude only the border by dragging and by entering a distance. Pull its cap again from several different locations; verify that the entire cap moves and all walls remain closed. Undo and cancel a drag. Repeat in both WebGL and software fallback, checking opaque surfaces and clean edges throughout orbit. Repeat with a circle and a tilted plane. Drill a bracket by subtracting cylinders; inspect and compare the STL in an independent slicer.
4. Exercise an offset, spline, sweep and radial array; save a dimension and camera view.
5. Create, copy, switch and trash/restore projects; export JSON; reimport and compare metadata.
6. Import/export STL, paired OBJ/MTL and GLB; confirm dimensions, orientation and colors.
7. Refresh offline after caching. Repeat at a nested route and with direct local HTML.
8. Inspect all themes at 390, 768 and 1440 pixel widths. Verify touch tools, focus and dialogs.
9. Export PNG and print a PDF. Inspect the actual files.
10. Simulate quota/denied storage and concurrent-tab changes; confirm clear warnings and preserved work.

Do not mark stable v1.0 until critical failures from these checks are resolved.

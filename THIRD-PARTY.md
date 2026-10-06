# Third-party software and reproducible sources

SKETCHBENCH application code is GPL-3.0-only (`LICENSE`). Third-party components retain their own notices and licenses.

**This software makes use of facilities provided by the Open CASCADE Technology software.** The CAD kernel is shipped locally as replaceable JavaScript/WebAssembly files. No third-party CDN is used at runtime.

| Component | Pinned version / role | License / notice |
| --- | --- | --- |
| Replicad | 1.1.0, JS CAD wrapper bundled in `cad/core.bundle.mjs` | MIT, `licenses/replicad.txt` |
| replicad-opencascadejs | 1.1.0, unmodified single-threaded loader/WASM | LGPL-2.1-only, `licenses/replicad-opencascadejs.txt` |
| Open CASCADE Technology | The pinned kernel builder's dependency is V8_0_1, commit `b8f597c677811d1f9f4d8a97f5ae2825c0353a42` | LGPL 2.1 plus Open CASCADE exception; notices in `licenses/` |
| OpenCascade.js build tooling | `ebd263f15337b440b391492af073662707e86482` | LGPL 2.1 plus exception; source archive included |
| OpenType.js | 1.3.4, bundled text outline support | MIT |
| Flatbush / Flatqueue | 4.6.2 / 3.1.0, bundled geometry utilities | ISC |
| tiny-inflate / string.prototype.codepointat | 1.0.3 / 0.2.1, OpenType transitive dependencies | MIT |
| DejaVu Sans | Unmodified bundled `DejaVuSans.ttf` | Bitstream Vera/DejaVu notices in `licenses/DejaVu.txt` |
| RapidJSON / FreeType | Kernel build dependencies pinned by upstream `DEPS.json` | Upstream notices and source archives included |
| esbuild | 0.28.2, build-time only | MIT; not a runtime service |

`package-lock.json` records npm package versions, resolved packages and integrity hashes. `build-cad.mjs` copies the loader/WASM without modifying them and bundles our adapter plus Replicad. No restrictions are imposed on replacing, modifying or reverse engineering the library for debugging those modifications.

## Included CAD source archives

`third-party-source/manifest.json` records source URLs, exact commits, byte sizes and SHA-256 hashes. Archives are unmodified upstream snapshots:

- Replicad monorepo at `e4b05f67dc4e2393a876ce8c5064a9c93db05bf1`, the npm package's published `gitHead`. Includes the `packages/replicad-opencascadejs` binding configuration and build scripts.
- OpenCascade.js at `ebd263f15337b440b391492af073662707e86482`, corresponding to the single-threaded build-image tag referenced by that package.
- OCCT, RapidJSON and FreeType at the commits pinned in that builder's `DEPS.json` (also copied into `licenses/DEPS-opencascadejs.json`).

The upstream archives include source, license notices, patches and build instructions. To rebuild the library, unpack the Replicad and OpenCascade.js archives, follow their documented Docker/toolchain prerequisites, generate the Replicad binding configuration with `ytt`, and run the single-threaded build script. The source builder pins its Emscripten base image and toolchain dependencies. Building the kernel from C++ is substantially larger/slower than building this app and was not repeated here; the tested runtime is the published npm 1.1.0 binary. We do not claim a bit-for-bit C++ rebuild.

Replace `vendor/occt.js` and `vendor/replicad_single.wasm` together with a compatible build, or update `build-cad.mjs` and regenerate. Retain the exports required by `cad/core.mjs`/Replicad, update the service-worker version for deployment, and run the tests. The app's source and ordinary JS build path remain separate from the kernel toolchain.

Upstream locations: https://github.com/sgenoud/replicad · https://github.com/taucad/opencascade.js · https://github.com/Open-Cascade-SAS/OCCT · https://github.com/Tencent/rapidjson · https://github.com/freetype/freetype

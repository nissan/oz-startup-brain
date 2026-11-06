# Offline font contract

`npm ci --prefix design/tools` installs the exact packages and integrity hashes in `package-lock.json`. Rendering itself blocks HTTP(S); all selected WOFF2 resources are inlined into the page. Both export and accessibility tools use the same page construction and painted-font verification. There is no fallback-signoff mode.

| Family | Package / version | Selected faces |
| --- | --- | --- |
| Fraunces | `@fontsource-variable/fraunces` 5.3.0 | `full.css`, normal, weight 600 in the design; retains weight/optical-size/softness/wonk axes with the browser's existing optical-sizing behaviour |
| Atkinson Hyperlegible | `@fontsource/atkinson-hyperlegible` 5.3.0 | 400 normal, 700 normal, 400 italic |
| JetBrains Mono | `@fontsource/jetbrains-mono` 5.3.0 | 400 normal |

The CSS family alias `Fraunces Variable` is mapped to the existing `Fraunces` token; font binaries are unchanged. Package CSS retains its unicode ranges and all subsets for the selected faces (Latin/Latin-ext and the additional subsets present in each package). Unsupported text cannot silently fall back: verification fails. This is coverage of the current authored fixtures, not a multilingual product coverage claim. Future languages/styles need an explicit font/fixture update.

No synthetic bold or italic is allowed. FontSource's full variable Fraunces preserves the optical-size capability of the original Google Fonts request; the loader does not impose a new axis value or change the design tokens. Existing brand lockups are outlined SVG paths from the older 5.1.0 packages and are intentionally unchanged; the report does not claim to re-verify those paths as live text.

## What verification proves

After React has rendered and `document.fonts.ready` resolves, the verifier loads every required family/weight/style and checks the returned FontFace descriptors. This catches a missing bold face that the browser would otherwise replace with the regular face. Each visible direct-text run is checked, along with controls' values/placeholders. Chromium's `CSS.getPlatformFontsForNode` must report custom font glyphs from the intended family; a system fallback or unsupported character fails. The known Chromium ` (Fontations)` family-name suffix is normalized only for comparison.

Leaf text is inspected in its actual element; matching probes also check direct text in mixed-content elements and input/textarea shadow text. Probes are removed before geometry checks and screenshots. Required-face specimen probes cover faces unused on a particular page. SVG paths are not font glyphs, and native list markers are outside the direct-text check. This is a static preview check, not a guarantee about every state of a future application.

`design/exports/font-verification.json` records browser version, exact dependency pins, per-page text-run counts and painted face names. It is regenerated with the final PNGs. CI writes only temporary output and never commits exports. A failed verification exits nonzero and must not be called typography sign-off.

## Licences and upstream documentation

All three font packages are SIL Open Font License 1.1. Complete notices are preserved in [licenses/](licenses/): Fraunces Project Authors; Braille Institute of America, Inc.; JetBrains Mono Project Authors. Font binaries remain in installed dependencies rather than Git; standalone generated HTML contains these fonts and should travel with these notices if redistributed. PNG exports do not embed font binaries.

- [Fontsource installation and self-hosting](https://fontsource.org/docs/getting-started/install)
- [Fontsource subset CSS and unicode ranges](https://fontsource.org/docs/getting-started/subsets)
- [Chromium CSS protocol: getPlatformFontsForNode](https://chromedevtools.github.io/devtools-protocol/tot/CSS/#method-getPlatformFontsForNode)

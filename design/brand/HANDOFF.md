# Brand kit handoff

Versioned export of the brand assets kept in the "Oz Startup Brain" Design System artifact (asset groups **Logos** and **Icons and social**) and shown on the **Brand sheet** artboard of the mock-ups canvas.

| Item | Value |
| --- | --- |
| Design system artifact version | `1793911862-01d8` (version 11) |
| Mock-ups canvas version (Brand sheet) | `1793911885-c30c` (version 17) |
| Export date | 6 November 2026 |
| Owner approval | **Pending** — reviewed together with the design system and mock-ups under #8 |

## What is here

| File | Use |
| --- | --- |
| `mark.svg`, `mark-dark.svg` | The mark for light and dark grounds. Ironbark tile, paper route, sage destination; built from the system's own tokens and radii |
| `wordmark-horizontal.svg`, `-dark.svg` | Mark beside "Oz Startup Brain" in Fraunces 600, text outlined to paths (no font dependency) |
| `wordmark-stacked.svg`, `-dark.svg` | Mark above a two-line wordmark for square or narrow placements |
| `wordmark-tagline.svg`, `-dark.svg` | Horizontal lockup with the tagline in Atkinson Hyperlegible 400 |
| `favicon.svg`, `favicon.ico`, `png/favicon-16.png`, `png/favicon-32.png` | Browser icons |
| `png/apple-touch-icon-180.png`, `png/mark-512.png` | iOS and PWA icons |
| `avatar.svg`, `png/avatar-512.png` | Square social avatar |
| `og-image.svg`, `png/og-image-1200x630.png` | Open Graph / Twitter card, including the standing "information and routing, not advice or approval" line |
| `png/wordmark-*.png` | Raster lockups for places that cannot use SVG |
| `../exports/mockups/Brand-Sheet-light.png`, `-dark.png` | The brand sheet artboard rendered |

Every lockup has a light file (dark lettering, for `paper`/`paper-raised`) and a dark file (light lettering, for dark `paper`/`paper-raised`); choose by the ground the lockup sits on. Usage rules (clear space, minimum sizes, permitted grounds, forbidden treatments) are in `../system/assets/Logos/README.md` and in the brand book's "Logo and wordmark" section.

## Provenance and limits

- Original work drawn in this session from the design system's tokens; no third-party mark, photograph, illustration or generated image is used, and the design system states that none is part of the brand.
- Fonts were outlined from the `@fontsource/fraunces` 5.1.0 and `@fontsource/atkinson-hyperlegible` 5.1.0 packages (SIL Open Font License), so the SVG lockups render identically everywhere; live UI still sets the name with the Google-hosted faces.
- Reproduce the rasters with `rsvg-convert` from the SVGs (sizes as named). The brand sheet PNGs come from `../tools/render.py`, which resolves the canvas's uploaded assets through `../mockups/assets.json`.
- Nothing here is trademark-cleared; the name "Oz Startup Brain" has not been searched against existing marks. That is an owner task before any public deployment.

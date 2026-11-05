Favicon, app icon, avatar and social preview, all derived from `Logos/mark.svg`.

- `favicon.svg` — the mark without accessibility text, for `<link rel="icon" type="image/svg+xml">`; `favicon-32.png` for browsers that need a raster (`favicon.ico` in the repository carries 16 and 32).
- `apple-touch-icon-180.png` and `mark-512.png` — iOS home screen and PWA/manifest icons; the tile's own corners are its mask, so no extra padding is needed.
- `avatar.svg` — the mark on `paper` with margin, for square social avatars.
- `og-image.svg` / `og-image-1200x630.png` — Open Graph and Twitter card: mark, wordmark, tagline and the standing "information and routing, not advice or approval" line, with the cover's block composition on the right. Set `og:image` to the PNG.

All colours are the light-theme token values baked in; social surfaces do not honour theme switching.

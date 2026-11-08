# Maintaining the delivery roadmap

`README.md` is the readable GitHub snapshot; `index.html` is the matching self-contained visual page. Update both together from live GitHub issue Delivery blocks and exact PR heads. Preserve date, timezone, main/candidate/evidence SHAs, review limitations and release boundaries. Do not infer acceptance from test counts or PR merge.

The HTML embeds the existing Fraunces, Atkinson Hyperlegible and JetBrains Mono font files; licences are retained in `FONT-LICENSES.txt`. It uses repository design tokens, no third-party scripts, analytics or runtime API calls. All content remains available without JavaScript. JavaScript adds category filtering, theme switching and a stale-snapshot notice after 24 hours.

Hosted view: https://oz-startup-brain-roadmap-20261108.reddi.chatgpt.site (owner-private). GitHub README is the shared agent-readable copy; do not rely on agents being able to sign in to the hosted view. The old here.now URL was not edited.

Publishing source is maintained in the Site source repository, project `appgprj_6af034ce7bc08191afd0c6a936d51a06`. For an update, open that Site, replace `dist/index.html` and `dist/FONT-LICENSES.txt` with these exact files, validate, synchronise source and publish through the existing Site workflow. Do not create another Site. The source manifest belongs to that publishing repository, not the product app.

Trigger an update after relevant merges, verification sign-off, owner decisions or release-gate changes. This is a manual snapshot, not an automatic monitor. Keep the live #23 link visible and supersede old snapshot links explicitly.

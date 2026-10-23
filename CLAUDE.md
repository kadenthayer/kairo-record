# Kairo Supply — kairo.supply

Static site for Kairo Supply: a sealed, evidence-first registry and (future) market for fossils and mineral specimens. Owner: Don. First record is KR-0001, a spinosaurid tooth (Kem Kem Group, Morocco). Read README.md for the full file layout.

## How the site is built

- **Edit `src/kairo.src.html` only.** It holds all markup, CSS and JS in one file. Never hand-edit `index.html` or `kairo.html`; they are generated.
- Build: `node scripts/build.mjs` (Node 18+, no dependencies). It verifies the custody ledger and every sealed media file, injects the data into the page, and writes:
  - `index.html`: the full document served by GitHub Pages at kairo.supply.
  - `kairo.html`: the same page as a fragment, published separately as a claude.ai artifact.
- Deploy: commit and push to `main`. GitHub Pages serves the repo root. `CNAME` holds `kairo.supply`; don't delete it.
- Preview locally: `npx serve .` (or `python3 -m http.server`) from the repo root. Opening the file directly breaks the in-browser verification, which uses `fetch`.

## Rules that must not be broken

- `data/ledger.json` is **append-only**. Never edit, reorder or regenerate existing entries. Never delete the file: the build would create a new genesis ledger and change the record seal.
- Never modify, recompress or replace files in `media/kr-0001/` that are listed in the ledger. Their SHA-256 hashes are sealed, and the build fails if they change. New or edited images go in under new filenames, recorded in a new ledger entry.
- Don't edit `data/kr-0001.json` content casually. Its hash was sealed in ledger entry 3. Presentation-only data, such as the finding-to-plate links, lives in the page script.
- Wording: a Kairo Supply record documents identity and condition. It is **not a valuation or an appraisal**; never use those words for it. Lead with fossils and mineral specimens. State confidence plainly and say when something can't be determined. Plain, active, sentence-case copy.

## Design system (keep it)

A single dark, deep-space look, by design (no light theme). Tokens are in the `:root` block at the top of the `<style>`:
- Colors: `--void` #060912 ground, glass panels (`--glass`, `--line`), ink `--ink`/`--ink-2`/`--ink-3`, starlight accent `--star` #D6E3FF. Geologic period colors are the official ICS chart colors, defined in the JS arrays `EONS`, `PERIODS` and `STAGES`; they are data, not decoration.
- Type: Unbounded (display, weights 200–400) and Geist (body, 300–600), from Google Fonts.
- Signature pieces:
  - the starfield canvas;
  - the three-ring geologic clock (drag, arrow keys, the period-colored slider and the jump chips);
  - the "Earth's day" times;
  - the plate viewer: desktop loupe, phone swipe, hold-to-magnify and tap for full screen, plus a full-screen dialog with tap-to-zoom;
  - the ⌘K search palette;
  - the ledger chain that lights up when the record is verified.
- Phones (≤700px) use a fixed bottom tab bar, and the top nav and search pill are hidden.
- Respect `prefers-reduced-motion`, visible focus states, and the 16px minimum side gutter written as `max(16px, env(safe-area-inset-left/right))`.

## Current task: mobile is "slightly cut off" on Don's phone

Chromium emulation at 320–430px shows no horizontal overflow, so the problem is likely Safari-specific or font-related. **Ask Don for a screenshot and his phone model first** if he hasn't sent one. Suspects, most likely first:

1. **iOS zooms on input focus.** The registry search (`#reg-q`) and the palette input (`#pal-q`) use about 15px text. iOS Safari zooms in when an input under 16px is focused and stays zoomed, which looks like the page is cut off. Fix: set `font-size: 16px` on all inputs, at least at ≤700px.
2. **The hero headline is too wide in Unbounded.** At 375px, "permanent record" runs to about 1px from the right gutter, and Safari's rendering can push it over. Fix: reduce the phone font size (e.g. `clamp(1.75rem, 8vw, 3.7rem)` at ≤700px). Check `.catno` and the `h2`s for the same problem.
3. **Safe areas in `index.html`.** The build writes `viewport-fit=cover` into `index.html`, but unlike the claude.ai artifact wrapper it doesn't pad `:root` with `env(safe-area-inset-*)`. On notched iPhones, especially in landscape, content can sit under the notch or the home indicator. Either add the safe-area padding in the `index.html` wrapper inside `scripts/build.mjs`, or drop `viewport-fit=cover` there.
4. **Clock readout crowding at 320–375px.** The period name and the object name wrap inside the 40%-wide center. Consider tightening the font sizes or hiding the Earth's-day line at the smallest widths.
5. **`background-attachment: fixed` on `body`.** iOS ignores it and can repaint oddly. Consider moving the nebula gradients onto a fixed pseudo-element instead.

How to verify:
- Test both views: home, and the record view at `/#kr-0001`.
- Test 320, 360, 375, 390 and 430px widths, with the real fonts loaded.
- Use Safari's Responsive Design Mode if possible. Best of all, open the local server from Don's phone on the same Wi-Fi, at `http://<mac-ip>:3000`.
- Check that `document.documentElement.scrollWidth` equals the viewport width.
- Check that the bottom tab bar doesn't cover content and the full-screen viewer fits.
- After building, confirm the "Verify this record" button still reports a valid ledger and 18 of 18 files matching.
- Then commit with a clear message and push to `main`.

## Open items (not for this task unless Don asks)

- HTTPS on kairo.supply: DNS is correct at GoDaddy (four GitHub A records, `www` CNAME to kadenthayer.github.io, no AAAA or CAA). The certificate was stuck. Don is resetting the custom domain in Settings → Pages. Fallback: put Cloudflare in front.
- Next record step for KR-0001: UV screening, measurements and overall views. Add them as a new ledger entry; a small `scripts/append-ledger.mjs` helper would be worth writing.
- Anchoring the record seal to a public blockchain.

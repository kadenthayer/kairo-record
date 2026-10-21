# Kairo Supply

The site for [kairo.supply](https://kairo.supply): a sealed, evidence-first registry for fossils and mineral specimens, and the first piece of the Kairo Supply vault and market.

The first record is **KR-0001**, a spinosaurid tooth from the Kem Kem Group, Morocco (Cenomanian, about 100–94 million years). It has 17 Dino-Lite plates, one video, findings, confidence ratings, and a hash-chained custody ledger that anyone can verify in the browser.

## Layout

| Path | What it is |
|---|---|
| `src/kairo.src.html` | The page source: markup, styles and script in one file. Edit this. |
| `data/kr-0001.json` | The KR-0001 record: identification, findings, confidence, plates, steps. |
| `data/collection.json` | Every object in the collection, documented or awaiting documentation. |
| `data/ledger.json` | The custody ledger. **Append-only. Never edit an existing entry.** |
| `media/kr-0001/` | Web copies of the plates (1600 px), thumbnails, video and poster. |
| `scripts/build.mjs` | Verifies the ledger and writes `index.html` and `kairo.html`. |
| `CNAME` | Custom domain for GitHub Pages: kairo.supply. |
| `scripts/plates-received.json` | SHA-256 of each plate as originally received (2592 × 1944 PNG). |

## Build

```sh
node scripts/build.mjs
```

The build checks every ledger link and every sealed file, and it fails if anything has changed. It writes:

- `index.html`: the full page, for GitHub Pages or any static host.
- `kairo.html`: the same page as a fragment, for publishing as a claude.ai artifact.

No dependencies beyond Node 18+.

## How the seal works

Each ledger entry stores `hash = SHA-256(previous_hash + "\n" + JSON.stringify(body))`. The first entry's previous hash is 64 zeros. Changing any past entry changes its hash and breaks every entry after it. The record page's "Verify this record" button recomputes the chain and re-hashes the published files with the browser's Web Crypto API.

Anchoring the latest hash (the record seal) to a public blockchain is the planned next step.

## Adding to a record

Add a new entry to the end of `data/ledger.json`, with `prev` set to the last entry's `hash` and `hash` computed as above. A helper script for this is a good next addition. Don't replace or re-seal media that is already in the ledger. Publish new files under new names and record them in a new entry.

## Wording rules

- A Kairo Supply record documents identity and condition. It is not a valuation or an appraisal.
- Lead with fossils and mineral specimens. Describe minerals by their documented locality.
- State confidence plainly, and say when something can't be determined.

## Domain

`CNAME` points GitHub Pages at `kairo.supply`. At the domain registrar, add four `A` records for the apex (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a `CNAME` for `www` pointing to `kadenthayer.github.io`. Then turn on "Enforce HTTPS" in the repo's Pages settings.

// Kairo Record build.
// 1. Creates data/ledger.json the first time (the genesis entries for KR-0001).
//    After that the ledger is append-only: this script verifies it and never rewrites it.
// 2. Injects record data + ledger into src/kairo.src.html and writes:
//    - kairo.html  (page fragment, published as a claude.ai artifact)
//    - index.html  (full document, for GitHub Pages or any static host)
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => join(root, ...a);
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const ZERO = "0".repeat(64);
const linkHash = (prev, body) => sha(prev + "\n" + JSON.stringify(body));

const record = JSON.parse(readFileSync(p("data/kr-0001.json"), "utf8"));
const collection = JSON.parse(readFileSync(p("data/collection.json"), "utf8"));
const received = JSON.parse(readFileSync(p("scripts/plates-received.json"), "utf8"));

const servedFiles = [
  ...record.plates.map((pl) => `media/kr-0001/${pl.id}.jpg`),
  "media/kr-0001/v01.mp4",
];

function genesis() {
  const bodies = [
    {
      seq: 1,
      date: "2026-10-20",
      type: "Micro-imaging session",
      record: "KR-0001",
      instrument: "Dino-Lite AM7115MZT",
      files: [
        ...received.map((r) => ({ name: `${r.plate}`, px: `${r.w}x${r.h}`, sha256: r.sha256_received })),
        { name: "v01", file: "20261020_203235093.mov", sha256: "3a44d98ab0421f845d619d642490ab161d40d0ae936691f446378b0a27a545e1" },
      ],
      note: "Hashes are of the files as received by Kairo.",
    },
    {
      seq: 2,
      date: "2026-10-21",
      type: "Provenance entered",
      record: "KR-0001",
      source: record.source,
      holder: record.holder,
      note: "Acquisition date and invoice to be attached.",
    },
    {
      seq: 3,
      date: "2026-10-21",
      type: "Preliminary examination",
      record: "KR-0001",
      method: "Visual review of micro-images",
      findings_sha256: sha(readFileSync(p("data/kr-0001.json"))),
      note: "Hash of the record file as examined.",
    },
    {
      seq: 4,
      date: "2026-10-21",
      type: "Web copies published",
      record: "KR-0001",
      files: servedFiles.map((f) => ({ path: f, sha256: sha(readFileSync(p(f))) })),
      note: "Reduced-size copies served on this page. Anyone can re-hash them.",
    },
  ];
  let prev = ZERO;
  return bodies.map((body) => {
    const hash = linkHash(prev, body);
    const entry = { prev, hash, body };
    prev = hash;
    return entry;
  });
}

const ledgerPath = p("data/ledger.json");
let ledger;
if (existsSync(ledgerPath)) {
  ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
} else {
  ledger = genesis();
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  console.log("Wrote genesis ledger.");
}

// Verify chain and served files.
let prev = ZERO;
for (const e of ledger) {
  if (e.prev !== prev || linkHash(prev, e.body) !== e.hash) throw new Error(`Ledger broken at entry ${e.body.seq}`);
  prev = e.hash;
}
for (const e of ledger) {
  for (const f of e.body.files || []) {
    if (f.path && sha(readFileSync(p(f.path))) !== f.sha256) throw new Error(`File changed since it was sealed: ${f.path}`);
  }
}
console.log(`Ledger verified: ${ledger.length} entries, seal ${prev.slice(0, 16)}…`);

const data = { record, collection, ledger };
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const src = readFileSync(p("src/kairo.src.html"), "utf8");
const fragment = src.replace("/*__KAIRO_DATA__*/null", json);
if (fragment === src) throw new Error("Data placeholder not found in src/kairo.src.html");

writeFileSync(p("kairo.html"), fragment);
writeFileSync(
  p("index.html"),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${fragment}\n</body>\n</html>\n`
);
console.log("Wrote kairo.html and index.html");

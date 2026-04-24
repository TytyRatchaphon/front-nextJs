import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "src");

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
  ".txt",
]);

const MOJIBAKE_HINT = /[ÃÂàâð]/;
const THAI_CHAR = /[\u0E00-\u0E7F]/g;
const MOJIBAKE_TOKENS =
  /[ÃÂàâð][\u0080-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g;
const CP1252_CHUNK =
  /[\u0080-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]{2,}/g;

const CP1252_UNICODE_TO_BYTE = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const shouldProcess = (filePath) => ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const scoreTextQuality = (value) => {
  const thaiCount = (value.match(THAI_CHAR) || []).length;
  const mojibakeCount = (value.match(MOJIBAKE_TOKENS) || []).length;
  return thaiCount * 4 - mojibakeCount * 3;
};

const encodeWindows1252 = (value) => {
  const bytes = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) return null;
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }
    const mapped = CP1252_UNICODE_TO_BYTE.get(codePoint);
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }
  return Buffer.from(bytes);
};

const tryRepairLine = (line) => {
  if (!MOJIBAKE_HINT.test(line)) return line;

  const repaired = line.replace(CP1252_CHUNK, (chunk) => {
    const encoded = encodeWindows1252(chunk);
    if (!encoded) return chunk;
    const decoded = encoded.toString("utf8");
    if (decoded.includes("\uFFFD")) return chunk;
    return scoreTextQuality(decoded) > scoreTextQuality(chunk) ? decoded : chunk;
  });

  return repaired;
};

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (entry.isFile() && shouldProcess(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
};

const writeMode = process.argv.includes("--write");

const main = async () => {
  const files = await walk(TARGET_DIR);
  const report = [];
  let changedFileCount = 0;
  let changedLineCount = 0;

  for (const filePath of files) {
    const original = await fs.readFile(filePath, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const lines = original.split(/\r?\n/);
    let touched = false;
    const fixedLines = lines.map((line) => {
      const fixed = tryRepairLine(line);
      if (fixed !== line) {
        touched = true;
        changedLineCount += 1;
      }
      return fixed;
    });

    if (!touched) continue;

    changedFileCount += 1;
    report.push(path.relative(ROOT, filePath));

    if (writeMode) {
      await fs.writeFile(filePath, fixedLines.join(eol), "utf8");
    }
  }

  if (changedFileCount === 0) {
    console.log("No mojibake patterns were repaired.");
    return;
  }

  console.log(
    `${writeMode ? "Repaired" : "Detected"} mojibake in ${changedFileCount} file(s), ${changedLineCount} line(s).`,
  );
  for (const rel of report) {
    console.log(` - ${rel}`);
  }
  if (!writeMode) {
    console.log("Run with --write to apply fixes.");
  }
};

main().catch((error) => {
  console.error("Failed to process mojibake repair:", error);
  process.exit(1);
});

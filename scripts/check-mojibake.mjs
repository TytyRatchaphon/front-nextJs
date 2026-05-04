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
const MAX_LOG_LINES = 120;

const shouldProcess = (filePath) => ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase());

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

const main = async () => {
  const files = await walk(TARGET_DIR);
  const findings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!MOJIBAKE_HINT.test(line)) continue;
      findings.push({
        file: path.relative(ROOT, filePath),
        line: i + 1,
        text: line.trim().slice(0, 160),
      });
    }
  }

  if (findings.length === 0) {
    console.log("No mojibake patterns found.");
    return;
  }

  console.error(`Found ${findings.length} mojibake line(s).`);
  for (const finding of findings.slice(0, MAX_LOG_LINES)) {
    console.error(` - ${finding.file}:${finding.line} ${finding.text}`);
  }
  if (findings.length > MAX_LOG_LINES) {
    console.error(` ...and ${findings.length - MAX_LOG_LINES} more.`);
  }
  process.exit(1);
};

main().catch((error) => {
  console.error("Failed to check mojibake:", error);
  process.exit(1);
});

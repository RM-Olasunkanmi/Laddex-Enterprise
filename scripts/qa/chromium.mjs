// Finds a Chromium binary for playwright-core. Order: $CHROMIUM_PATH, the preinstalled
// /opt/pw-browsers (CI containers), then Playwright's own cache on Linux, macOS or Windows.
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RELATIVE = [
  "chrome-linux/chrome",
  "chrome-linux/headless_shell",
  "chrome-linux64/chrome",
  "chrome-headless-shell-linux64/chrome-headless-shell",
  "chrome-win64/chrome.exe",
  "chrome-win/chrome.exe",
  "chrome-headless-shell-win64/chrome-headless-shell.exe",
  "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
];

export function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH))
    return process.env.CHROMIUM_PATH;
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    "/opt/pw-browsers",
    join(homedir(), ".cache", "ms-playwright"),
    join(homedir(), "Library", "Caches", "ms-playwright"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright"),
  ].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    // Newest first, full Chromium before the headless shell.
    const dirs = readdirSync(root)
      .filter((d) => d.startsWith("chromium"))
      .sort((a, b) => b.localeCompare(a));
    for (const d of dirs)
      for (const rel of RELATIVE)
        if (existsSync(join(root, d, rel))) return join(root, d, rel);
  }
  throw new Error(
    "No Chromium found. Run `npx playwright-core install chromium` or set CHROMIUM_PATH.",
  );
}

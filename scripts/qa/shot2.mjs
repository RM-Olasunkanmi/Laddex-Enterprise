// Usage: node scripts/qa/shot2.mjs <url> <out.png> [w] [h] [--dark] [--full] [--wait=ms]
// Like shot.mjs but scrolls through the page first so scroll-driven reveals have played.
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
const [url, out, w = "1440", h = "900", ...flags] = process.argv.slice(2);
const root = "/opt/pw-browsers";
let exe;
for (const d of readdirSync(root)) for (const r of ["chrome-linux/chrome", "chrome-linux/headless_shell"]) if (existsSync(`${root}/${d}/${r}`)) exe = `${root}/${d}/${r}`;
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
if (flags.includes("--dark")) await ctx.addInitScript(() => localStorage.setItem("laddex-theme", "dark"));
const p = await ctx.newPage();
if (flags.includes("--full")) await p.emulateMedia({ reducedMotion: "reduce" });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
const wait = flags.find((f) => f.startsWith("--wait="));
await p.waitForTimeout(wait ? +wait.split("=")[1] : 1500);
if (flags.includes("--full")) {
}
await p.screenshot({ path: out, fullPage: flags.includes("--full") });
console.log(JSON.stringify({ out, errors }));
await b.close();

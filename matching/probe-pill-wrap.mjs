// Probe: does any pill label on a route break onto a second line, and how far
// does the registration box's pill sit from the box's right edge?
//
// The pill is live's `.button` — `line-height:0` — so a wrapped label does not
// grow the box, it stacks the lines on the same baseline (Tim, Discord,
// 2026-09-02 20:43: "Request" drawn over "Appointment"). Counting distinct
// line tops therefore finds nothing; count the text FRAGMENTS instead.
//
//   PROBE_URL=https://www.beachfrontdentistry.com/your-first-visit \
//   PROBE_WAIT=load node matching/probe-pill-wrap.mjs      # the reference
//   node matching/probe-pill-wrap.mjs                       # localhost:5199
//   PROBE_WEBKIT=1 …                                        # add WebKit
import { chromium, webkit } from "@playwright/test";

const URL = process.env.PROBE_URL ?? "http://localhost:5199/your-first-visit";
const WAIT = process.env.PROBE_WAIT === "load" ? "load" : "networkidle";
const WIDTHS = [390, 480, 640, 768, 834, 1024, 1200, 1440];

async function probe(name, launcher) {
  const browser = await launcher.launch();
  const page = await browser.newPage();
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(URL, { waitUntil: WAIT, timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.evaluate(() => {
      const out = [];
      for (const a of document.querySelectorAll("a")) {
        const t = (a.textContent || "").trim();
        if (
          !/^(Request (an )?Appointment|Book Appointment|Registration Forms?|Download Forms?)$/.test(
            t,
          )
        )
          continue;
        const range = document.createRange();
        range.selectNodeContents(a);
        const frags = Array.from(range.getClientRects()).filter(
          (r) => r.width > 0,
        );
        const r = a.getBoundingClientRect();
        const p = a.parentElement.getBoundingClientRect();
        const box = a.closest(".registration-forms-box");
        const b = box?.getBoundingClientRect();
        const where =
          (a.closest("[data-slice-type]")?.getAttribute("data-slice-type") ??
            (box ? "regbox" : "?")) +
          (b
            ? ` box=${Math.round(b.width)} gapToBoxRight=${Math.round(b.right - r.right)}`
            : "");
        out.push(
          `${where} "${t}" frags=${frags.length} [${frags
            .map(
              (f) =>
                `${Math.round(f.left - r.left)}+${Math.round(f.width)}@y${Math.round(f.top - r.top)}`,
            )
            .join(
              " ",
            )}] pill ${Math.round(r.width)}x${Math.round(r.height)} parent ${Math.round(p.width)}`,
        );
      }
      return out;
    });
    for (const row of rows) console.log(`${name} @${w}: ${row}`);
  }
  await browser.close();
}

await probe("chromium", chromium);
if (process.env.PROBE_WEBKIT) await probe("webkit", webkit);

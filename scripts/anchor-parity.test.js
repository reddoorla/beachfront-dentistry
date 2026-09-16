// The anchor-parity probe is the FIRST thing a failing round is told to run,
// and its verdict decides whether every region score below an anchor is
// trusted. So it has to model the cut the way the thing it audits does:
//
//   • `lib/capture.mjs` resolves an anchor over a FIXED tag list
//     (`h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button`, capture.mjs:341)
//     — `main` is not in it.
//   • `lib/regions.mjs regionsFromAnchors` cuts on the anchor's top Y and
//     nothing else; a region runs from one anchor's y to the next's, and a gap
//     of 4px or less is dropped as degenerate (regions.mjs:56).
//
// Every case below is driven through the probe's own exported halves, and each
// refusal is shown beside the grant it must not swallow — a probe proven only
// to flag is not proven, which is the failure this repo has hit twice.
//
// Lives under scripts/ rather than matching/: the recipe's .gitignore block
// ignores `matching/*` and whitelists only the files it installs, so a test
// file there is invisible to git and to vitest's include alike.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readAnchors, verdict } from "../matching/anchor-parity.mjs";

// jsdom lays nothing out, so every rect would be 0×0 and the probe would read
// the same y and h for every element. Geometry comes from data-y / data-h.
const realRect = Element.prototype.getBoundingClientRect;
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    const y = Number(this.dataset.y ?? 0);
    const h = Number(this.dataset.h ?? 0);
    return { top: y, bottom: y + h, height: h, left: 0, right: 0, width: 0 };
  };
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  document.body.innerHTML = "";
});

const read = (html, anchor) => {
  document.body.innerHTML = html;
  return readAnchors([anchor])[0];
};

/** The Webflow reference: sections are bare divs, no landmark wrapper. */
const LIVE_HOME = `
  <div class="section-2" data-y="68" data-h="900">
    <h1 data-y="120" data-h="60">Creative Lofts</h1>
    <p data-y="200" data-h="40">Copy under the heading.</p>
  </div>
  <div class="section-3" data-y="968" data-h="700">
    <h2 data-y="1000" data-h="48">Meet the Team</h2>
  </div>`;

/** The rebuild: every section sits inside one <main> landmark that spans the
 *  whole page — the shape every Reddoor site in this stack has and no Webflow
 *  reference does. */
const OURS_HOME = `
  <header data-y="0" data-h="68"><a data-y="0" data-h="68">Book</a></header>
  <main class="flex-1" data-y="68" data-h="4106">
    <section class="hero" data-y="68" data-h="900">
      <h1 data-y="120" data-h="60">Creative Lofts</h1>
      <p data-y="200" data-h="40">Copy under the heading.</p>
    </section>
    <section class="team" data-y="968" data-h="700">
      <h2 data-y="1000" data-h="48">Meet the Team</h2>
    </section>
  </main>`;

describe("readAnchors resolves the element capture.mjs would cut at", () => {
  it("does not resolve a page's <main> landmark, which capture.mjs never considers", () => {
    const el = read(OURS_HOME, "Creative Lofts");
    expect(el.tag).not.toBe("main");
    expect(el).toMatchObject({ tag: "section", y: 68, h: 900 });
  });

  it("resolves the reference's bare wrapper the same way (the grant side)", () => {
    expect(read(LIVE_HOME, "Creative Lofts")).toMatchObject({
      tag: "div",
      cls: "section-2",
      y: 68,
      h: 900,
    });
  });

  it("still resolves an anchor no landmark can swallow — both sides agree", () => {
    // <main>'s collapsed text starts with "Creative Lofts", not with this
    // anchor, so it was never a candidate and nothing about the tag list
    // changes the answer. Without this case, dropping `main` from the
    // selector could be hiding hits rather than picking the right one.
    expect(read(OURS_HOME, "Meet the Team")).toMatchObject({
      tag: "section",
      y: 968,
      h: 700,
    });
    expect(read(LIVE_HOME, "Meet the Team")).toMatchObject({
      tag: "div",
      y: 968,
      h: 700,
    });
  });

  it("reports an anchor that is on neither side as missing", () => {
    expect(read(LIVE_HOME, "No Such Heading")).toMatchObject({
      missing: true,
      n: 0,
    });
  });
});

describe("verdict flags what can actually move a cut", () => {
  it("does not flag the <main> case: both sides cut at y=68", () => {
    // The 29-navy false positive, exactly: <div class="section-2"> h=900 on
    // live against <main class="flex-1"> h=4106 here, reported as a 4.6x
    // MISMATCH at every viewport while the gate cut both pages at 68.
    const v = verdict({ y: 68, h: 900 }, { y: 68, h: 4106 });
    expect(v.bad).toBe(false);
    expect(v.flag).toMatch(/ok/);
  });

  it("flags a real cut skew — the ask-the-doctor wrapper, 220px up", () => {
    const v = verdict({ y: 68, h: 320 }, { y: 288, h: 80 });
    expect(v.bad).toBe(true);
    expect(v.flag).toMatch(/220/);
  });

  it("flags an anchor that resolved on only one side", () => {
    expect(verdict({ missing: true }, { y: 68, h: 900 }).bad).toBe(true);
    expect(verdict({ missing: true }, { y: 68, h: 900 }).flag).toMatch(
      /UNRESOLVED/,
    );
  });

  it("passes a pair that cuts at the same y with comparable boxes", () => {
    expect(verdict({ y: 968, h: 700 }, { y: 968, h: 700 }).bad).toBe(false);
  });

  it("uses regionsFromAnchors' own 4px tolerance as the boundary", () => {
    // 4px or less is the gap regionsFromAnchors drops as degenerate, so it
    // cannot move a cut; 5px can.
    expect(verdict({ y: 68, h: 900 }, { y: 72, h: 900 }).bad).toBe(false);
    expect(verdict({ y: 68, h: 900 }, { y: 73, h: 900 }).bad).toBe(true);
  });
});

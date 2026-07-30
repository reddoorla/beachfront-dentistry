// Seed the 5 native `page` docs (home, your-first-visit, our-team, services,
// ask-the-doctor) with their real slice assemblies — the Task-16 page-assembly
// map, authored from VERBATIM copy lifted off the live Webflow site
// (beachfrontdentistry.com). The webflow-import IR only ever captured the
// entity collections (services/questions/team), never page-level chrome, so the
// migrate left these five as hero-only stubs; this script fills them.
//
// Mechanism mirrors reddoor-maintenance's proven runMigration:
//   - page-level images upload to the Asset API first (dedup by filename against
//     the existing library), and the Image field carries just `{ id }`.
//   - the 5 pages already exist PUBLISHED on master (stubs), so each POST to the
//     Migration API returns "already exists"; we then look up the master doc id
//     and PUT the real assembly. Everything lands in an unpublished Migration
//     release for Tucker to review + publish.
//
// Token: read from reddoor-starter/.env (authorized), passed only in headers,
// never printed. Idempotent: re-running reuses assets and re-PUTs the docs.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const REPO = "48bb12d1";
const env = readFileSync(
  `${homedir()}/Documents/GitHub/reddoor-starter/.env`,
  "utf8",
);
const TOKEN = env
  .match(/^BEACHFRONT_DENTISTRY_WRITE_TOKEN=(.+)$/m)?.[1]
  ?.trim();
if (!TOKEN)
  throw new Error(
    "BEACHFRONT_DENTISTRY_WRITE_TOKEN not found in reddoor-starter/.env",
  );

const THROTTLE_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const authHeaders = { repository: REPO, Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };

async function fetchWithRetry(url, opts) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    await sleep(1500 * (i + 1));
  }
  return fetch(url, opts);
}
async function expectOk(res, label) {
  if (!res.ok)
    throw new Error(
      `${label}: ${res.status} ${(await res.text()).slice(0, 300)}`,
    );
  return res;
}

// ---- rich text (StructuredText) builders -------------------------------------
const para = (text, spans = []) => ({ type: "paragraph", text, spans });
const head = (level, text, spans = []) => ({
  type: `heading${level}`,
  text,
  spans,
});
// a heading/paragraph with one phrase emphasized strong
function withStrong(block, phrase) {
  const start = block.text.indexOf(phrase);
  if (start < 0) return block;
  return {
    ...block,
    spans: [
      ...block.spans,
      { start, end: start + phrase.length, type: "strong" },
    ],
  };
}
// a paragraph containing a hyperlink span over `phrase` → url
function paraLink(text, phrase, url) {
  const start = text.indexOf(phrase);
  const spans =
    start < 0
      ? []
      : [
          {
            start,
            end: start + phrase.length,
            type: "hyperlink",
            data: { link_type: "Web", url },
          },
        ];
  return { type: "paragraph", text, spans };
}
const webLink = (url) => ({ link_type: "Web", url });

// Prismic rejects an unfilled Link/Image passed as `{}` ("link_type must be
// Web…") — an empty field must be OMITTED entirely. Drop every empty-object
// value (keep empty arrays, which are valid unfilled StructuredText).
function stripEmpty(v) {
  if (Array.isArray(v)) return v.map(stripEmpty);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      const c = stripEmpty(val);
      if (
        c &&
        typeof c === "object" &&
        !Array.isArray(c) &&
        Object.keys(c).length === 0
      )
        continue;
      out[k] = c;
    }
    return out;
  }
  return v;
}

// ---- asset upload + dedup ----------------------------------------------------
async function listExistingAssets() {
  const byFilename = new Map();
  let cursor;
  for (let i = 0; i < 50; i++) {
    const u = new URL("https://asset-api.prismic.io/assets");
    u.searchParams.set("limit", "1000");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await expectOk(
      await fetchWithRetry(u, { headers: authHeaders }),
      "list assets",
    );
    const json = await res.json();
    for (const a of json.items ?? [])
      byFilename.set(a.filename, { id: a.id, url: a.url });
    cursor = json.cursor;
    if (!cursor || (json.items ?? []).length === 0) break;
  }
  return byFilename;
}

const filenameOf = (url) =>
  decodeURIComponent(url.split("/").pop().split("?")[0]);

// Resolve a set of remote image URLs → Map<url, {id}>, uploading only the
// filenames not already in the library.
async function resolveAssets(urls, existing) {
  const idByUrl = new Map();
  let uploaded = 0,
    reused = 0;
  for (const url of urls) {
    const filename = filenameOf(url);
    const known = existing.get(filename);
    if (known) {
      idByUrl.set(url, { id: known.id });
      reused++;
      continue;
    }
    const blob = await (
      await expectOk(await fetch(url), `fetch ${filename}`)
    ).blob();
    const form = new FormData();
    form.append("file", blob, filename);
    const res = await expectOk(
      await fetchWithRetry("https://asset-api.prismic.io/assets", {
        method: "POST",
        headers: authHeaders,
        body: form,
      }),
      `upload ${filename}`,
    );
    const created = await res.json();
    idByUrl.set(url, { id: created.id });
    existing.set(filename, { id: created.id, url: created.url });
    uploaded++;
    console.log(`  asset ↑ ${filename}`);
    await sleep(THROTTLE_MS);
  }
  console.log(`assets: ${uploaded} uploaded, ${reused} reused`);
  return idByUrl;
}

// =============================================================================
// IMAGE URLS (page-level, off the live site)
// =============================================================================
const CDN = "https://cdn.prod.website-files.com";
const A = `${CDN}/64af3f93339537d6b661b556`; // primary bucket
const B = `${CDN}/64b1c843b071dc32170ea053`; // team/reviews bucket
const IMG = {
  // hero / closing-CTA backgrounds (home hero is a bg video on the live site;
  // its poster still is a faithful hero image)
  heroHome: `${A}/6531a5d33be0526fd5c1bc35_BD_homepage_video_hd_101823-poster-00001.jpg`,
  heroFirstVisit: `${A}/64b8367c61b87df9edf5b314_DSC_7547.jpg`,
  ctaBeach: `${A}/64af4c2e1e0b9ad3d901241e_beach-img_sebastien-jermer-n7DY58YFg9E-unsplash.jpg`,
  comfort: `${A}/64b998400e0eb30dcc2adf55_DSC_7650.jpg`,
  comprehensive: `${A}/64b9a0735c910a0ec38efc68_cerec-same-day-machine.jpg`,
  caring: `${A}/64b9a05a616537fb5e59d7e7_BD_office_2020_IMG_2885.jpg`,
  path: `${A}/64b9b4a36fc4120f56bbb2da_walking_on_the_beach.jpg`,
  quan: `${B}/64bb0fbee7ccd4a6c98eb3bc_BD_Dr-Quan-Headshot_crop.jpg`,
  hopkins: `${B}/64bb0fca292b8b83528cc2ff_BD_Dr-Hopkins-Headshot_crop.jpg`,
  firstExam: `${A}/64b8507bcb8d755f8682eef1_DSC_7704.jpg`,
  // office tour (your-first-visit)
  tour1: `${A}/6542a1154feb8b0a92630033_BD_office_2020_IMG_2870_horiz.jpg`,
  tour2: `${A}/6542a134d4645bea1c787068_BD_office_2020_IMG_2880_horiz.jpg`,
  tour3: `${A}/6542a12e0369ef3b0d3504d4_BD_office_2020_IMG_2877.jpg`,
  tour4: `${A}/6542a12762a6c6205a77f81d_BD_office_2020_IMG_2875.jpg`,
  tour5: `${A}/6542a10997b561809dbcf82a_1706_Village_Pro_building_exterior_image_crop_3000px.jpg`,
  tour6: `${A}/64b847552e330d5af9486457_BD_office_2020_IMG_2883.jpg`,
  tour7: `${A}/6542a13f035d60f4138f9688_BD_office_2020_IMG_2881_horiz.jpg`,
  tour8: `${A}/6542a1c2fec0efaa4cd03347_BD_office_2020_IMG_2882_horiz.jpg`,
  // review reviewer photos
  rvPaul: `${B}/6578f51f8205f87eec5805b9_paul_redondo.jpeg`,
  rvTonya: `${B}/6578ee0332b2331474f2c1a4_Tonya_hermosa.jpeg`,
  rvMelissa: `${B}/6578f179124927f182f100ea_Melissa_Inglewood.jpeg`,
  rvJay: `${B}/657a215b6d045ccd271de4b1_Jay_Newman_google.png`,
  rvLeigh: `${B}/657a2280b90d9c4670a3fca0_Leigh%20Lowery%20google.png`,
};

// Shared review carousel items (verbatim quotes off the live site; truncated
// exactly as the live teaser cards show them, linking out to Yelp/Google).
const REVIEWS = [
  {
    quote:
      "This is my favorite dentistry team to date! The office was clean and the rooms had TVs everywhere (even on the ceiling). The staff was excellent. Front desk team was super nice. Both Stacey (hygienest) and Dr. Quan were absolutely...",
    reviewer_name: "Paul K.",
    reviewer_place: "Redondo Beach, CA",
    photo: IMG.rvPaul,
    url: "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach?hrid=BFXba7Bhp7KMgaFkJdBc7w&utm_campaign=www_review_share_popup&utm_medium=copy_link&utm_source=(direct)",
  },
  {
    quote:
      "The best care with all the technology but it's the people that make this office what it is! From the front office, dental hygienist, dental assistant, and of course the dentists themselves I actually like going to get my checkups and cleani",
    reviewer_name: "Tonya S.",
    reviewer_place: "Hermosa Beach, CA",
    photo: IMG.rvTonya,
    url: "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach?hrid=pDz_x-aGJx-qe__EadRGNw&utm_campaign=www_review_share_popup&utm_medium=copy_link&utm_source=(direct)",
  },
  {
    quote:
      "I am so glad I found this dentist office through Yelp! Their amazing reviews do not lie! The service is 10/10 I was lucky to have Stacey as my dental hygienist! She is such a sweet heart she made me feel comfortable the whole time...",
    reviewer_name: "Melissa R.",
    reviewer_place: "",
    photo: IMG.rvMelissa,
    url: "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach?hrid=BXZVdhsXqpvW_ylTj1Kfiw&utm_campaign=www_review_share_popup&utm_medium=copy_link&utm_source=(direct)",
  },
  {
    quote:
      "As a fairly recent transplant to the South Bay, one of our concerns was finding a new dentist office. I will unequivocally say that this is no longer a concern. From location, to Dr. Quan, to the staff, Beachfront Dentistry is 5 stars...",
    reviewer_name: "Jay. N",
    reviewer_place: "Redondo Beach",
    photo: IMG.rvJay,
    url: "https://maps.app.goo.gl/u3xjEEDSV9KmAnMq9",
  },
  {
    quote:
      "Finally I found the right dentist! I am so happy I found such a wonderful overall practice. I received the best most thorough care. Both the Dr. Quan and my hygienist walked me thru all details and were gentle and made sure I was...",
    reviewer_name: "Leigh L.",
    reviewer_place: "Redondo Beach",
    photo: IMG.rvLeigh,
    url: "https://maps.app.goo.gl/mqZFMifn4U4MF92C8",
  },
];
const reviewItems = (img) =>
  REVIEWS.map((r) => ({
    quote: r.quote,
    reviewer_name: r.reviewer_name,
    reviewer_place: r.reviewer_place,
    reviewer_photo: img(r.photo),
    review_url: webLink(r.url),
  }));

// Shared closing CTA hero (verbatim off the live site footer band) over the
// recurring beach photo.
const ctaHero = (img) => ({
  slice_type: "hero",
  variation: "cta",
  primary: {
    heading: [head(2, "Ready for great dental health?")],
    body: [],
    cta_label: "Book Appointment",
    cta_link: webLink("#appointment"),
    background_image: img(IMG.ctaBeach),
  },
  items: [],
});
// Shared meet-the-team teaser (the live team carousel → a media_text teaser
// linking to /our-team, per the Task-16 map).
const teamTeaser = (img) => ({
  slice_type: "media_text",
  variation: "imageRight",
  primary: {
    heading: [head(2, "Meet Our Team")],
    body: [
      para(
        "We love caring for our patients and we also love the beach, read a little about each of our team members and see their favorite beach beyond the South Bay.",
      ),
      paraLink("Meet our team →", "Meet our team →", "/our-team"),
    ],
    media: img(IMG.quan),
  },
  items: [],
});

// =============================================================================
// PAGE ASSEMBLIES  (img: url → {id} resolver, closed over per page)
// =============================================================================
function assemblies(img) {
  return {
    home: [
      {
        slice_type: "hero",
        variation: "default",
        primary: {
          heading: [
            head(
              1,
              "Have a relaxed dental experience where you are known and cared for at Beachfront Dentistry",
            ),
          ],
          body: [],
          cta_label: "Make Appointment",
          cta_link: webLink("#appointment"),
          background_image: img(IMG.heroHome),
        },
        items: [],
      },
      {
        slice_type: "section_grid",
        variation: "default",
        primary: {
          layout: "cards",
          heading: [head(2, "Finally have a dentist that puts you first")],
          columns: 3,
        },
        items: [
          {
            item_heading: [head(4, "Comfort")],
            item_body: [
              para(
                "Our dental care integrates all oral health needs with goals of establishing life-long and healthy habits",
              ),
            ],
            item_media: img(IMG.comfort),
            item_link: {},
          },
          {
            item_heading: [head(4, "Comprehensive")],
            item_body: [
              para(
                "Our focus on preventative and restorative dental treatments ensures that you receive long-lasting, quality care",
              ),
            ],
            item_media: img(IMG.comprehensive),
            item_link: {},
          },
          {
            item_heading: [head(4, "Caring")],
            item_body: [],
            item_media: img(IMG.caring),
            item_link: {},
          },
        ],
      },
      teamTeaser(img),
      {
        slice_type: "carousel",
        variation: "review",
        primary: {
          heading: [head(2, "Serving the South Bay for over 40 years")],
        },
        items: reviewItems(img),
      },
      {
        slice_type: "section_grid",
        variation: "default",
        primary: {
          layout: "steps",
          heading: [head(2, "Your Path to Oral Health")],
          subtitle: "is like a short walk on the beach",
          side_image: img(IMG.path),
          cta_label: "Book an Appointment",
          cta_link: webLink("#appointment"),
          columns: 3,
        },
        items: [
          {
            item_heading: [head(4, "Book an Appointment")],
            item_body: [],
            item_media: {},
            item_link: {},
          },
          {
            item_heading: [head(4, "Have a Complete Exam")],
            item_body: [],
            item_media: {},
            item_link: {},
          },
          {
            item_heading: [head(4, "Receive a No-Pressure Plan")],
            item_body: [],
            item_media: {},
            item_link: {},
          },
        ],
      },
      {
        slice_type: "section_grid",
        variation: "default",
        primary: {
          layout: "services",
          heading: [head(2, "Services")],
          body: [
            para(
              "Our dental team in Redondo Beach's Riviera Village takes great pride in the wide-range of practices our state-of-the-art facility is capable of providing for your smile.",
            ),
          ],
          cta_label: "View All Services",
          cta_link: webLink("/services"),
          columns: 3,
        },
        items: [
          {
            item_heading: [head(4, "Cosmetic Dentistry")],
            item_body: [],
            item_media: {},
            item_link: webLink("/services"),
          },
          {
            item_heading: [head(4, "Implant Dentistry")],
            item_body: [],
            item_media: {},
            item_link: webLink("/services"),
          },
          {
            item_heading: [head(4, "General Dentistry")],
            item_body: [],
            item_media: {},
            item_link: webLink("/services"),
          },
        ],
      },
      {
        slice_type: "question_list",
        variation: "teaser",
        primary: {
          heading: [head(2, "Ask the Doctor")],
          side_image: img(IMG.quan),
          max_items: 6,
        },
        items: [],
      },
      ctaHero(img),
    ],

    "your-first-visit": [
      {
        slice_type: "hero",
        variation: "default",
        primary: {
          heading: [head(1, "We are excited to meet and care for you.")],
          body: [
            para(
              "We want you to feel comfortable before your first visit. Here some ways to give you a clear idea of what to expect:",
            ),
          ],
          cta_label: "Book an Appointment",
          cta_link: webLink("#appointment"),
          background_image: img(IMG.heroFirstVisit),
        },
        items: [],
      },
      {
        slice_type: "carousel",
        variation: "photos",
        primary: { heading: [head(2, "Office Tour")], label: "Office Tour" },
        items: [
          IMG.tour1,
          IMG.tour2,
          IMG.tour3,
          IMG.tour4,
          IMG.tour5,
          IMG.tour6,
          IMG.tour7,
          IMG.tour8,
        ].map((u) => ({ image: img(u), caption: "" })),
      },
      teamTeaser(img),
      {
        slice_type: "rich_text",
        variation: "default",
        primary: {
          content: [
            head(3, "First Exam"),
            para(
              "To be a long term health partner we need to really understand your current dental condition. We ask for 2 hours of your time. We are gentle but thorough to give you the best plan for the future. Here are the basic steps to that first exam:",
            ),
            withStrong(
              para("15 min — Registration Forms"),
              "15 min — Registration Forms",
            ),
            para(
              "That necessary step to understand your history and your dental helath goals and is completed before appointment",
            ),
            withStrong(para("10 min — Check-in"), "10 min — Check-in"),
            para(
              "Our front office staff will get you checked in and make sure all your paperwork is in order and gives you an expectation of payment.",
            ),
            withStrong(
              para("15 min — X-rays and Imaging"),
              "15 min — X-rays and Imaging",
            ),
            para(
              "We are do our best to make you comfortable, like turn on your ceiling TV to your favorite channel, while we take photos and x-rays of your current condition.",
            ),
            withStrong(para("20 min — Exam"), "20 min — Exam"),
            para(
              "Both our hygienist and dentist will conduct a thorough exam of your x-rays and current dental condition, including a cancer and gum disease screening.",
            ),
            withStrong(para("30 min — Cleaning"), "30 min — Cleaning"),
            para(
              "Your hygienist will conduct a thorough dental cleaning using the latest techniques and highest safety precautions. Read our yelp reviews to see how other patients love our hygienists.",
            ),
            withStrong(para("15 min — Dental Plan"), "15 min — Dental Plan"),
            para(
              "Dr. Quan or Dr. Hopkins will review their findings of the exam. If any long term dental is needed he will present the options you have and relative timelines and priorities. Answering any questions you may have so you are empowered to take control of your own long-term dental health.",
            ),
            withStrong(para("05 min — Check out"), "05 min — Check out"),
            para(
              "You then have a chance to schedule any future visits and take care of any cost questions about future work.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "carousel",
        variation: "review",
        primary: {
          heading: [head(2, "Serving the South Bay for over 40 years")],
        },
        items: reviewItems(img),
      },
      ctaHero(img),
    ],

    "our-team": [
      {
        slice_type: "lead_text",
        variation: "default",
        primary: {
          eyebrow: "Meet Our Team",
          body: [
            para(
              "We love caring for our patients and we also love the beach, read a little about each of our team members and see their favorite beach beyond the South Bay.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "collection_list",
        variation: "grid",
        primary: { heading: [], collection_type: "person", max_items: 100 },
        items: [],
      },
      ctaHero(img),
    ],

    services: [
      {
        slice_type: "lead_text",
        variation: "default",
        primary: {
          eyebrow: "Services",
          body: [
            para(
              "We offer a wide array of services in cosmetic, implant, and general dentistry. From present issues like discoloration, decay and misalignment to preventative measures for oral cancer and enamel loss- we have you covered.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "service_category_band",
        variation: "default",
        primary: {
          category_tag: "Cosmetic Dentistry",
          heading: [head(3, "Cosmetic Dentistry")],
          intro: [
            para(
              "Cosmetic dentistry focuses on improving the appearance of your smile. If discoloration, a need for whitening and brightening or veneer replacements are causing you to lack confidence in your smile, take a look at our options below.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "service_category_band",
        variation: "default",
        primary: {
          category_tag: "Restore Your Smile",
          heading: [head(3, "Restore Your Smile")],
          intro: [
            para(
              "With solutions in implant dentistry, you no longer have to feel embarrassed by gaps and missing or dead teeth. Dental implants are the next best thing to your natural teeth, which makes them your best long-term, cost-effective solution. Talk to our team about the restorative options that are best for you.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "service_category_band",
        variation: "default",
        primary: {
          category_tag: "General Dentistry",
          heading: [head(3, "General Dentistry")],
          intro: [
            para(
              "Regular check-ups and cleanings are necessary for the prevention, diagnosis, and treatment of conditions that affect your gums, teeth, and oral cavity. Making a plan for prevention is equally as important as treatment for larger issues and can save you thousands in more invasive treatments down the road.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "service_category_band",
        variation: "default",
        primary: {
          category_tag: "Specialty Services",
          heading: [head(3, "Specialty Services")],
          intro: [
            para(
              "Take a look at our products that allow for quality at-home care in whitening, enamel-loss prevention, tooth sensitivity relief, and more! Including Invisalign, which is a series of virtually invisible aligners. Wire-free and bracket-free, you could have straight teeth within 12 months!",
            ),
          ],
        },
        items: [],
      },
      ctaHero(img),
    ],

    "ask-the-doctor": [
      {
        slice_type: "lead_text",
        variation: "default",
        primary: { eyebrow: "Ask the Doctor", body: [] },
        items: [],
      },
      {
        slice_type: "question_list",
        variation: "numbered",
        primary: { heading: [head(2, "Ask the Doctor")] },
        items: [],
      },
      ctaHero(img),
    ],
  };
}

const TITLES = {
  home: "Home",
  "your-first-visit": "Your First Visit",
  "our-team": "Meet Our Team",
  services: "Services",
  "ask-the-doctor": "Ask the Doctor",
};

// =============================================================================
// RUN
// =============================================================================
async function lookupPageIds() {
  const api = await (await fetch(`https://${REPO}.prismic.io/api/v2`)).json();
  const ref = api.refs.find((r) => r.isMasterRef).ref;
  const q = await (
    await fetch(
      `https://${REPO}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=100`,
    )
  ).json();
  const byUid = new Map();
  for (const d of q.results) if (d.type === "page") byUid.set(d.uid, d.id);
  return byUid;
}

async function main() {
  // 1. collect every page-level image url, resolve to asset ids (dedup).
  const urls = new Set();
  const collectImg = (u) => (urls.add(u), { __url: u });
  const dryAsm = assemblies(collectImg);
  for (const slices of Object.values(dryAsm)) JSON.stringify(slices); // force eval
  console.log(`page-level images referenced: ${urls.size}`);

  const existing = await listExistingAssets();
  const idByUrl = await resolveAssets([...urls], existing);
  const img = (u) => idByUrl.get(u); // {id}

  // 2. build final assemblies with resolved asset ids.
  const asm = assemblies(img);
  const pageIds = await lookupPageIds();

  let updated = 0,
    created = 0;
  for (const [uid, slices] of Object.entries(asm)) {
    const body = JSON.stringify({
      type: "page",
      uid,
      lang: "en-us",
      title: TITLES[uid] ?? uid,
      data: stripEmpty({ title: [head(1, TITLES[uid] ?? uid)], slices }),
    });
    // POST first; on "already exists", PUT by the master doc id (the stubs are
    // published, so the id resolves).
    const res = await fetchWithRetry("https://migration.prismic.io/documents", {
      method: "POST",
      headers: jsonHeaders,
      body,
    });
    if (res.ok) {
      created++;
      console.log(`created ${uid} (${slices.length} slices)`);
    } else {
      const text = await res.text();
      if (!/already exists/i.test(text))
        throw new Error(`create ${uid}: ${res.status} ${text.slice(0, 300)}`);
      const id = pageIds.get(uid);
      if (!id)
        throw new Error(`update ${uid}: no master id (publish stub first?)`);
      await sleep(THROTTLE_MS);
      await expectOk(
        await fetchWithRetry(`https://migration.prismic.io/documents/${id}`, {
          method: "PUT",
          headers: jsonHeaders,
          body,
        }),
        `update ${uid}`,
      );
      updated++;
      console.log(`updated ${uid} (${slices.length} slices)`);
    }
    await sleep(THROTTLE_MS);
  }
  console.log(
    `\nDONE: ${created} created, ${updated} updated. Publish the Migration release to go live.`,
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

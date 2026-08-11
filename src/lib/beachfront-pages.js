// Canonical page assemblies for the 5 native Beachfront `page` docs — the
// single source of truth for BOTH:
//   - scripts/seed-pages.mjs, which uploads the page images and PUTs these
//     assemblies into an unpublished Prismic Migration release (img → {id}), and
//   - src/routes/dev/match/[uid], the local matching gate surface, which renders
//     the exact same assemblies through the real SliceZone with live image URLs
//     (img → {url}) so the page-diff/skill gates can run WITHOUT a Prismic
//     publish. Because both consumers read from here, any copy/order/structure
//     fix made to match live propagates straight to what Tucker publishes.
//
// This module is intentionally PURE: no node:*, no fetch, no token, no
// side effects at import — so Vite can bundle it into the dev route and node
// can import it into the seed script.

// ---- rich text (StructuredText) builders ------------------------------------
/** @param {string} text @param {any[]} [spans] */
export const para = (text, spans = []) => ({ type: "paragraph", text, spans });
/** @param {number} level @param {string} text @param {any[]} [spans] */
export const head = (level, text, spans = []) => ({
  type: `heading${level}`,
  text,
  spans,
});
// a heading/paragraph with one phrase emphasized strong
/** @param {{ text: string, spans: any[] }} block @param {string} phrase */
export function withStrong(block, phrase) {
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
/** @param {string} url */
export const webLink = (url) => ({ link_type: "Web", url });

// =============================================================================
// IMAGE URLS (page-level, off the live site)
// =============================================================================
const CDN = "https://cdn.prod.website-files.com";
const A = `${CDN}/64af3f93339537d6b661b556`; // primary bucket
const B = `${CDN}/64b1c843b071dc32170ea053`; // team/reviews bucket
export const IMG = {
  // hero / closing-CTA backgrounds (home hero is a bg video on the live site;
  // its poster still is a faithful hero image)
  heroHome: `${A}/6531a5d33be0526fd5c1bc35_BD_homepage_video_hd_101823-poster-00001.jpg`,
  heroFirstVisit: `${A}/64b8367c61b87df9edf5b314_DSC_7547.jpg`,
  // subpage-hero band backgrounds (live `.hero.<modifier>` bg-images): the
  // redondo-beach shot backs our-team + services; ask-the-doctor reuses the
  // first-exam office photo (`.hero.ask-a-dentist`, == firstExam below).
  heroRedondo: `${A}/64af4ef42e7d98b2fdb91769_beach-in-beautiful-morning-light-at-redondo-beach-75226436.jpeg`,
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

// Each team member's favorite beach — the `.team-grid-beach` banner + white
// `.team-beach-name` caption at the bottom of live's /our-team person cards.
// Live person docs carry this in a `gallery` group (image + caption); the
// blux-migrated Prismic person docs DON'T yet (gallery is empty on all 11), so
// this is the verbatim capture off live. Two consumers read it:
//   - the dev matching route enriches each person doc's gallery from here so the
//     /our-team gate can verify the full card (banner box + caption), and
//   - it's the source for the production seed follow-up that will populate
//     person.gallery for real (5 unique beach photos live in static/beaches/).
// Keyed by person uid; captions are UPPERCASE on live via CSS (stored as shown).
export const PERSON_BEACHES = {
  "dr-robert-quan": { img: "/beaches/bali.jpg", caption: "BALI" },
  "dr-michael-hopkins": { img: "/beaches/cabo-gaddafi.jpg", caption: "CABO" },
  stacey: { img: "/beaches/cabo-lalo.jpg", caption: "CABO" },
  enrique: { img: "/beaches/cabo-lalo.jpg", caption: "CABO" },
  alicia: { img: "/beaches/santa-barbara.jpg", caption: "SANTA BARBARA" },
  linda: { img: "/beaches/myrtle-beach.jpg", caption: "MYRTLE BEACH" },
  michelle: { img: "/beaches/cabo-gaddafi.jpg", caption: "CABO" },
  christina: { img: "/beaches/myrtle-beach.jpg", caption: "MYRTLE BEACH" },
  sabrina: { img: "/beaches/santa-barbara.jpg", caption: "SANTA BARBARA" },
  raquel: { img: "/beaches/bali.jpg", caption: "BALI" },
  lanette: { img: "/beaches/cabo-gaddafi.jpg", caption: "CABO" },
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
/** @param {(u: string) => unknown} img */
const reviewItems = (img) =>
  REVIEWS.map((r) => ({
    quote: r.quote,
    reviewer_name: r.reviewer_name,
    reviewer_place: r.reviewer_place,
    reviewer_photo: img(r.photo),
    review_url: webLink(r.url),
  }));

// Shared closing CTA hero (off the live site footer band) over the recurring
// beach photo. The copy is verbatim except the button label: live says "Book
// Appointment", and MarkUp pin 5980c9d7 #3 (Tim, 2026-08) renames every Book
// CTA to "Request" — a deliberate deviation from the reference.
/** @param {(u: string) => unknown} img */
const ctaHero = (img) => ({
  slice_type: "hero",
  variation: "cta",
  primary: {
    // EMPTY ON PURPOSE — CtaBand owns this heading.
    //
    // Live hard-breaks it into three lines (`Ready for <br/>great dental
    // <br/>health?`) and renders the identical band on every page, so it is
    // chrome, not page content. Seeding the copy here put a SECOND source of
    // truth into Prismic, and the Migration API strips `\n` out of
    // StructuredText on write — so the seeded string came back unbroken and
    // the five nav routes rendered the band 2 lines / 168px short while the
    // detail routes (which take CtaBand's default) stayed correct at 3 lines.
    // Sending nothing makes every surface render the one correct band; an
    // editor can still type an override into Prismic per page.
    heading: [],
    body: [],
    cta_label: "Request Appointment",
    cta_link: webLink("#appointment"),
    background_image: img(IMG.ctaBeach),
  },
  items: [],
});
// Shared meet-the-team section — the live circular-avatar carousel of team
// members. Renders `person` docs via CollectionList's `team` variation (the
// page loader fetches the person collection because this slice references it);
// each avatar links to its /team-members/<uid> detail route.
/** @param {string} [heading] home says "Meet Your Team"; your-first-visit "Meet Our Team" */
const teamTeaser = (heading = "Meet Your Team") => ({
  slice_type: "collection_list",
  variation: "team",
  primary: {
    heading: [head(2, heading)],
    collection_type: "person",
    max_items: 24,
  },
  items: [],
});

export const TITLES = {
  home: "Home",
  "your-first-visit": "Your First Visit",
  "our-team": "Meet Our Team",
  services: "Services",
  "ask-the-doctor": "Ask the Doctor",
};

/** Per-page meta descriptions, seeded to each page document's SEO tab.
 *
 *  Live ships NONE — not one of the six captured pages carries a
 *  `<meta name="description">` — so Google writes the snippet for every result
 *  itself, from whatever text it happens to latch onto. That is the one place
 *  a single-location practice's organic reach is decided, and it is the reason
 *  this diverges from the reference: the tag is invisible, changes no pixel,
 *  and no gate can see it.
 *
 *  Every claim below is taken from the page it describes — "over 40 years"
 *  from the home hero, the two-hour first exam from the exam timeline, the
 *  service list from the collection_item uids, the roster from
 *  beachfront-entities. Nothing here is invented, because a description that
 *  oversells is worse than none. Seeded rather than hardcoded so the practice
 *  can rewrite any of them in Prismic without a deploy; see
 *  beachfront-pages.test.ts for the length guard (Google truncates ~155). */
/** @type {Record<string, { title?: string, description: string }>} */
export const META = {
  home: {
    // The ONLY title override. `title` above is the document name, which the
    // layout composes into "Beachfront Dentistry | <title>" — matching live's
    // Webflow titles exactly. Four of those five read well already; "Home" is
    // the exception, and it is the one page whose blue link in a search result
    // has to say what this business is and where. `meta_title` wins over
    // `title` in the layout, so Prismic's document list still reads "Home".
    title: "Dentist in Redondo Beach, CA",
    description:
      "Beachfront Dentistry has cared for the South Bay for over 40 years. Gentle, thorough dentistry in Redondo Beach, with the time to listen first.",
  },
  "your-first-visit": {
    description:
      "Know what to expect before you arrive: a virtual tour of our Redondo Beach office, the team you will meet, and how the two-hour first exam works.",
  },
  "our-team": {
    description:
      "Meet the dentists, hygienists and assistants of Beachfront Dentistry in Redondo Beach - and find out which South Bay beach each of them loves most.",
  },
  services: {
    description:
      "Invisalign, veneers, crowns, implants, whitening, nightguards and full reconstruction - the dental care Beachfront Dentistry offers in Redondo Beach.",
  },
  "ask-the-doctor": {
    description:
      "Straight answers to the questions patients actually ask, on tooth pain, whitening, implants and daily care, from the dentists at Beachfront Dentistry.",
  },
};

// =============================================================================
// PAGE ASSEMBLIES  (img: url → field resolver, closed over per page:
//   seed passes url→{id}; the dev matching route passes url→{url})
// =============================================================================
/** @param {(u: string) => unknown} img */
export function assemblies(img) {
  return {
    home: [
      {
        slice_type: "hero",
        variation: "default",
        primary: {
          heading: [
            // The Prismic hero heading field's model disallows inline bold, so
            // the live "Beachfront Dentistry" emphasis is applied at render
            // time in Hero/index.svelte, not carried as a strong span here.
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
                "It is our goal to provide you with a relaxing, comfortable, and professional dental experience",
              ),
            ],
            item_media: img(IMG.comfort),
            item_link: {},
          },
          {
            item_heading: [head(4, "Comprehensive")],
            item_body: [
              para(
                "Our dental care integrates all oral health needs with goals of establishing life-long and healthy habits",
              ),
            ],
            item_media: img(IMG.comprehensive),
            item_link: {},
          },
          {
            item_heading: [head(4, "Caring")],
            item_body: [
              para(
                "Our focus on preventative and restorative dental treatments ensures that you receive long-lasting, quality care",
              ),
            ],
            item_media: img(IMG.caring),
            item_link: {},
          },
        ],
      },
      teamTeaser(),
      {
        slice_type: "carousel",
        variation: "review",
        // Selects live's `.home-ssb-section` wrapper margin (1.5rem → 60/48/36),
        // which exists on the home document only — your-first-visit renders the
        // same review slider with no section wrapper.
        primary: {
          layout: "home",
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
          // Live says "Book an Appointment" (button and step 01 alike); MarkUp
          // pin 5980c9d7 #3 renames every Book CTA to "Request", keeping each
          // instance's article shape — a deliberate deviation from the
          // reference.
          cta_label: "Request an Appointment",
          cta_link: webLink("#appointment"),
          columns: 3,
        },
        items: [
          {
            item_heading: [head(4, "Request an Appointment")],
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
        // live `.hero.group-photo`: shorter photo band, lower-left thin slab
        // headline, NO CTA (the intro + CTAs live in the fv-toc-section below).
        slice_type: "hero",
        variation: "groupphoto",
        primary: {
          heading: [head(1, "We are excited to meet and care for you.")],
          background_image: img(IMG.heroFirstVisit),
        },
        items: [],
      },
      {
        // `.fv-toc-section`: intro (left) + 3 numbered nav cards + two outline
        // buttons; anchors down to the sections below.
        slice_type: "first_visit_toc",
        variation: "default",
        primary: {
          intro: [
            para(
              "We want you to feel comfortable before your first visit. Here some ways to give you a clear idea of what to expect:",
            ),
          ],
          // Live renders "Book an Apointment" (a typo on the reference);
          // Tucker asked to ship the correct spelling (2026-08-07), and MarkUp
          // pin 5980c9d7 #3 then renamed every Book CTA to "Request" — so this
          // label deviates from the reference twice over, both on purpose.
          book_label: "Request an Appointment",
          book_link: webLink("#appointment"),
          // No form_label/form_link: live's "Registration Form" button is
          // `href="#"` (matching/spec/your-first-visit.html) and there is no
          // forms destination anywhere in the reference — app.modento.io is
          // only ever behind "Make a Payment". A button that does nothing is
          // worse than no button, so it is omitted rather than pointed at a
          // guess. Tucker 2026-08-07: "remove both buttons". FirstVisitToc
          // already renders the CTA only `{#if p.form_label}` and the slice
          // model still declares both fields, so restoring it is one edit in
          // Prismic once a real URL exists — no code change.
        },
        items: [
          {
            number: "01",
            title: "Take a Virtual Tour",
            target: "#office-tour",
          },
          { number: "02", title: "Meet Our Team", target: "#meet-our-team" },
          { number: "03", title: "First Exam Details", target: "#first-exam" },
        ],
      },
      {
        // `.fv-virtual-tour-section`: full-bleed single-image Office Tour slider
        // (8 slides, 8 dots, edge arrows) under a cyan 60px h1.
        slice_type: "carousel",
        variation: "photos",
        primary: { label: "Office Tour", layout: "fullbleed" },
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
      {
        // `.fv-meet-our-team-section`: the /our-team person cards in a
        // horizontal slider under a big cyan slab heading.
        slice_type: "collection_list",
        variation: "people",
        primary: {
          heading: [head(2, "Meet Our Team")],
          collection_type: "person",
          max_items: 100,
          layout: "slider",
          // Live sorts THIS list differently from /our-team's grid — a
          // Collection List's sort is a per-list setting, and the two disagree:
          // /our-team is Quan, Hopkins, Stacey, Enrique, Alicia, Linda,
          // Michelle, Christina, Sabrina, Raquel, Lanette (= `person.order`),
          // while the your-first-visit slider is the two doctors by surname
          // then everyone alphabetically. Both orders read off live 2026-08-05.
          order_uids:
            "dr-michael-hopkins,dr-robert-quan,alicia,christina,enrique,lanette,linda,michelle,raquel,sabrina,stacey",
        },
        items: [],
      },
      {
        // `.fv-exam-section`: 2-col numbered timeline. LEFT = heading + intro +
        // step 00 (centred badge) + two outline buttons; RIGHT = the DSC_7704
        // photo then steps 01-06. Content is verbatim from live (was a flat
        // rich_text list; restructured into per-step data here).
        slice_type: "exam_timeline",
        variation: "default",
        primary: {
          heading: [head(3, "First Exam")],
          // Live emphasises one phrase inline — SPEC.md §11: "Contains an
          // inline <strong>: 'We ask for 2 hours of your time.' — strong picks
          // up font-weight:bold from the UA/Webflow reset; keep the tag." The
          // migration dropped it, and text-diff sees it: live's paragraph is
          // three text nodes to our one.
          intro: [
            withStrong(
              para(
                "To be a long term health partner we need to really understand your current dental condition. We ask for 2 hours of your time. We are gentle but thorough to give you the best plan for the future. Here are the basic steps to that first exam:",
              ),
              "We ask for 2 hours of your time.",
            ),
          ],
          image: img(IMG.firstExam),
          // No form_label/form_link — same call as the TOC's "Registration
          // Form" above: live's "Download Forms" is `href="#"` too, with
          // nothing to download anywhere in the reference. ExamTimeline
          // renders it only `{#if p.form_label}`.
          // Live says "Book Appointment"; renamed per MarkUp pin 5980c9d7 #3
          // (Book → Request, article shape kept).
          book_label: "Request Appointment",
          book_link: webLink("#appointment"),
        },
        items: [
          {
            number: "00",
            minutes: "15 min",
            title: [head(5, "Registration Forms")],
            body: [
              para(
                "That necessary step to understand your history and your dental helath goals and is completed before appointment",
              ),
            ],
          },
          {
            number: "01",
            minutes: "10 min",
            title: [head(5, "Check-in")],
            body: [
              para(
                "Our front office staff will get you checked in and make sure all your paperwork is in order and gives you an expectation of payment.",
              ),
            ],
          },
          {
            number: "02",
            minutes: "15 min",
            title: [head(5, "X-rays and Imaging")],
            body: [
              para(
                "We are do our best to make you comfortable, like turn on your ceiling TV to your favorite channel, while we take photos and x-rays of your current condition.",
              ),
            ],
          },
          {
            number: "03",
            minutes: "20 min",
            title: [head(5, "Exam")],
            body: [
              para(
                "Both our hygienist and dentist will conduct a thorough exam of your x-rays and current dental condition, including a cancer and gum disease screening.",
              ),
            ],
          },
          {
            number: "04",
            minutes: "30 min",
            title: [head(5, "Cleaning")],
            body: [
              para(
                "Your hygienist will conduct a thorough dental cleaning using the latest techniques and highest safety precautions. Read our yelp reviews to see how other patients love our hygienists.",
              ),
            ],
          },
          {
            number: "05",
            minutes: "15 min",
            title: [head(5, "Dental Plan")],
            body: [
              para(
                "Dr. Quan or Dr. Hopkins will review their findings of the exam. If any long term dental is needed he will present the options you have and relative timelines and priorities. Answering any questions you may have so you are empowered to take control of your own long-term dental health.",
              ),
            ],
          },
          {
            number: "06",
            minutes: "05 min",
            title: [head(5, "Check out")],
            body: [
              para(
                "You then have a chance to schedule any future visits and take care of any cost questions about future work.",
              ),
            ],
          },
        ],
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
        // Live opener: `.hero.redondo` band reading just "Meet" (white slab),
        // then a `.our-team-subtitle-section` below the wave with two stacked
        // dark-teal slab headings ("Our" / "Team") over a cyan slab intro.
        slice_type: "hero",
        variation: "subpage",
        primary: {
          heading: [head(2, "Meet")],
          background_image: img(IMG.heroRedondo),
          // Live styles THIS band's heading with `.meet-heading`, not
          // `.subpage-hero-heading` — centred and full-width at every width
          // (no media override), bottom .75rem. The subpage class instead goes
          // left/80% below 992, which put "Meet" hard against the left edge.
          heading_style: "meet",
          // `.hero.redondo` -> background-position: 0 100%
          image_position: "left-bottom",
          // Two heading2 blocks (not a raw string array) so the below-wave
          // "Our"/"Team" slab lines round-trip through Prismic — Hero/index
          // maps the blocks back to strings for SubpageHero.
          subheadings: [head(2, "Our"), head(2, "Team")],
          intro: [
            para(
              "We love caring for our patients and we also love the beach, read a little about each of our team members and see their favorite beach beyond the South Bay.",
            ),
          ],
        },
        items: [],
      },
      {
        slice_type: "collection_list",
        variation: "people",
        primary: { heading: [], collection_type: "person", max_items: 100 },
        items: [],
      },
      ctaHero(img),
    ],

    services: [
      {
        slice_type: "hero",
        variation: "subpage",
        primary: {
          heading: [head(2, "Services")],
          background_image: img(IMG.heroRedondo),
          // `.hero.redondo` -> background-position: 0 100%
          image_position: "left-bottom",
          // /services is the ONE page whose hero markup carries NEITHER
          // gradient div — its whole hero is the section, the bot-wave and the
          // h2 (matching/spec/services-top.html). Every other subpage has both.
          hero_wash: false,
        },
        items: [],
      },
      {
        // A single grid slice renders all 4 category cards in live's 2-col
        // `.service-grid` (SliceZone can't grid sibling slices). `primary.intro`
        // is the centered cyan `.we-offer-section` line above the grid; each
        // `items[]` entry is one `.service-block` card.
        slice_type: "service_category_band",
        variation: "grid",
        primary: {
          intro: [
            para(
              "We offer a wide array of services in cosmetic, implant, and general dentistry. From present issues like discoloration, decay and misalignment to preventative measures for oral cancer and enamel loss- we have you covered.",
            ),
          ],
        },
        items: [
          {
            category_tag: "Cosmetic Dentistry",
            heading: [head(3, "Cosmetic Dentistry")],
            intro: [
              para(
                "Cosmetic dentistry focuses on improving the appearance of your smile. If discoloration, a need for whitening and brightening or veneer replacements are causing you to lack confidence in your smile, take a look at our options below.",
              ),
            ],
          },
          {
            category_tag: "Restore Your Smile",
            heading: [head(3, "Restore Your Smile")],
            intro: [
              para(
                "With solutions in implant dentistry, you no longer have to feel embarrassed by gaps and missing or dead teeth. Dental implants are the next best thing to your natural teeth, which makes them your best long-term, cost-effective solution. Talk to our team about the restorative options that are best for you.",
              ),
            ],
          },
          {
            category_tag: "General Dentistry",
            heading: [head(3, "General Dentistry")],
            intro: [
              para(
                "Regular check-ups and cleanings are necessary for the prevention, diagnosis, and treatment of conditions that affect your gums, teeth, and oral cavity. Making a plan for prevention is equally as important as treatment for larger issues and can save you thousands in more invasive treatments down the road.",
              ),
            ],
          },
          {
            category_tag: "Specialty Services",
            heading: [head(3, "Specialty Services")],
            intro: [
              para(
                "Take a look at our products that allow for quality at-home care in whitening, enamel-loss prevention, tooth sensitivity relief, and more! Including Invisalign, which is a series of virtually invisible aligners. Wire-free and bracket-free, you could have straight teeth within 12 months!",
              ),
            ],
          },
        ],
      },
      ctaHero(img),
    ],

    "ask-the-doctor": [
      {
        slice_type: "hero",
        variation: "subpage",
        primary: {
          heading: [head(2, "Ask the Doctor")],
          background_image: img(IMG.firstExam),
          // `.hero.ask-a-dentist` -> background-position: 50% 0
          image_position: "top",
        },
        items: [],
      },
      {
        // heading lives in the hero band above — the grid is just the cards
        // (live's /ask-the-doctor has no second "Ask the Doctor" heading).
        slice_type: "question_list",
        variation: "numbered",
        primary: { heading: [] },
        items: [],
      },
      ctaHero(img),
    ],
  };
}

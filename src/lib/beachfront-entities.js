// Authored entity content captured VERBATIM off beachfrontdentistry.com
// (matching/probe-content-capture2.mjs, 2026-08-05), machine-transcribed —
// no value here was typed or derived by hand.
//
// These are the four fields the Webflow import never brought across. They are
// real CMS content, so they are MODELLED on the custom types (person.teaser /
// person.order, news_article.summary / news_article.home_order,
// collection_item.link_label / collection_item.order) and the templates read
// them from the document. This file is the migration PAYLOAD — the one source
// of truth shared by:
//   • scripts/seed-entity-content.mjs — writes them into the Prismic Migration
//     release, so production serves them from the CMS after publish.
//   • src/routes/dev/match/[uid] — patches the same values onto the fetched
//     docs so the matching gates measure the post-publish render today.
// Once the release is published the dev patch is a no-op (it only fills fields
// that arrive empty) and can be deleted.
//
// Each entry is literally the field patch for that document, keyed by uid.

/** /our-team + the your-first-visit slider card teaser, and live's editorial
 *  roster order (the two doctors first, then staff in a hand-set sequence).
 *  The teaser is NOT derivable from `body`: 9 of 11 are a prefix of the bio
 *  but every cut point is different, and 2 do not match the bio at all. */
export const PERSON_CONTENT = {
  "dr-robert-quan": {
    teaser:
      "Dr Robert Quan was born and raised in the Central Valley in Fresno, CA. He...",
    order: 1,
  },
  "dr-michael-hopkins": {
    teaser:
      "Dr. Michael Hopkins grew up locally in the South Bay, where he graduated from Palos Verdes...",
    order: 2,
  },
  stacey: {
    teaser:
      "Stacey joined our dental team as a Dental Hygienist in 2020. We are excited...",
    order: 3,
  },
  enrique: {
    teaser:
      "Enrique joined our dental team as a Dental Assistant in 2021. We...",
    order: 4,
  },
  alicia: {
    teaser:
      "Alicia has been a part of our dental team as a Dental Hygienist since 2010. She was...",
    order: 5,
  },
  linda: {
    teaser:
      "Linda has been a Registered Dental Assistant for over 25 years after graduating from SCROC in 1991...",
    order: 6,
  },
  michelle: {
    teaser:
      "Michelle has been a Registered Dental Assistant for over 25 years after graduating from SROC...",
    order: 7,
  },
  christina: {
    teaser:
      "Christina joined our dental team as a Registered Dental Hygienist in December 2016. Christina...",
    order: 8,
  },
  sabrina: {
    teaser:
      "Sabrina joined our dental team as a Registered Dental Hygienist in 2017. Sabrina was born...",
    order: 9,
  },
  raquel: {
    teaser:
      "Raquel has been part of our team since 2017 as our Hygiene Coordinator. She...",
    order: 10,
  },
  lanette: {
    teaser:
      "Lanette joined our dental team as a Dental Hygienist in 2021. We are excited to have her...",
    order: 11,
  },
};

/** Ask-the-Doctor card summary, plus the home page's featured-question row.
 *  `home_order` is filled on exactly the 6 questions live features on the
 *  home page (1 = the un-numbered hero card); null everywhere else. The card
 *  NUMBER is not stored — it is the doc's 1-based position in the date-sorted
 *  catalog, which reproduces live's 01-40 exactly (verified all 40).
 *  18 of the 40 summaries are not a prefix of `body`, so they are authored. */
export const NEWS_ARTICLE_CONTENT = {
  "regular-dental-cleanings-support-your-whole-body-health": {
    meta_title: "Beyond the Smile: Supporting Whole-Body Health",
    summary:
      "Routine cleanings aren’t just about keeping your smile bright—they’re a powerful tool for protecting your entire body",
    home_order: 1,
  },
  "why-are-my-gums-turning-yellow": {
    summary:
      "Gum discoloration is a serious issue that may indicate a number of health problems. One of the main reasons you may notice a yellow coating developing along your gum line is gingivitis...",
  },
  "my-tooth-keeps-bleeding-what-is-causing-it": {
    summary:
      "Bleeding in the mouth is never normal. Bleeding around a single tooth may be an indication of dental trauma. In some cases...",
  },
  "transparent-tooth": {
    summary:
      "As you age, our tooth enamel can wear away through normal wear and tear. When this happens, it can make the teeth appear transparent. While...",
  },
  "choosing-the-right-toothbrush": {
    summary:
      "From manual to electric, from abrasive to soft, there are lots of options to sift through, choosing the right one can be overwhelming",
  },
  "tooth-pain-wont-go-away": {
    summary:
      "Pain in the tooth is a very common dental problem that may be related to a number of causes. Most toothaches are caused by tooth decay...",
  },
  "best-routine-for-my-dental-health": {
    summary:
      "This simple and effective daily routine will keep your smile healthy and bright between visits.",
    home_order: 2,
  },
  "gums-hurt-with-brushing": {
    summary:
      'People often ask "Why do my gums hurt when I brush? Pain in the gums is one of the most common complaints we hear from patients when they come in. Pain is...',
  },
  "do-teeth-turn-yellow-as-you-age": {
    summary:
      'Tooth discoloration and "Do Teeth Turn Yellow As You Age?" is one of the most common patient concerns/questions that we hear each day. There are a number of reasons why your teeth may...',
    home_order: 3,
  },
  "what-surprising-foods-optimize-my-dental-health": {
    meta_title: "Surprising Foods That Boost Dental Health",
    summary:
      "People overlook the powerful role that diet plays in your dental health",
  },
  "flossing-and-heart-disease": {
    summary:
      "Can flossing prevent heart disease? It's not scientifically proven yet whether or not taking care of your oral health can prevent...",
  },
  "jaw-pain": {
    summary:
      "At some point, we experience stiffness in our jaw. In America, it is reported that there are 10 million Americans who are suffering from jaw stiffness and jaw problems. The good thing is...",
  },
  "how-can-i-care-for-my-sensitive-teeth": {
    summary:
      "Are you plagued, like most, by this common dental issue? Good news, it's manageable!",
  },
  "healthy-teeth": {
    summary:
      "You don't have to worry about your teeth's health if you follow excellent oral hygiene. Even if you have a dental bridge, your overall dental health will be in good condition as long as...",
  },
  "dental-veneers": {
    summary:
      "Dental veneers are becoming more and more popular dental treatment option. But not all patients are ideal candidates...",
  },
  "creating-perfect-smiles-artistry-or-science": {
    summary:
      "We’re often asked: Is cosmetic dentistry more of an art or a science? Our answer? It’s both—beautifully intertwined.",
    home_order: 4,
  },
  "tooth-decay-and-bad-breath": {
    summary:
      "Bacteria found in our teeth and gums can cause bad breath. Bacteria in the mouth harbors in areas where tooth brushing can't eliminate them. You're more likely to suffer from halitosis if...",
  },
  "brushing-mistakes": {
    meta_title: "Common Tooth-Brushing Mistakes",
    summary:
      "To maintain a healthy smile, you need to have an oral health care regime. Let's look at some of the most common mistakes people make when brushing their teeth...",
  },
  "cracked-root-canal": {
    summary:
      "Some patients of Michael Z. Hopkins ask him why their tooth cracked after a root canal. If it happens to you, you may be suffering from a cracked tooth syndrome...",
  },
  "bad-breath-cures": {
    summary:
      "Bad breath or halitosis can be embarrassing. Though not a medical emergency, it can cause distress. To determine the best cures for chronic bad breath, you will need...",
  },
  "escaped-dental-bridges": {
    summary:
      'Recently, one of our patients asked: "Why does my dental bridge keep falling off?" We answered that there could be plenty of reasons it falls off...',
  },
  "teeth-whitening-explanation": {
    summary:
      "Americans spend billions of dollars for teeth whitening products and services. At Dentistry Redondo Beach office, tooth whitening is a common cosmetic service. In a pharmacy...",
  },
  "teeth-grinding": {
    summary:
      "\"I keep grinding my teeth during the day that's why I have a tight jaw or sore facial muscles in the morning. Is this normal?\" No, teeth grinding isn't normal...",
  },
  "temporary-crown": {
    summary:
      "A permanent dental crown takes time to make because of the long-lasting material that has to be crafted specifically for your mouth in a dental lab...",
  },
  "flossing-and-toothaches": {
    summary:
      "Every once in a while you may find a remaining sliver of popcorn kernel wedged in your gums. Sharp and painful, it digs close to the nerves leading to your tooth...",
  },
  "is-it-time-to-change-your-toothbrush": {
    summary:
      "How can I forget the last dental emergency I rushed to my dentist with? Only when I started spitting blood with toothpaste foam twice a week, I realized...",
  },
  "how-long-will-veneers-last": {
    summary:
      "The short answer is that it can last a long time, as long as they're properly done. Porcelain veneers are like cars...",
  },
  "resolutions-that-help-your-dental-health": {
    meta_title: "New Year’s Resolutions for Dental Health",
    summary:
      "Your New Year’s resolutions can do more than boost your overall health—they can transform your dental health, too. Don’t miss these resolutions that pack a big punch for your oral hygiene!",
  },
  "loose-tooth": {
    summary:
      "Having a loose tooth is an uncomfortable sensation, particularly when you're brushing your teeth or eating. This sensation...",
  },
  "tooth-broke-off": {
    summary:
      "If your tooth broke off, it is a serious dental problem, whether or not it hurts. The lack of pain implies that you have only a minor break; however, even these sorts of tooth injuries...",
    home_order: 5,
  },
  "my-tooth-hurts-really-bad": {
    summary:
      "Toothaches are never fun. It can be scary, especially if you don't know what is causing the pain or soreness...",
  },
  "do-apples-yellow-teeth": {
    summary:
      'Unfortunately, the answer to the question "do apples yellow teeth" is yes. But it\'s not only apples that could yellow your teeth...',
  },
  "why-does-my-tooth-hurt-when-i-bite-down": {
    summary:
      "Pain when biting down can signal a cracked tooth, cavity, or infection. Learn common causes, what helps, and when dental care is needed.",
    home_order: 6,
  },
  "is-it-normal-for-gums-to-bleed-when-brushing": {
    summary:
      "Bleeding gums are often an early sign of gum disease, not normal brushing. Learn why gums bleed and how to restore healthy gums.",
  },
  "sharp-tooth-pain-with-cold-drinks-causes-fixes": {
    meta_title: "Tooth Pain With Cold Drinks: Causes and Fixes",
    summary:
      "Sudden pain from cold drinks is often tooth sensitivity, but sometimes signals decay or cracks. Learn causes and proven ways to reduce pain.",
  },
  "how-to-stop-a-toothache-fast": {
    meta_title: "How to Stop a Toothache Fast",
    summary:
      "Need toothache relief now? Learn dentist-recommended ways to reduce pain safely while waiting for treatment.",
  },
  "tooth-sensitivity-or-a-cavity-key-differences": {
    meta_title: "Tooth Sensitivity or a Cavity?",
    summary:
      "Not sure if your tooth pain is sensitivity or a cavity? Learn the symptoms, differences, and when dental care is necessary.",
  },
  "tooth-infection-symptoms-warning-signs-you-shouldnt-ignore": {
    summary:
      "Tooth infections can become serious if untreated. Learn early symptoms, warning signs, and when urgent dental care is needed.",
  },
  "when-tooth-pain-is-a-dental-emergency": {
    meta_title: "Is Tooth Pain an Emergency? Warning Signs",
    summary:
      "Some tooth pain can wait — others cannot. Learn the symptoms that require same-day dental treatment.",
  },
  "why-do-teeth-hurt-more-at-night": {
    summary:
      "Tooth pain that spikes at bedtime usually comes down to a few things. We explains why, and how to get through the night.",
  },
};

/** The /services category panels. `link_label` is a SEPARATE authored label
 *  from `title`: live's panel prints "dental veneers" while the detail page
 *  h2 prints "Dental Veneers" (both verified with text-transform:none), and
 *  three labels differ outright ("oral cancer screening", "Mi paste / Mi Paste
 *  plus", "Nitrous oxide (n2O)"). `order` is the position within the panel —
 *  Prismic's default document order matches live in none of the 4 panels. */
export const COLLECTION_ITEM_CONTENT = {
  // Cosmetic Dentistry
  "tooth-discoloration": {
    link_label: "Tooth discoloration",
    order: 1,
  },
  // Cosmetic Dentistry
  "dental-veneers": {
    link_label: "dental veneers",
    order: 2,
  },
  // Cosmetic Dentistry
  "teeth-whitening": {
    link_label: "teeth whitening",
    order: 3,
  },
  // Cosmetic Dentistry
  "smile-makeovers": {
    link_label: "smile makeovers",
    order: 4,
  },
  // Restore Your Smile
  "cerec-crowns": {
    link_label: "Cerec crowns",
    order: 1,
  },
  // Restore Your Smile
  "dental-implants": {
    link_label: "dental implants",
    order: 2,
  },
  // Restore Your Smile
  "full-reconstruction": {
    link_label: "full reconstruction",
    order: 3,
  },
  // Restore Your Smile
  "porcelain-inlays": {
    link_label: "porcelain inlays",
    order: 4,
  },
  // Restore Your Smile
  "porcelain-veneers": {
    link_label: "porcelain veneers",
    order: 5,
  },
  // Restore Your Smile
  "dental-bonding": {
    link_label: "dental bonding",
    order: 6,
  },
  // Restore Your Smile
  "dental-bridges": {
    link_label: "dental bridges",
    order: 7,
  },
  // Restore Your Smile
  "dental-crowns": {
    link_label: "dental crowns",
    order: 8,
  },
  // Restore Your Smile
  "porcelain-onlays": {
    link_label: "porcelain onlays",
    order: 9,
  },
  // General Dentistry
  "dental-cleanings": {
    link_label: "Dental cleanings",
    order: 1,
  },
  // General Dentistry
  "deep-cleanings": {
    link_label: "deep cleanings",
    order: 2,
  },
  // General Dentistry
  "laser-dentistry": {
    link_label: "laser dentistry",
    order: 3,
  },
  // General Dentistry
  "oral-cancer-dentistry": {
    link_label: "oral cancer screening",
    order: 4,
  },
  // General Dentistry
  "dental-exams": {
    link_label: "Dental exams",
    order: 5,
  },
  // General Dentistry
  "composite-fillings": {
    link_label: "composite fillings",
    order: 6,
  },
  // Specialty Services
  invisalign: {
    link_label: "Invisalign",
    order: 1,
  },
  // Specialty Services
  "talon-nightguards": {
    link_label: "Talon nightguards",
    order: 2,
  },
  // Specialty Services
  oraverse: {
    link_label: "oraverse",
    order: 3,
  },
  // Specialty Services
  "mi-paste": {
    link_label: "Mi paste / Mi Paste plus",
    order: 4,
  },
  // Specialty Services
  "nitrous-oxide": {
    link_label: "Nitrous oxide (n2O)",
    order: 5,
  },
};

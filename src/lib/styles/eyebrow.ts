// The site's uppercase slab eyebrow: museo-slab medium (500), 1.28px
// tracking, slate #365b6d (7.0:1 on white), 12px/15 below lg and 24px/30 from
// lg. It is the homepage's "Meet Your Team" heading (CollectionList), read off
// live's h6 combo, and since 2026-11-23 also the Ask the Doctor article crumb
// above the title (Tim's Figma, "I used a heading style from the home page").
// One string, so the two cannot drift apart; spacing stays with each caller.
export const EYEBROW =
  "font-slab text-[12px] leading-[15px] font-medium tracking-[1.28px] text-[#365b6d] uppercase lg:text-[24px] lg:leading-[30px]";

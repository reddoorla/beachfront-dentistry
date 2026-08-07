// Quick reachability + identity check for the local candidate.
const urls = [
  "http://localhost:5173/",
  "http://localhost:5173/dev/match/our-team",
  "http://localhost:5173/dev/match/services",
  "http://localhost:5173/dev/match/your-first-visit",
  "http://localhost:5173/dev/match/ask-the-doctor",
  "http://localhost:5173/contact-us",
];
for (const u of urls) {
  try {
    const r = await fetch(u);
    const t = await r.text();
    const title = (t.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    const hits = (t.match(/beachfront/gi) || []).length;
    console.log(
      `${r.status}  beachfront×${hits}  "${title.slice(0, 40)}"  ${u}`,
    );
  } catch (e) {
    console.log(`ERR ${e.message} ${u}`);
  }
}

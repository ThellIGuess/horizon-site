/*
  Builds data/games.json at deploy time (runs on GitHub's servers, not in visitors' browsers).
  Roblox APIs work fine server-to-server, so the live site never depends on a public CORS proxy.
  The game list is read from main.js (the GAMES array) so there is one source of truth.
*/
import { readFile, writeFile, mkdir } from "node:fs/promises";

const HEADERS = { Accept: "application/json", "Accept-Language": "en-US" };

async function getJson(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return res.json();
    if (attempt === tries) throw new Error(`${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

const mainJs = await readFile(new URL("../main.js", import.meta.url), "utf8");
const block = mainJs.slice(mainJs.indexOf("const GAMES = ["), mainJs.indexOf("];", mainJs.indexOf("const GAMES = [")));
const games = [...block.matchAll(/placeId:\s*"(\d+)"[\s\S]*?fallbackName:\s*"([^"]*)"[\s\S]*?url:\s*"([^"]*)"/g)]
  .map(([, placeId, fallbackName, url]) => ({ placeId, fallbackName, url }));

if (!games.length) throw new Error("No games found in main.js");

for (const game of games) {
  const data = await getJson(`https://apis.roblox.com/universes/v1/places/${game.placeId}/universe`);
  game.universeId = String(data.universeId);
}

const ids = games.map((g) => g.universeId).join(",");
const [info, thumbs] = await Promise.all([
  getJson(`https://games.roblox.com/v1/games?universeIds=${ids}`),
  getJson(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${ids}&countPerUniverse=4&defaults=true&size=768x432&format=Png&isCircular=false`)
]);

const infoById = new Map((info.data || []).map((g) => [String(g.id), g]));
const thumbsById = new Map(
  (thumbs.data || []).map((t) => [
    String(t.universeId),
    (t.thumbnails || []).filter((x) => x.state === "Completed" && x.imageUrl).map((x) => x.imageUrl)
  ])
);

const out = {
  updatedAt: new Date().toISOString(),
  games: games.map((g) => {
    const i = infoById.get(g.universeId) || {};
    return {
      placeId: g.placeId,
      universeId: g.universeId,
      info: {
        name: i.name,
        sourceName: i.sourceName,
        description: i.description,
        sourceDescription: i.sourceDescription,
        visits: i.visits,
        playing: i.playing,
        favoritedCount: i.favoritedCount,
        genre: i.genre
      },
      thumbnails: thumbsById.get(g.universeId) || []
    };
  })
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/games.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(`Wrote ${out.games.length} games:`, out.games.map((g) => `${g.info.name} (${g.info.visits} visits, ${g.thumbnails.length} thumbs)`).join(" | "));

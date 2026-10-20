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


/* ---------- Resume contributions (games + Discord servers) ---------- */
try {
  const contrib = JSON.parse(await readFile(new URL("../contributions.json", import.meta.url), "utf8"));
  const cGames = contrib.games || [];

  for (const game of cGames) {
    const data = await getJson(`https://apis.roblox.com/universes/v1/places/${game.placeId}/universe`);
    game.universeId = String(data.universeId);
  }

  let cInfo = new Map();
  let cThumbs = new Map();
  if (cGames.length) {
    const cIds = cGames.map((g) => g.universeId).join(",");
    const [gi, gt] = await Promise.all([
      getJson(`https://games.roblox.com/v1/games?universeIds=${cIds}`),
      getJson(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${cIds}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`)
    ]);
    cInfo = new Map((gi.data || []).map((g) => [String(g.id), g]));
    cThumbs = new Map((gt.data || []).map((t) => [String(t.universeId), t.thumbnails?.[0]?.imageUrl || null]));
  }

  const discords = [];
  for (const code of contrib.discords || []) {
    try {
      const inv = await getJson(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`);
      const g = inv.guild || {};
      discords.push({
        code,
        name: g.name || null,
        icon: g.id && g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null,
        members: inv.approximate_member_count ?? null,
        online: inv.approximate_presence_count ?? null
      });
    } catch (error) {
      console.warn(`Discord invite ${code} failed:`, error.message);
      discords.push({ code, name: null, icon: null, members: null, online: null });
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  const contribOut = {
    updatedAt: new Date().toISOString(),
    games: cGames.map((g) => {
      const i = cInfo.get(g.universeId) || {};
      return {
        placeId: g.placeId,
        url: g.url,
        fallbackName: g.fallbackName,
        name: i.sourceName || i.name || null,
        visits: i.visits ?? null,
        playing: i.playing ?? null,
        favoritedCount: i.favoritedCount ?? null,
        thumbnail: cThumbs.get(g.universeId) || null
      };
    }),
    discords
  };

  await writeFile(new URL("../data/contributions.json", import.meta.url), JSON.stringify(contribOut, null, 2));
  console.log("Wrote contributions:", contribOut.games.map((g) => g.name).join(", "), "|", discords.map((d) => `${d.name} (${d.members})`).join(", "));
} catch (error) {
  console.warn("Contributions snapshot failed:", error.message);
}

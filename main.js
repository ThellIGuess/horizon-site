"use strict";

/* =========================================================
   HORIZON PRODUCTIONS — MAIN.JS
========================================================= */

const HUB_INVITE = "https://discord.gg/XdaetbyZF7";

/* =========================================================
   ROBLOX PORTFOLIO
========================================================= */

const GAMES = [
  {
    placeId: "140472728510165",
    fallbackName: "Anime Ultra X",
    url: "https://www.roblox.com/games/140472728510165/Anime-Ultra-X"
  },
  {
    placeId: "89199115862748",
    fallbackName: "Launch Rocket for Brainrots",
    url: "https://www.roblox.com/games/89199115862748/Launch-Rocket-for-Brainrots"
  },
  {
    placeId: "127519525950247",
    fallbackName: "Manhwa Legends",
    url: "https://www.roblox.com/games/127519525950247/Manhwa-Legends"
  },
  {
    placeId: "16347800591",
    fallbackName: "Anime Royale",
    url: "https://www.roblox.com/games/16347800591/Anime-Royale"
  }
];

/* =========================================================
   JOB LISTINGS
========================================================= */

const JOBS = [
  {
    id: "game-designer",
    title: "Game Designer",
    department: "Design",
    type: "Project-based",
    location: "Remote",
    summary:
      "Design progression, gameplay systems, loops, economies, and player-facing content for upcoming Horizon projects."
  },
  {
    id: "roblox-engineer",
    title: "Roblox Engineer",
    department: "Engineering",
    type: "Project-based",
    location: "Remote",
    summary:
      "Build reliable gameplay systems, tools, interfaces, and production-ready Roblox infrastructure."
  },
  {
    id: "vfx-artist",
    title: "VFX Artist",
    department: "Art",
    type: "Project-based",
    location: "Remote",
    summary:
      "Create readable, performant combat and environmental VFX that support each project's visual identity."
  },
  {
    id: "animator",
    title: "Animator",
    department: "Animation",
    type: "Project-based",
    location: "Remote",
    summary:
      "Produce character, combat, and gameplay animation with strong posing, timing, and implementation awareness."
  },
  {
    id: "modeler",
    title: "3D Modeler",
    department: "3D",
    type: "Project-based",
    location: "Remote",
    summary:
      "Create optimized props, environments, and gameplay assets matching established project art direction."
  },
  {
    id: "ui-artist",
    title: "UI Artist",
    department: "UI/UX",
    type: "Project-based",
    location: "Remote",
    summary:
      "Design polished interfaces with strong hierarchy, readability, and a premium visual finish."
  }
];

/* =========================================================
   BACKGROUND POINTER INTERACTION
========================================================= */

let pointerFrame = 0;

document.addEventListener(
  "pointermove",
  (event) => {
    cancelAnimationFrame(pointerFrame);

    pointerFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty(
        "--mouse-x",
        `${event.clientX}px`
      );

      document.documentElement.style.setProperty(
        "--mouse-y",
        `${event.clientY}px`
      );
    });
  },
  { passive: true }
);

/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton = document.getElementById("menuButton");
const menuClose = document.getElementById("menuClose");
const mobileMenu = document.getElementById("mobileMenu");

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;

  mobileMenu.classList.toggle("open", open);
  mobileMenu.setAttribute("aria-hidden", String(!open));
  menuButton.setAttribute("aria-expanded", String(open));

  document.body.classList.toggle("menu-open", open);
  lockScroll(open);
}

menuButton?.addEventListener("click", () => {
  setMenu(!mobileMenu.classList.contains("open"));
});

menuClose?.addEventListener("click", () => {
  setMenu(false);
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target === mobileMenu) {
    setMenu(false);
  }
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setMenu(false);
  });
});

/* =========================================================
   MOTION ENGINE
   Smooth scroll (Lenis), preloader, header hide-on-scroll,
   word-by-word heading reveals, 3D "tilt-in" cards and the
   scroll-driven flagship expand on the home page.
========================================================= */

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.classList.add("js");

/* ---------- Smooth scrolling ---------- */

let lenis = null;

if (!REDUCED_MOTION && typeof window.Lenis === "function") {
  try {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    /* in-page anchors glide too */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        const target = id && id.length > 1 ? document.querySelector(id) : null;
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      });
    });
  } catch (error) {
    console.warn("Smooth scroll unavailable:", error);
    lenis = null;
  }
}

function lockScroll(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

/* ---------- Preloader (home only) ---------- */

const preloader = document.getElementById("preloader");

function finishPreloader() {
  document.body.classList.add("is-loaded");
  if (preloader) {
    preloader.classList.add("done");
    setTimeout(() => preloader.remove(), 900);
  }
}

if (preloader) {
  let seen = false;
  try { seen = sessionStorage.getItem("hrzn-intro") === "1"; } catch (_) { /* storage blocked */ }
  try { sessionStorage.setItem("hrzn-intro", "1"); } catch (_) { /* storage blocked */ }

  const delay = seen || REDUCED_MOTION ? 150 : 1100;
  window.addEventListener("load", () => setTimeout(finishPreloader, delay), { once: true });
  setTimeout(finishPreloader, 3000); // never block the page
} else {
  requestAnimationFrame(() => document.body.classList.add("is-loaded"));
}

/* ---------- Header: solid after scroll, hides on scroll down ---------- */

let lastY = window.scrollY;

function updateHeader() {
  const y = window.scrollY;
  document.body.classList.toggle("scrolled", y > 24);
  const menuOpen = document.body.classList.contains("menu-open");
  if (!menuOpen) {
    document.body.classList.toggle("header-hidden", y > 400 && y > lastY + 2);
    if (y < lastY - 2) document.body.classList.remove("header-hidden");
  }
  lastY = y;
}

/* ---------- Word-by-word heading reveal ---------- */

function splitWords(element) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const mask = document.createElement("span");
          mask.className = "w";
          const inner = document.createElement("span");
          inner.className = "wi";
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.classList.contains("gradient-text") || child.tagName === "BR") {
          /* keep gradients intact: reveal the whole span as one unit */
          const mask = document.createElement("span");
          mask.className = "w";
          child.replaceWith(mask);
          child.classList.add("wi");
          mask.appendChild(child);
        } else {
          walk(child);
        }
      }
    });
  };

  walk(element);
  element.querySelectorAll(".wi").forEach((word, index) => {
    word.style.setProperty("--wd", `${Math.min(index * 0.045, 0.6)}s`);
  });
  element.classList.add("split");
}

if (!REDUCED_MOTION) {
  document
    .querySelectorAll(
      "main h1:not(.hero-title), .section-center h2, .section-head h2, .studio-copy h2, " +
      ".hub-copy h2, .games-toolbar h2, .portfolio-note h2, .jobs-process h2, .contact-secondary h2, .job-toolbar h2"
    )
    .forEach((heading) => {
      heading.classList.remove("reveal");
      heading.closest(".reveal")?.classList.remove("reveal");
      splitWords(heading);
    });
}

/* ---------- Reveal on enter ---------- */

const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px" }
      )
    : null;

function observeReveals(scope = document) {
  scope.querySelectorAll(".reveal:not(.active), .split:not(.active)").forEach((el) => {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("active");
  });
}

observeReveals();

/* ---------- 3D tilt-in cards ---------- */

let tiltItems = [];

function collectTiltItems() {
  if (REDUCED_MOTION) return;
  tiltItems = [
    ...document.querySelectorAll(
      ".featured-game-grid > .portfolio-game, .games-page-grid > .portfolio-game, .team-page-grid > .person-card, .jobs-grid > .job-card"
    )
  ];
  tiltItems.forEach((el) => {
    el.classList.remove("reveal");
    el.classList.add("tilt");
  });
}

function updateTilt() {
  if (!tiltItems.length) return;
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  tiltItems.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > vh + 100) return;

    const cy = rect.top + rect.height / 2;
    const cx = rect.left + rect.width / 2;
    /* 0 when the card sits at 55% of the viewport, 1 when just entering */
    const enter = Math.min(Math.max((cy - vh * 0.68) / (vh * 0.45), 0), 1);
    const eased = enter * enter * (3 - 2 * enter);
    const side = Math.max(-1, Math.min(1, (cx - vw / 2) / (vw / 2)));

    el.style.setProperty("--rx", `${eased * 22}deg`);
    el.style.setProperty("--ry", `${-side * eased * 26}deg`);
    el.style.setProperty("--ty", `${eased * 90}px`);
    el.style.setProperty("--sc", `${1 - eased * 0.08}`);
    el.style.setProperty("--op", `${1 - eased * 0.55}`);
  });
}

/* ---------- Flagship expand (home) ---------- */

const flagshipSection = document.getElementById("flagship");
const flagshipFrame = document.getElementById("flagshipFrame");

function updateFlagship() {
  if (!flagshipSection || !flagshipFrame) return;
  if (REDUCED_MOTION) {
    flagshipFrame.style.setProperty("--p", "1");
    return;
  }
  const rect = flagshipSection.getBoundingClientRect();
  const travel = rect.height - window.innerHeight;
  const raw = travel > 0 ? -rect.top / travel : 1;
  const p = Math.min(Math.max(raw * 1.35, 0), 1);
  flagshipFrame.style.setProperty("--p", p.toFixed(4));
  flagshipFrame.classList.toggle("is-open", p > 0.82);
}

/* ---------- Hero parallax ---------- */

const heroInner = document.querySelector(".hero-x-inner");

function updateHero() {
  if (!heroInner || REDUCED_MOTION) return;
  const y = window.scrollY;
  if (y > window.innerHeight * 1.2) return;
  heroInner.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
  heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.75)));
}

/* ---------- One scroll loop for everything ---------- */

let ticking = false;

function onScrollFrame() {
  ticking = false;
  updateHeader();
  updateTilt();
  updateFlagship();
  updateHero();
}

function requestScrollFrame() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(onScrollFrame);
}

window.addEventListener("scroll", requestScrollFrame, { passive: true });
window.addEventListener("resize", requestScrollFrame);
lenis?.on("scroll", requestScrollFrame);

collectTiltItems();
requestScrollFrame();

/* Cards rendered later (games, jobs) join the motion system. */
document.addEventListener("horizon:games", () => {
  collectTiltItems();
  observeReveals();
  requestScrollFrame();
});

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-US", {
    notation: number >= 10000 ? "compact" : "standard",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(number);
}

async function fetchJson(url, timeout = 8000, extraHeaders = {}) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...extraHeaders
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =========================================================
   ROBLOX API HELPERS
========================================================= */

async function resolveUniverse(game) {
  const endpoints = [
    `https://apis.roproxy.com/universes/v1/places/${game.placeId}/universe`,
    `https://apis.roblox.com/universes/v1/places/${game.placeId}/universe`
  ];

  for (const endpoint of endpoints) {
    try {
      const data = await fetchJson(endpoint);

      if (data?.universeId) {
        return {
          ...game,
          universeId: String(data.universeId)
        };
      }
    } catch (error) {
      console.warn(
        `Universe lookup failed for ${game.fallbackName}:`,
        error
      );
    }
  }

  return {
    ...game,
    universeId: null
  };
}

async function fetchGameInfo(universeIds) {
  const endpoints = [
    `https://games.roproxy.com/v1/games?universeIds=${universeIds}`,
    `https://games.roblox.com/v1/games?universeIds=${universeIds}`
  ];

  for (const endpoint of endpoints) {
    try {
      /* ask for English so names are not auto-translated per visitor */
      return await fetchJson(endpoint, 8000, { "Accept-Language": "en-US" });
    } catch (error) {
      console.warn("Game metadata endpoint failed:", error);
    }
  }

  throw new Error("Unable to fetch Roblox game information.");
}

async function fetchGameThumbnails(universeIds) {
  /* Wide 16:9 game thumbnails first (what large studios showcase), square icons as fallback. */
  const wideEndpoints = [
    `https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=4&defaults=true&size=768x432&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=4&defaults=true&size=768x432&format=Png&isCircular=false`
  ];

  for (const endpoint of wideEndpoints) {
    try {
      const data = await fetchJson(endpoint);
      const map = new Map();

      (data?.data || []).forEach((entry) => {
        const urls = (entry?.thumbnails || [])
          .filter((thumb) => thumb?.state === "Completed" && thumb.imageUrl)
          .map((thumb) => thumb.imageUrl);
        if (urls.length) map.set(String(entry.universeId), urls);
      });

      if (map.size) return map;
    } catch (error) {
      console.warn("Wide thumbnail endpoint failed:", error);
    }
  }

  const iconEndpoints = [
    `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeIds}&size=512x512&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&size=512x512&format=Png&isCircular=false`
  ];

  for (const endpoint of iconEndpoints) {
    try {
      const data = await fetchJson(endpoint);
      return new Map(
        (data?.data || [])
          .filter((icon) => icon.imageUrl)
          .map((icon) => [String(icon.targetId), [icon.imageUrl]])
      );
    } catch (error) {
      console.warn("Icon endpoint failed:", error);
    }
  }

  return new Map();
}

/* =========================================================
   GAME CARD
========================================================= */

function gameName(game, info) {
  const raw = info?.sourceName || info?.name || "";
  /* drop update tags like "[MAINTENANCE]" or "[📊 TRADING]" and stray emoji */
  const clean = raw
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!clean || /unavailable/i.test(raw)) return game.fallbackName;
  return clean;
}

function gameDescription(info) {
  return (info?.sourceDescription || info?.description || "").trim() ||
    "A Horizon Productions Roblox experience.";
}

function buildGameCard(game, info, thumbnail, options = {}) {
  const name = gameName(game, info);

  const description = gameDescription(info);

  const hasStats = Boolean(info);
  const visits = Number(info?.visits) || 0;
  const playing = Number(info?.playing) || 0;
  const favorites = Number(info?.favoritedCount) || 0;
  const genre = info?.genre && info.genre !== "All" ? info.genre : "Roblox Experience";

  const thumbnailHtml = thumbnail
    ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(name)} thumbnail" loading="lazy" />`
    : `<div class="game-fallback-image"><span>${escapeHtml(name)}</span></div>`;

  const badge = hasStats
    ? `<span class="live-badge"><i></i>${formatNumber(playing)} playing</span>`
    : "";

  const flagship = options.flagship
    ? `<span class="flagship-badge">Flagship</span>`
    : "";

  return `
    <article class="portfolio-game${options.flagship ? " is-flagship" : ""}">
      <a class="game-thumb" href="${escapeHtml(game.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
        ${thumbnailHtml}
        ${flagship}
        ${badge}
      </a>

      <div class="game-copy">
        <span class="game-kicker">${escapeHtml(genre)}</span>
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(description)}</p>

        ${hasStats ? `
        <dl class="game-stats">
          <div><dt>Visits</dt><dd>${formatNumber(visits)}</dd></div>
          <div><dt>Online</dt><dd>${formatNumber(playing)}</dd></div>
          <div><dt>Favorites</dt><dd>${formatNumber(favorites)}</dd></div>
        </dl>` : ""}

        <a class="game-view" href="${escapeHtml(game.url)}" target="_blank" rel="noopener noreferrer">
          <span>Play on Roblox</span>
          <b aria-hidden="true">↗</b>
        </a>
      </div>
    </article>
  `;
}

/* =========================================================
   STAT COUNTERS
========================================================= */

function setStat(key, value, animate = true) {
  document.querySelectorAll(`[data-stat="${key}"]`).forEach((element) => {
    if (typeof value !== "number") {
      element.textContent = value;
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || reduce || value < 10) {
      element.textContent = formatNumber(value);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

/* =========================================================
   LOAD PORTFOLIO
========================================================= */

function renderHomeShowcase(entries) {
  /* entries are sorted by visits — entries[0] is the flagship */
  const flagship = entries[0];
  if (!flagship) return;

  const allThumbs = entries.flatMap((e) => e.thumbnails || []);
  const flagThumb = flagship.thumbnails?.[0] || null;
  const name = gameName(flagship.game, flagship.info);

  /* Hero pill + flagship expand section */
  const pillMedia = document.getElementById("heroPillMedia");
  if (pillMedia && flagThumb) {
    pillMedia.innerHTML = `<img src="${escapeHtml(flagThumb)}" alt="" />`;
  }

  const flagshipMedia = document.getElementById("flagshipMedia");
  if (flagshipMedia) {
    flagshipMedia.innerHTML = flagThumb
      ? `<img src="${escapeHtml(flagThumb)}" alt="${escapeHtml(name)}" />`
      : `<div class="game-fallback-image"><span>${escapeHtml(name)}</span></div>`;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("flagshipName", name);
  setText("flagshipDesc", gameDescription(flagship.info));

  if (flagship.info) {
    setText("flagshipVisits", formatNumber(flagship.info.visits));
    setText("flagshipPlaying", formatNumber(flagship.info.playing));
    setText("flagshipFavs", formatNumber(flagship.info.favoritedCount));
  }

  const link = document.getElementById("flagshipLink");
  if (link) link.href = flagship.game.url;

  /* Background collage of game art */
  const collage = document.getElementById("heroCollage");
  if (collage && allThumbs.length) {
    const pool = [];
    while (pool.length < 24) pool.push(...allThumbs);

    const columns = [0, 1, 2, 3, 4].map((col) => {
      const tiles = pool
        .slice(col * 4, col * 4 + 4)
        .map((src) => `<div class="collage-tile"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></div>`)
        .join("");
      /* duplicated for a seamless vertical loop */
      return `<div class="collage-col" style="--i:${col}">${tiles}${tiles}</div>`;
    });

    collage.innerHTML = columns.join("");
    requestAnimationFrame(() => collage.classList.add("ready"));
  }

  /* Big name marquee */
  const marquee = document.getElementById("nameMarquee");
  if (marquee) {
    const names = entries.map((e) => gameName(e.game, e.info));
    const run = names.map((n) => `<span>${escapeHtml(n)}</span><b>✦</b>`).join("");
    marquee.innerHTML = run + run;
  }
}

async function loadGamesData() {
  const featuredGrid = document.getElementById("featuredGameGrid");
  const gamesPageGrid = document.getElementById("gamesPageGrid");
  const hasStats = document.querySelector("[data-stat]");

  if (!featuredGrid && !gamesPageGrid && !hasStats) return;

  setStat("titles", GAMES.length, false);

  const renderFallback = () => {
    const cards = GAMES.map((game, index) => buildGameCard(game, null, null, { flagship: index === 0 }));
    if (featuredGrid) featuredGrid.innerHTML = cards.slice(0, 3).join("");
    if (gamesPageGrid) gamesPageGrid.innerHTML = cards.join("");
    renderHomeShowcase(GAMES.map((game) => ({ game, info: null, thumbnails: [] })));
    setStat("visits", "—");
    setStat("playing", "—");
    document.dispatchEvent(new CustomEvent("horizon:games"));
  };

  try {
    const resolvedGames = await Promise.all(GAMES.map(resolveUniverse));
    const validGames = resolvedGames.filter((game) => game.universeId !== null);

    if (!validGames.length) {
      throw new Error("No valid Roblox universe IDs were resolved.");
    }

    const universeIds = validGames.map((game) => game.universeId).join(",");

    const [gameData, thumbnailMap] = await Promise.all([
      fetchGameInfo(universeIds),
      fetchGameThumbnails(universeIds)
    ]);

    const gameMap = new Map(
      (gameData?.data || []).map((game) => [String(game.id), game])
    );

    const entries = resolvedGames.map((game) => {
      const id = game.universeId ? String(game.universeId) : null;
      const thumbnails = id ? thumbnailMap.get(id) || [] : [];
      return {
        game,
        info: id ? gameMap.get(id) || null : null,
        thumbnails,
        thumbnail: thumbnails[0] || null
      };
    });

    const totalVisits = entries.reduce((sum, e) => sum + (Number(e.info?.visits) || 0), 0);
    const totalPlaying = entries.reduce((sum, e) => sum + (Number(e.info?.playing) || 0), 0);

    /* Biggest title first: entries[0] is the flagship everywhere. */
    const byVisits = [...entries].sort(
      (a, b) => (Number(b.info?.visits) || 0) - (Number(a.info?.visits) || 0)
    );

    if (gamesPageGrid) {
      gamesPageGrid.innerHTML = byVisits
        .map((e, index) => buildGameCard(e.game, e.info, e.thumbnail, { flagship: index === 0 }))
        .join("");
    }

    if (featuredGrid) {
      /* Home: flagship first, then the two most-played of the rest. */
      const [flagship, ...rest] = byVisits;
      const hottest = rest.sort(
        (a, b) => (Number(b.info?.playing) || 0) - (Number(a.info?.playing) || 0)
      );

      featuredGrid.innerHTML = [flagship, ...hottest.slice(0, 2)]
        .map((e, index) => buildGameCard(e.game, e.info, e.thumbnail, { flagship: index === 0 }))
        .join("");
    }

    renderHomeShowcase(byVisits);

    setStat("visits", totalVisits);
    setStat("playing", totalPlaying);
    document.dispatchEvent(new CustomEvent("horizon:games"));
  } catch (error) {
    console.warn("Roblox portfolio failed to load:", error);
    renderFallback();
  }
}

loadGamesData();

/* =========================================================
   HOME — JOB PREVIEW
========================================================= */

const featuredJobs = document.getElementById("featuredJobs");

if (featuredJobs) {
  featuredJobs.innerHTML = JOBS.slice(0, 4)
    .map(
      (job) => `
        <a class="job-preview" href="/jobs?role=${encodeURIComponent(job.id)}">
          <div>
            <h3>${escapeHtml(job.title)}</h3>
            <p>${escapeHtml(job.department)} · ${escapeHtml(job.location)}</p>
          </div>
          <span class="job-pill">${escapeHtml(job.type)}</span>
          <span class="job-preview-cta">Apply <b aria-hidden="true">↗</b></span>
        </a>
      `
    )
    .join("");
}

/* =========================================================
   JOB FILTERING
========================================================= */

const jobsGrid =
  document.getElementById("jobsGrid");

const jobFilters =
  document.getElementById("jobFilters");

const jobCount =
  document.getElementById("jobCount");

const emptyJobs =
  document.getElementById("emptyJobs");

let activeDepartment = "All";

function renderJobFilters() {
  if (!jobFilters) return;

  const departments = [
    "All",
    ...new Set(
      JOBS.map(
        (job) => job.department
      )
    )
  ];

  jobFilters.innerHTML =
    departments
      .map((department) => {
        const active =
          department === activeDepartment;

        return `
          <button
            type="button"
            class="filter-button ${active ? "active" : ""}"
            data-filter="${escapeHtml(department)}"
          >
            ${escapeHtml(department)}
          </button>
        `;
      })
      .join("");

  jobFilters
    .querySelectorAll("[data-filter]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          activeDepartment =
            button.dataset.filter ||
            "All";

          renderJobFilters();
          renderJobs();
        }
      );
    });
}

function renderJobs() {
  if (!jobsGrid) return;

  const filteredJobs =
    activeDepartment === "All"
      ? JOBS
      : JOBS.filter(
          (job) =>
            job.department ===
            activeDepartment
        );

  if (jobCount) {
    jobCount.textContent =
      `${filteredJobs.length} open ` +
      `${filteredJobs.length === 1 ? "role" : "roles"}`;
  }

  if (emptyJobs) {
    emptyJobs.hidden =
      filteredJobs.length !== 0;
  }

  jobsGrid.innerHTML =
    filteredJobs
      .map(
        (job) => `
          <article class="job-card">

            <div class="job-card-top">

              <div>

                <span class="department">
                  ${escapeHtml(job.department)}
                </span>

                <h3>
                  ${escapeHtml(job.title)}
                </h3>

              </div>

              <span class="job-pill">
                ${escapeHtml(job.type)}
              </span>

            </div>

            <p>
              ${escapeHtml(job.summary)}
            </p>

            <div class="job-card-footer">

              <div class="job-meta">

                <span class="job-pill">
                  ${escapeHtml(job.location)}
                </span>

              </div>

              <button
                type="button"
                class="apply-button"
                data-apply="${escapeHtml(job.id)}"
              >
                Apply ↗
              </button>

            </div>

          </article>
        `
      )
      .join("");

  jobsGrid
    .querySelectorAll("[data-apply]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          openJobModal(
            button.dataset.apply
          );
        }
      );
    });

  document.dispatchEvent(new CustomEvent("horizon:games"));
}

renderJobFilters();
renderJobs();

/* =========================================================
   JOB APPLICATION MODAL
========================================================= */

const jobModal =
  document.getElementById("jobModal");

const hubConfirmed =
  document.getElementById("hubConfirmed");

const applicationForm =
  document.getElementById(
    "jobApplicationForm"
  );

const applicationFeedback =
  document.getElementById(
    "applicationFeedback"
  );

function showApplicationFeedback(
  message,
  type
) {
  if (!applicationFeedback) return;

  applicationFeedback.textContent =
    message;

  applicationFeedback.className =
    `form-feedback visible ${type}`;
}

function openJobModal(jobId) {
  if (!jobModal) return;

  const job =
    JOBS.find(
      (item) =>
        item.id === jobId
    );

  if (!job) return;

  const title =
    document.getElementById(
      "applicationTitle"
    );

  const department =
    document.getElementById(
      "applicationDepartment"
    );

  const type =
    document.getElementById(
      "applicationType"
    );

  const intro =
    document.getElementById(
      "applicationIntro"
    );

  const roleInput =
    document.getElementById(
      "jobRole"
    );

  if (title) {
    title.textContent =
      `Apply — ${job.title}`;
  }

  if (department) {
    department.textContent =
      job.department;
  }

  if (type) {
    type.textContent =
      `${job.type} · ${job.location}`;
  }

  if (intro) {
    intro.textContent =
      job.summary;
  }

  if (roleInput) {
    roleInput.value =
      job.title;
  }

  if (hubConfirmed) {
    hubConfirmed.checked =
      false;
  }

  if (applicationForm) {
    applicationForm.hidden =
      true;
  }

  if (applicationFeedback) {
    applicationFeedback.textContent =
      "";

    applicationFeedback.className =
      "form-feedback";
  }

  jobModal.classList.add("open");

  jobModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
  lockScroll(true);
}

function closeJobModal() {
  if (!jobModal) return;

  jobModal.classList.remove("open");

  jobModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );
  lockScroll(false);
}

jobModal
  ?.querySelectorAll(
    "[data-close-modal]"
  )
  .forEach((element) => {
    element.addEventListener(
      "click",
      closeJobModal
    );
  });

hubConfirmed?.addEventListener(
  "change",
  () => {
    if (!applicationForm) return;

    applicationForm.hidden =
      !hubConfirmed.checked;
  }
);

applicationForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!hubConfirmed?.checked) {
      showApplicationFeedback(
        "Join Horizon Hub before continuing.",
        "error"
      );

      return;
    }

    const role =
      document
        .getElementById("jobRole")
        ?.value.trim() || "";

    const discord =
      document
        .getElementById("appDiscord")
        ?.value.trim() || "";

    const roblox =
      document
        .getElementById("appRoblox")
        ?.value.trim() || "";

    const portfolio =
      document
        .getElementById("appPortfolio")
        ?.value.trim() || "";

    const experience =
      document
        .getElementById("appExperience")
        ?.value.trim() || "";

    const why =
      document
        .getElementById("appWhy")
        ?.value.trim() || "";

    const availability =
      document
        .getElementById("appAvailability")
        ?.value.trim() || "";

    if (
      !role ||
      !discord ||
      !roblox ||
      !portfolio ||
      !experience ||
      !why ||
      !availability
    ) {
      showApplicationFeedback(
        "Complete every field before preparing your application.",
        "error"
      );

      return;
    }

    const application = [
      "HORIZON PRODUCTIONS — JOB APPLICATION",
      "",
      `Role: ${role}`,
      `Discord: ${discord}`,
      `Roblox: ${roblox}`,
      `Portfolio: ${portfolio}`,
      `Availability: ${availability}`,
      "",
      "RELEVANT EXPERIENCE",
      experience,
      "",
      "WHY HORIZON",
      why
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        application
      );

      showApplicationFeedback(
        "Application copied. Continue in Horizon Hub and paste it into the recruitment flow.",
        "success"
      );
    } catch (error) {
      showApplicationFeedback(
        "Clipboard access was blocked. Copy your answers manually before continuing.",
        "error"
      );
    }

    setTimeout(() => {
      window.open(
        HUB_INVITE,
        "_blank",
        "noopener,noreferrer"
      );
    }, 500);
  }
);

/* =========================================================
   AUTO-OPEN JOB FROM URL
========================================================= */

if (jobsGrid) {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const selectedRole =
    parameters.get("role");

  if (
    selectedRole &&
    JOBS.some(
      (job) =>
        job.id === selectedRole
    )
  ) {
    setTimeout(() => {
      openJobModal(selectedRole);
    }, 300);
  }
}

/* =========================================================
   CONTACT FORM
========================================================= */

const contactForm =
  document.getElementById(
    "contactForm"
  );

const contactFeedback =
  document.getElementById(
    "contactFeedback"
  );

contactForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const name =
      document
        .getElementById("contactName")
        ?.value.trim() || "";

    const email =
      document
        .getElementById("contactEmail")
        ?.value.trim() || "";

    const reason =
      document
        .getElementById("contactReason")
        ?.value || "";

    const message =
      document
        .getElementById("contactMessage")
        ?.value.trim() || "";

    if (
      name.length < 2 ||
      !email ||
      !reason ||
      message.length < 10
    ) {
      if (contactFeedback) {
        contactFeedback.textContent =
          "Complete all fields before preparing your email.";

        contactFeedback.className =
          "form-feedback visible error";
      }

      return;
    }

    const subject =
      encodeURIComponent(
        `Horizon Productions — ${reason}`
      );

    const body =
      encodeURIComponent(
        [
          "HORIZON PRODUCTIONS — BUSINESS INQUIRY",
          "",
          `Name / Company: ${name}`,
          `Reply Email: ${email}`,
          `Inquiry Type: ${reason}`,
          "",
          "MESSAGE",
          message
        ].join("\n")
      );

    if (contactFeedback) {
      contactFeedback.textContent =
        "Opening Gmail with your inquiry prepared.";

      contactFeedback.className =
        "form-feedback visible success";
    }

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=tbg.dev.alt@gmail.com` +
      `&su=${subject}` +
      `&body=${body}`;

    const popup =
      window.open(
        gmailUrl,
        "_blank",
        "noopener,noreferrer"
      );

    if (!popup) {
      window.location.href =
        `mailto:tbg.dev.alt@gmail.com?subject=${subject}&body=${body}`;
    }
  }
);

/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    setMenu(false);
    closeJobModal();
  }
);
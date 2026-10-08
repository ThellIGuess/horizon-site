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
    placeId: "90719247686306",
    fallbackName: "Swim For Brainrot",
    url: "https://www.roblox.com/games/90719247686306/Swim-For-Brainrot"
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
   HEADER SCROLL STATE
========================================================= */

const updateScrolled = () => {
  document.body.classList.toggle("scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", updateScrolled, { passive: true });
updateScrolled();

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
   SCROLL REVEALS
========================================================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -30px"
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("active");
  });
}

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

async function fetchJson(url, timeout = 8000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
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
      return await fetchJson(endpoint);
    } catch (error) {
      console.warn("Game metadata endpoint failed:", error);
    }
  }

  throw new Error("Unable to fetch Roblox game information.");
}

async function fetchGameThumbnails(universeIds) {
  /* Wide 16:9 game thumbnails first (what large studios showcase), square icons as fallback. */
  const wideEndpoints = [
    `https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`
  ];

  for (const endpoint of wideEndpoints) {
    try {
      const data = await fetchJson(endpoint);
      const map = new Map();

      (data?.data || []).forEach((entry) => {
        const url = entry?.thumbnails?.[0]?.imageUrl;
        if (url) map.set(String(entry.universeId), url);
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
          .map((icon) => [String(icon.targetId), icon.imageUrl])
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

function buildGameCard(game, info, thumbnail, options = {}) {
  const name = info?.name || game.fallbackName;

  const description =
    info?.description?.trim() ||
    "A Horizon Productions Roblox experience.";

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

async function loadGamesData() {
  const featuredGrid = document.getElementById("featuredGameGrid");
  const gamesPageGrid = document.getElementById("gamesPageGrid");
  const hasStats = document.querySelector("[data-stat]");

  if (!featuredGrid && !gamesPageGrid && !hasStats) return;

  setStat("titles", GAMES.length, false);

  const renderFallback = () => {
    const cards = GAMES.map((game) => buildGameCard(game, null, null));
    if (featuredGrid) featuredGrid.innerHTML = cards.slice(0, 3).join("");
    if (gamesPageGrid) {
      gamesPageGrid.innerHTML = GAMES
        .map((game, index) => buildGameCard(game, null, null, { flagship: index === 0 }))
        .join("");
    }
    setStat("visits", "—");
    setStat("playing", "—");
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
      return {
        game,
        info: id ? gameMap.get(id) || null : null,
        thumbnail: id ? thumbnailMap.get(id) || null : null
      };
    });

    const totalVisits = entries.reduce((sum, e) => sum + (Number(e.info?.visits) || 0), 0);
    const totalPlaying = entries.reduce((sum, e) => sum + (Number(e.info?.playing) || 0), 0);

    /* Portfolio: biggest titles first. */
    const byVisits = [...entries].sort(
      (a, b) => (Number(b.info?.visits) || 0) - (Number(a.info?.visits) || 0)
    );

    /* Home page: what's hot right now. */
    const byPlaying = [...entries].sort(
      (a, b) => (Number(b.info?.playing) || 0) - (Number(a.info?.playing) || 0)
    );

    if (gamesPageGrid) {
      gamesPageGrid.innerHTML = byVisits
        .map((e, index) => buildGameCard(e.game, e.info, e.thumbnail, { flagship: index === 0 }))
        .join("");
    }

    if (featuredGrid) {
      featuredGrid.innerHTML = byPlaying
        .slice(0, 3)
        .map((e) => buildGameCard(e.game, e.info, e.thumbnail))
        .join("");
    }

    setStat("visits", totalVisits);
    setStat("playing", totalPlaying);
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
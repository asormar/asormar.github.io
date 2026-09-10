// Portfolio — index-first, filterable, animated accordion, theme toggle.
//
// Every panel is built once and stays in the DOM; opening and closing only
// toggles a class. Rebuilding the node on each click, which is what this did
// first, makes CSS transitions impossible — there is nothing to transition
// from.

const THEME_KEY = "portfolio-theme";
const state = { area: null, open: null, expOpen: false };
let data = null;

const $ = (id) => document.getElementById(id);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const link = (href, label, className) => {
  const a = el("a", className, label);
  a.href = href;
  if (!href.startsWith("mailto:")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
};

const repoUrl = (repo) => `https://github.com/asormar/${repo}`;
const nameOf = (p) => p.display || p.repo;

/* ---------------- theme ---------------- */

function storedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (err) {
    return null;
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function currentTheme() {
  return document.documentElement.dataset.theme || systemTheme();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = $("theme");
  if (btn) {
    btn.setAttribute("aria-pressed", String(theme === "dark"));
    btn.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    // private mode — the choice just will not survive the reload
  }
}

// The reveal wipes the new theme in as a circle growing from the button.
// View Transitions carry it; without them the swap is instant, which is fine.
function toggleTheme(event) {
  const next = currentTheme() === "dark" ? "light" : "dark";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduced) {
    applyTheme(next);
    return;
  }

  const btn = event.currentTarget.getBoundingClientRect();
  const x = btn.left + btn.width / 2;
  const y = btn.top + btn.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  document.documentElement.style.setProperty("--reveal-x", `${x}px`);
  document.documentElement.style.setProperty("--reveal-y", `${y}px`);
  document.documentElement.style.setProperty("--reveal-r", `${radius}px`);

  document.startViewTransition(() => applyTheme(next));
}

// Sun and moon are the same disc. In dark mode a second disc slides across it
// through an SVG mask, carving a real crescent — an overlay painted in the page
// colour would break the moment the button gets a hover fill.
function themeIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("theme__icon");
  svg.innerHTML =
    "<defs>" +
    '<mask id="theme-crescent">' +
    '<rect x="0" y="0" width="24" height="24" fill="white"/>' +
    '<circle class="theme__cut" cx="12" cy="12" r="7"/>' +
    "</mask>" +
    "</defs>" +
    '<circle class="theme__orb" cx="12" cy="12" r="5.2" mask="url(#theme-crescent)"/>' +
    '<g class="theme__rays">' +
    '<line x1="12" y1="1.6" x2="12" y2="3.9"/><line x1="12" y1="20.1" x2="12" y2="22.4"/>' +
    '<line x1="1.6" y1="12" x2="3.9" y2="12"/><line x1="20.1" y1="12" x2="22.4" y2="12"/>' +
    '<line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/>' +
    '<line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/>' +
    "</g>";
  return svg;
}

function buildThemeToggle() {
  const btn = $("theme");
  btn.append(themeIcon());
  btn.addEventListener("click", toggleTheme);
  applyTheme(storedTheme() || systemTheme());
}

/* ---------------- pieces ---------------- */

function signIcon() {
  const sign = el("span", "sign");
  sign.setAttribute("aria-hidden", "true");
  sign.append(el("span", "sign__bar sign__bar--h"));
  sign.append(el("span", "sign__bar sign__bar--v"));
  return sign;
}

/* ---------------- project visuals ---------------- */

const svgNode = (markup, viewBox) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("role", "img");
  svg.classList.add("viz__svg");
  svg.innerHTML = markup;
  return svg;
};

// Each diagram draws what the repo actually does. Nothing here is decorative:
// every label and number comes from that project's own source or README.
const DIAGRAMS = {
  // Rolling-origin validation: the training window grows, the tested season
  // always sits to its right, so no fold ever sees its own future.
  // Ten seasons, 2016/17 to 2025/26. The training window grows season by
  // season and the one being predicted always sits just outside it.
  "rolling-origin": () => {
    const seasons = ["16/17", "17/18", "18/19", "19/20", "20/21", "21/22", "22/23", "23/24", "24/25", "25/26"];
    const unit = 30;
    const width = seasons.length * unit;

    const rows = [5, 6, 7, 8, 9]
      .map((train, i) => {
        const y = 4 + i * 21;
        const w = train * unit;
        return (
          `<rect class="viz-track" x="0" y="${y}" width="${width}" height="13" rx="2"/>` +
          `<rect class="viz-fill-3" x="0" y="${y}" width="${w - 2}" height="13" rx="2"/>` +
          `<rect class="viz-fill-mark" x="${w + 2}" y="${y}" width="${unit - 4}" height="13" rx="2"/>`
        );
      })
      .join("");

    const axisY = 4 + 5 * 21 + 4;
    const ticks = seasons
      .map((s, i) => {
        const x = i * unit;
        const shown = i % 3 === 0 || i === seasons.length - 1;
        return (
          `<path class="viz-stroke-3" d="M${x} ${axisY} V${axisY + 4}" fill="none" opacity="${shown ? 1 : 0.4}"/>` +
          (shown ? `<text class="viz__tick" x="${x + 2}" y="${axisY + 15}">${s}</text>` : "")
        );
      })
      .join("");

    return svgNode(
      rows +
        `<path class="viz-stroke-3" d="M0 ${axisY} H${width}" fill="none"/>` +
        ticks +
        `<rect class="viz-fill-3" x="0" y="${axisY + 26}" width="9" height="9" rx="2"/>` +
        `<text class="viz__label" x="14" y="${axisY + 34}">entrena</text>` +
        `<rect class="viz-fill-mark" x="72" y="${axisY + 26}" width="9" height="9" rx="2"/>` +
        `<text class="viz__label" x="86" y="${axisY + 34}">predice</text>`,
      `0 0 ${width} ${axisY + 42}`
    );
  },

  // 75.000 catalogue -> 13.105 verified indies. Widths are to scale.
  funnel: () => {
    const full = 300;
    const kept = Math.round((13105 / 75000) * full);
    return svgNode(
      `<rect class="viz-fill-3" x="0" y="16" width="${full}" height="22" rx="2"/>` +
        `<text class="viz__num viz-text-ink" x="0" y="11">75.000</text>` +
        `<text class="viz__label" x="52" y="11">juegos del catálogo</text>` +
        `<path class="viz-stroke-3" d="M0 42 L0 56 M${full} 42 L${kept} 56" fill="none" stroke-dasharray="3 3"/>` +
        `<rect class="viz-fill-mark" x="0" y="58" width="${kept}" height="22" rx="2"/>` +
        `<text class="viz__num viz-text-mark" x="0" y="96">13.105</text>` +
        `<text class="viz__label" x="52" y="96">indies verificados que entrenan el modelo</text>`,
      "0 0 300 104"
    );
  },

  // The four components and the ports they actually listen on.
  drm: () => {
    const box = (x, y, w, label, sub) =>
      `<rect class="viz-box" x="${x}" y="${y}" width="${w}" height="34" rx="3"/>` +
      `<text class="viz__label viz-text-ink" x="${x + 10}" y="${y + 15}">${label}</text>` +
      `<text class="viz__label" x="${x + 10}" y="${y + 27}">${sub}</text>`;
    return svgNode(
      box(0, 36, 92, "User Agent", "UA.py") +
        box(150, 0, 118, "Servidor de", "contenidos · 6001") +
        box(150, 44, 118, "Servidor de", "licencias · 7002") +
        box(150, 88, 118, "CDM", "descifra y marca") +
        '<path class="viz-stroke-3" d="M92 53 H124 V17 H150" fill="none"/>' +
        '<path class="viz-stroke-mark" d="M92 55 H150" fill="none"/>' +
        '<path class="viz-stroke-3" d="M92 57 H124 V105 H150" fill="none"/>',
      "0 0 340 128"
    );
  },

  // Text decomposes into phonemes before anything is heard.
  phonemes: () => {
    const parts = ["ho", "la", "mun", "do"];
    let x = 0;
    const chips = parts
      .map((p, i) => {
        const w = 26 + p.length * 11;
        const node =
          `<rect class="${i === 1 ? "viz-fill-mark" : "viz-box"}" x="${x}" y="44" width="${w}" height="28" rx="3"/>` +
          `<text class="viz__label ${i === 1 ? "viz-text-paper" : "viz-text-ink"}" x="${x + 12}" y="62">${p}</text>`;
        x += w + 8;
        return node;
      })
      .join("");
    return svgNode(
      '<text class="viz__num viz-text-ink" x="0" y="22">hola mundo</text>' +
        '<path class="viz-stroke-3" d="M8 30 V40" fill="none" stroke-dasharray="2 3"/>' +
        chips +
        '<text class="viz__label" x="0" y="92">41 fonemas cubren el español</text>',
      "0 0 340 100"
    );
  }
};

function buildVisual(v) {
  if (!v) return null;
  const fig = el("figure", "viz");

  if (v.kind === "image") {
    const img = el("img", "viz__img");
    img.src = v.src;
    img.alt = v.alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    fig.append(img);
  } else if (v.kind === "svg" && DIAGRAMS[v.id]) {
    const svg = DIAGRAMS[v.id]();
    svg.setAttribute("aria-label", v.caption || "");
    fig.append(svg);
  } else {
    return null;
  }

  if (v.caption) fig.append(el("figcaption", "viz__caption", v.caption));
  return fig;
}

function tagList(items, className) {
  const box = el("span", className);
  for (const t of items) box.append(el("span", "tag", t));
  return box;
}

/* ---------------- data loading ---------------- */

async function load() {
  for (const path of ["./data/site.json", "./data/projects.json"]) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (res.ok) return await res.json();
    } catch (err) {
      // try the next source
    }
  }
  return null;
}

/* ---------------- render ---------------- */

function renderMeta() {
  $("name").textContent = data.person.name;
  const meta = $("meta");
  meta.replaceChildren();

  for (const item of data.person.education) {
    const line = el("span", null, item.title);
    if (item.note) {
      line.append(" ");
      line.append(el("span", "masthead__note", `— ${item.note}`));
    }
    meta.append(line);
  }
  meta.append(el("span", "masthead__note", data.person.location));
}

function renderChips() {
  const box = $("chips");
  box.replaceChildren();

  const areas = [];
  for (const p of data.projects) if (!areas.includes(p.area)) areas.push(p.area);

  const make = (label, value) => {
    const btn = el("button", "chip", label);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(state.area === value));
    btn.addEventListener("click", () => {
      state.area = state.area === value ? null : value;
      syncFilter();
    });
    return btn;
  };

  box.append(make("todo", null));
  for (const a of areas) box.append(make(a, a));
}

function buildEntry({ name, summary, tags, detail, metrics, links, visual, id }) {
  const entry = el("div", "entry");
  entry.dataset.id = id;

  const head = el("button", "entry__head");
  head.type = "button";
  head.setAttribute("aria-expanded", "false");
  head.setAttribute("aria-controls", `panel-${id}`);
  head.append(el("span", "entry__name", name));
  head.append(el("span", "entry__summary", summary));
  head.append(tagList(tags, "entry__tags"));
  head.append(signIcon());
  entry.append(head);

  // The 0fr -> 1fr grid row is what makes the height animatable.
  const wrap = el("div", "panel");
  wrap.id = `panel-${id}`;
  const inner = el("div", "panel__inner");
  const body = el("div", "panel__body");

  if (detail) body.append(el("p", "entry__detail", detail));

  const viz = buildVisual(visual);
  if (viz) body.append(viz);

  if (metrics && metrics.length) {
    const box = el("div", "metrics");
    for (const m of metrics) {
      const cell = el("div", "metric");
      cell.append(el("div", "metric__value", m.value));
      cell.append(el("div", "metric__label", m.label));
      box.append(cell);
    }
    body.append(box);
  }

  if (links && links.length) {
    const box = el("div", "entry__links");
    for (const l of links) box.append(link(l.href, l.label));
    body.append(box);
  }

  inner.append(body);
  wrap.append(inner);
  entry.append(wrap);

  return { entry, head, body };
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animating to `height: auto` is not possible, so the panel is driven between 0
// and its measured content height, then released to auto once open so it can
// reflow when the window resizes.
function setOpen(entry, head, open) {
  const wasOpen = entry.classList.contains("is-open");
  entry.classList.toggle("is-open", open);
  head.setAttribute("aria-expanded", String(open));

  const panel = entry.querySelector(".panel");
  if (!panel) return;

  if (reducedMotion()) {
    panel.style.height = open ? "auto" : "0px";
    return;
  }

  if (open === wasOpen && panel.style.height) return;

  const target = panel.firstElementChild.getBoundingClientRect().height;

  if (open) {
    panel.style.height = `${target}px`;
    panel.addEventListener(
      "transitionend",
      (ev) => {
        if (ev.propertyName === "height" && entry.classList.contains("is-open")) {
          panel.style.height = "auto";
        }
      },
      { once: true }
    );
  } else {
    // From `auto` there is nothing to interpolate from, so pin the current
    // height and force a reflow to commit it before collapsing. A rAF pair
    // reads better but never fires while the tab is backgrounded, which leaves
    // the panel stuck open.
    panel.style.height = `${panel.getBoundingClientRect().height}px`;
    void panel.offsetHeight;
    panel.style.height = "0px";
  }
}

function renderIndex() {
  const box = $("index");
  box.replaceChildren();

  for (const p of data.projects) {
    const name = nameOf(p);
    const links = [{ href: repoUrl(p.repo), label: "código →" }];
    if (p.extra && p.extra.href) links.push({ href: p.extra.href, label: p.extra.label });

    const { entry, head } = buildEntry({
      id: name,
      name,
      summary: p.summary,
      tags: p.tech,
      detail: p.detail,
      metrics: p.metrics,
      visual: p.visual,
      links
    });

    entry.dataset.area = p.area;
    head.addEventListener("click", () => {
      state.open = state.open === name ? null : name;
      for (const other of box.children) {
        setOpen(other, other.querySelector(".entry__head"), other.dataset.id === state.open);
      }
    });

    box.append(entry);
  }

  // The first project starts open, but without animating on load — and at
  // `auto`, so it stays correct once the webfonts land and reflow the text.
  const first = box.firstElementChild;
  first.classList.add("is-open");
  first.querySelector(".entry__head").setAttribute("aria-expanded", "true");
  first.querySelector(".panel").style.height = "auto";
  state.open = nameOf(data.projects[0]);
}

function renderExperience() {
  const box = $("experience");
  box.replaceChildren();

  const exp = data.experience;
  const { entry, head, body } = buildEntry({
    id: "rankia",
    name: exp.org,
    summary: exp.summary,
    tags: [exp.period],
    detail: null,
    metrics: null,
    links: null
  });

  const areas = el("div", "areas");
  for (const a of exp.areas) {
    const area = el("div", "area");
    const ahead = el("div", "area__head");
    ahead.append(el("span", "area__title", a.title));
    ahead.append(el("span", "area__lead", a.lead));
    area.append(ahead);
    area.append(el("p", "area__text", a.text));
    area.append(tagList(a.tags, "area__tags"));
    areas.append(area);
  }
  body.append(areas);

  head.addEventListener("click", () => {
    state.expOpen = !state.expOpen;
    setOpen(entry, head, state.expOpen);
  });

  box.append(entry);
}

function syncFilter() {
  for (const entry of $("index").children) {
    entry.classList.toggle("is-hidden", Boolean(state.area) && entry.dataset.area !== state.area);
  }
  for (const chip of $("chips").children) {
    chip.setAttribute("aria-pressed", String(chip.textContent === (state.area || "todo")));
  }
}

function renderContact() {
  const box = $("contact");
  box.replaceChildren();
  for (const l of data.person.links) box.append(link(l.href, l.label));
}

/* ---------------- boot ---------------- */

buildThemeToggle();

load().then((loaded) => {
  if (!loaded) {
    $("index").append(
      el("p", "entry__detail", "No se han podido cargar los proyectos. Vuelve a intentarlo en un momento.")
    );
    return;
  }
  data = loaded;
  renderMeta();
  renderChips();
  renderIndex();
  renderExperience();
  renderContact();
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
});

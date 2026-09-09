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

function sunIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("theme__icon");
  svg.innerHTML =
    '<circle class="theme__orb" cx="12" cy="12" r="5"/>' +
    '<circle class="theme__moon" cx="12" cy="12" r="5"/>' +
    '<g class="theme__rays">' +
    '<line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/>' +
    '<line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/>' +
    '<line x1="4.4" y1="4.4" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.6" y2="19.6"/>' +
    '<line x1="4.4" y1="19.6" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.6" y2="4.4"/>' +
    "</g>";
  return svg;
}

function buildThemeToggle() {
  const btn = $("theme");
  btn.append(sunIcon());
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

function buildEntry({ name, summary, tags, detail, metrics, links, id }) {
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

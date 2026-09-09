// Portfolio — index-first, filterable, accordion.
// Data comes from data/site.json (built by the sync workflow) and falls back
// to data/projects.json when the sync has never run.

const state = { tech: null, open: null, expOpen: false };
let data = null;

const $ = (id) => document.getElementById(id);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const repoUrl = (repo) => `https://github.com/asormar/${repo}`;
const nameOf = (p) => p.display || p.repo;

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

function renderMeta() {
  const meta = $("meta");
  meta.replaceChildren();
  $("name").textContent = data.person.name;

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

  const techs = [];
  for (const p of data.projects) {
    for (const t of p.tech) if (!techs.includes(t)) techs.push(t);
  }

  const make = (label, value) => {
    const btn = el("button", "chip", label);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(state.tech === value));
    btn.addEventListener("click", () => {
      state.tech = state.tech === value ? null : value;
      render();
    });
    return btn;
  };

  box.append(make("todo", null));
  for (const t of techs) box.append(make(t, t));
}

function visibleProjects() {
  if (!state.tech) return data.projects;
  return data.projects.filter((p) => p.tech.includes(state.tech));
}

function renderIndex() {
  const box = $("index");
  box.replaceChildren();

  const shown = visibleProjects();
  const total = data.projects.length;
  $("count").textContent =
    shown.length === total ? `${total} proyectos` : `${shown.length} de ${total}`;

  for (const p of shown) {
    const name = nameOf(p);
    const isOpen = state.open === name;
    const panelId = `panel-${name}`;

    const entry = el("div", "entry");

    const head = el("button", "entry__head");
    head.type = "button";
    head.setAttribute("aria-expanded", String(isOpen));
    head.setAttribute("aria-controls", panelId);

    head.append(el("span", "entry__year", p.year));
    head.append(el("span", "entry__name", name));
    head.append(el("span", "entry__summary", p.summary));

    const tags = el("span", "entry__tags");
    for (const t of p.tech) tags.append(el("span", "tag", t));
    head.append(tags);
    head.append(el("span", "entry__sign", isOpen ? "−" : "+"));

    head.addEventListener("click", () => {
      state.open = isOpen ? null : name;
      render();
    });

    entry.append(head);

    if (isOpen) {
      const panel = el("div", "entry__panel");
      panel.id = panelId;
      panel.append(el("span", "entry__spacer"));

      const body = el("div", "entry__body");
      body.append(el("p", "entry__detail", p.detail));

      if (p.metrics && p.metrics.length) {
        const metrics = el("div", "metrics");
        for (const m of p.metrics) {
          const cell = el("div", "metric");
          cell.append(el("div", "metric__value", m.value));
          cell.append(el("div", "metric__label", m.label));
          metrics.append(cell);
        }
        body.append(metrics);
      }

      const links = el("div", "entry__links");
      const code = el("a", null, "código →");
      code.href = repoUrl(p.repo);
      code.rel = "noopener";
      links.append(code);

      if (p.extra && p.extra.href) {
        const extra = el("a", null, p.extra.label);
        extra.href = p.extra.href;
        extra.rel = "noopener";
        links.append(extra);
      }
      body.append(links);

      panel.append(body);
      entry.append(panel);
    }

    box.append(entry);
  }
}

function renderExperience() {
  const box = $("experience");
  box.replaceChildren();

  const exp = data.experience;
  const isOpen = state.expOpen;

  const head = el("button", "entry__head");
  head.type = "button";
  head.setAttribute("aria-expanded", String(isOpen));
  head.setAttribute("aria-controls", "panel-experience");

  head.append(el("span", "entry__year", exp.year));
  head.append(el("span", "entry__name", exp.org));
  head.append(el("span", "entry__summary", exp.summary));

  const tags = el("span", "entry__tags");
  tags.append(el("span", "tag", exp.period));
  head.append(tags);
  head.append(el("span", "entry__sign", isOpen ? "−" : "+"));

  head.addEventListener("click", () => {
    state.expOpen = !isOpen;
    render();
  });

  box.append(head);

  if (isOpen) {
    const panel = el("div", "entry__panel");
    panel.id = "panel-experience";
    panel.append(el("span", "entry__spacer"));

    const areas = el("div", "areas");
    for (const a of exp.areas) {
      const area = el("div", "area");
      const ahead = el("div", "area__head");
      ahead.append(el("span", "area__title", a.title));
      ahead.append(el("span", "area__lead", a.lead));
      area.append(ahead);
      area.append(el("p", "area__text", a.text));

      const atags = el("div", "area__tags");
      for (const t of a.tags) atags.append(el("span", "tag", t));
      area.append(atags);

      areas.append(area);
    }

    panel.append(areas);
    box.append(panel);
  }
}

function renderContact() {
  const box = $("contact");
  box.replaceChildren();
  for (const link of data.person.links) {
    const a = el("a", null, link.label);
    a.href = link.href;
    a.rel = "noopener";
    box.append(a);
  }
}

function renderStale() {
  if (!data.syncedAt) return;
  const when = new Date(data.syncedAt);
  if (Number.isNaN(when.getTime())) return;
  $("stale").textContent = `Datos de GitHub actualizados el ${when.toLocaleDateString("es-ES")}.`;
}

function render() {
  renderChips();
  renderIndex();
  renderExperience();
}

load().then((loaded) => {
  if (!loaded) {
    $("index").append(
      el("p", "entry__detail", "No se han podido cargar los proyectos. Vuelve a intentarlo en un momento.")
    );
    return;
  }
  data = loaded;
  state.open = nameOf(data.projects[0]);
  renderMeta();
  renderContact();
  renderStale();
  render();
});

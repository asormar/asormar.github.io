// Merges the curated content in data/projects.json with live GitHub metadata
// and writes data/site.json, which is what the page actually reads.
//
// It never overwrites curated prose. It only:
//   - refreshes language / pushed_at / archived / homepage per listed repo
//   - flags repos that no longer exist or turned private (so a dead link is caught)
//   - lists repos carrying the "portfolio" topic that are not in projects.json yet
//
// Run: node scripts/sync.mjs           (uses GITHUB_TOKEN when present)

import { readFile, writeFile } from "node:fs/promises";

const USER = "asormar";
const TOPIC = "portfolio";
const API = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USER}-portfolio-sync`,
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
};

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function allRepos() {
  const out = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await api(`/users/${USER}/repos?per_page=100&page=${page}&sort=pushed`);
    if (!batch || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

const curated = JSON.parse(await readFile(new URL("../data/projects.json", import.meta.url), "utf8"));
const repos = await allRepos();
const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

const missing = [];
const projects = curated.projects.map((p) => {
  const live = byName.get(p.repo.toLowerCase());
  if (!live) {
    missing.push(p.repo);
    return p;
  }
  return {
    ...p,
    github: {
      url: live.html_url,
      language: live.language,
      pushedAt: live.pushed_at,
      archived: live.archived,
      homepage: live.homepage || null
    }
  };
});

const known = new Set(curated.projects.map((p) => p.repo.toLowerCase()));
const candidates = repos
  .filter((r) => (r.topics || []).includes(TOPIC) && !known.has(r.name.toLowerCase()))
  .map((r) => ({ repo: r.name, description: r.description, language: r.language, pushedAt: r.pushed_at }));

const site = {
  ...curated,
  projects,
  syncedAt: new Date().toISOString(),
  candidates,
  missing
};

await writeFile(new URL("../data/site.json", import.meta.url), `${JSON.stringify(site, null, 2)}\n`, "utf8");

console.log(`site.json escrito — ${projects.length} proyectos`);
if (missing.length) console.log(`AVISO · repos no encontrados o privados: ${missing.join(", ")}`);
if (candidates.length) {
  console.log(`NUEVOS · repos con el topic "${TOPIC}" pendientes de añadir a projects.json:`);
  for (const c of candidates) console.log(`  - ${c.repo}: ${c.description || "(sin descripción)"}`);
}

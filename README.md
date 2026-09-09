# Portfolio — Alejandro Sorolla Martínez

Static portfolio site served from GitHub Pages. No framework, no build step:
plain HTML, CSS and one ES module.

## How content works

Content lives in two layers, and knowing which is which is the whole point:

| Layer | File | Who owns it |
| --- | --- | --- |
| Curated | `data/projects.json` | You. Prose, metrics, tech tags, ordering. |
| Live | GitHub API | Fetched at build time by `scripts/sync.mjs`. |

`scripts/sync.mjs` merges both into `data/site.json`, which is what the page
reads. It is generated, git-ignored, and rebuilt on every deploy.

The sync **never overwrites curated prose**. It only:

- refreshes language, last push date, archived flag and homepage per repo;
- reports repos listed in `projects.json` that no longer exist or turned private;
- lists repos carrying the `portfolio` topic that are not in `projects.json` yet.

That last one is the "it updates itself" part: tag a new repo with the
`portfolio` topic on GitHub and the next run names it in the workflow log, ready
for you to write its entry. The narrative — the AUC, the Spanish copy — cannot
come from an API, so it stays hand-written on purpose.

## Adding a project

1. Add the repo's `portfolio` topic on GitHub (optional, but it makes the sync
   flag it for you).
2. Append an object to `projects` in `data/projects.json`:

```json
{
  "repo": "exact-repo-name",
  "display": "shorter-name-for-the-page",
  "year": "2026",
  "summary": "One line, shown collapsed.",
  "tech": ["Python"],
  "detail": "The paragraph shown when the row is open.",
  "metrics": [{ "value": "0,90", "label": "what it measures" }],
  "extra": { "label": "demo →", "href": "https://..." }
}
```

`display` and `extra` are optional; pass `"extra": null` when there is no
second link. Only use metrics you can point at in the repo.

3. Commit and push. The deploy workflow does the rest.

## Local development

```bash
node scripts/sync.mjs      # writes data/site.json
python -m http.server 8123 # then open http://localhost:8123
```

The page falls back to `data/projects.json` when `site.json` is absent, so it
renders without running the sync first.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`, daily at 05:17 UTC,
and on manual dispatch. It runs the sync, uploads the directory as a Pages
artifact and deploys it.

Pages must be set to **GitHub Actions** as its source in the repository settings
(Settings → Pages → Build and deployment → Source).

Note: GitHub disables scheduled workflows in repositories with no activity for
60 days. If the daily sync goes quiet, re-enable it from the Actions tab.

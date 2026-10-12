# moemirzaei.github.io

Personal website of Moe (Mohammadreza) Mirzaei.

## How it works
- **Publications** come from ORCID (Web of Science syncs into ORCID). A GitHub Action refreshes them **every day** and redeploys the site.
- **Experience, interests, links** live in `data/profile.json`. Edit that file to update them (LinkedIn can't be read automatically).
- To refresh right now: **Actions → "Update data and deploy site" → Run workflow**.

## Files
| File | What it is |
|---|---|
| `index.html` | Page layout |
| `assets/style.css` | Look and colors |
| `assets/app.js` | Fills the page from the data files |
| `data/profile.json` | Your bio and experience (edit by hand) |
| `data/orcid.json` | Publications (auto) |
| `scripts/fetch_data.py` | Fetches ORCID + GitHub data |

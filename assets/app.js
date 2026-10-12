// Fills the page from data/*.json. data/orcid.json is refreshed daily by the GitHub Action.
const ORCID_ID = "0000-0002-8083-2653";

const ICONS = {
  orcid: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#A6CE39"/><path fill="#fff" d="M7.5 6.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM6.8 9.6h1.4v7.9H6.8zM10 9.6h3.3c3.1 0 4.5 2.2 4.5 3.95 0 1.9-1.5 3.95-4.5 3.95H10zm1.4 1.25v5.4h1.9c2.4 0 3-1.8 3-2.7 0-1.5-1-2.7-3-2.7z"/></svg>',
  wos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M6.2 9.4h2.6V18H6.2zM7.5 5.3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.4 9.4h2.5v1.2c.4-.7 1.3-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1V18h-2.6v-4.2c0-1 0-2.3-1.4-2.3s-1.7 1.1-1.7 2.2V18h-2.6z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.8 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
};
const LABELS = { orcid: "ORCID", wos: "Web of Science", linkedin: "LinkedIn", github: "GitHub" };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function getJSON(url, opts) {
  try {
    const r = await fetch(url, opts);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function renderLinks(links, el) {
  el.innerHTML = Object.entries(links)
    .map(([k, url]) => `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ICONS[k] || ""}${LABELS[k] || k}</a>`)
    .join("");
}

function renderProfile(p) {
  $("name").textContent = p.name;
  $("title").textContent = p.title;
  $("affiliation").textContent = p.affiliation;
  $("tagline").textContent = p.tagline;
  if (p.photo) $("photo").src = p.photo;
  $("interests").innerHTML = p.interests.map((i) => `<li>${esc(i)}</li>`).join("");
  renderLinks(p.links, $("links"));
  renderLinks(p.links, $("links-footer"));
  $("contact-linkedin").href = p.links.linkedin;

  $("timeline").innerHTML = p.experience.map((e) => `
    <li class="item${e.image ? "" : " no-img"}">
      <div>
        ${e.when ? `<div class="when">${esc(e.when)}</div>` : ""}
        <h3>${esc(e.role)}</h3>
        <div class="org">${esc(e.org)}</div>
        <p>${esc(e.text)}</p>
        ${e.link ? `<a class="more" href="${esc(e.link.url)}" target="_blank" rel="noopener">${esc(e.link.label)} →</a>` : ""}
      </div>
      ${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : ""}
    </li>`).join("");
}

// Fallback: read ORCID directly in the browser if the saved file is empty.
async function liveOrcidWorks() {
  const d = await getJSON(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, { headers: { Accept: "application/json" } });
  if (!d) return null;
  return (d.group || []).map((g) => {
    const s = (g["work-summary"] || [])[0] || {};
    const ids = s["external-ids"]?.["external-id"] || [];
    const doi = ids.find((i) => i["external-id-type"] === "doi")?.["external-id-value"];
    return {
      title: s.title?.title?.value || "Untitled",
      venue: s["journal-title"]?.value || "",
      year: s["publication-date"]?.year?.value || "",
      type: (s.type || "").replace(/-/g, " "),
      doi,
      url: doi ? `https://doi.org/${doi}` : s.url?.value,
    };
  }).sort((a, b) => (b.year || "0").localeCompare(a.year || "0"));
}

function renderPubs(works, updated) {
  const list = $("pubs");
  const meta = $("pub-meta");
  if (!works || !works.length) {
    meta.textContent = "";
    list.innerHTML = `<li class="empty">Publications will appear here once they are on <a href="https://orcid.org/${ORCID_ID}">ORCID</a>.</li>`;
    return;
  }
  meta.innerHTML = `${works.length} item${works.length > 1 ? "s" : ""} · from <a href="https://orcid.org/${ORCID_ID}" target="_blank" rel="noopener">ORCID</a>`;
  if (updated) $("updated").textContent = `Last sync ${updated}`;

  const draw = (type) => {
    const shown = type === "all" ? works : works.filter((w) => w.type === type);
    list.innerHTML = shown.map((w) => `
      <li class="pub">
        <div class="pub-year">${esc(w.year)}</div>
        <div>
          <div class="pub-title">${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)}</a>` : esc(w.title)}</div>
          <div class="pub-venue">${esc(w.venue)}${w.type ? `<span class="tag">${esc(w.type)}</span>` : ""}</div>
        </div>
      </li>`).join("");
  };

  const types = [...new Set(works.map((w) => w.type).filter(Boolean))];
  if (types.length > 1) {
    const f = $("pub-filters");
    f.hidden = false;
    f.innerHTML = ["all", ...types].map((t, i) => `<button type="button" data-t="${esc(t)}" aria-pressed="${i === 0}">${esc(t)}</button>`).join("");
    f.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      f.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw(b.dataset.t);
    });
  }
  draw("all");
}

(async () => {
  $("year").textContent = new Date().getFullYear();
  const [profile, orcid] = await Promise.all([getJSON("data/profile.json"), getJSON("data/orcid.json")]);
  if (profile) renderProfile(profile);
  if (orcid?.biography) { $("orcid-bio").textContent = orcid.biography; $("orcid-bio").hidden = false; }

  let works = orcid?.works;
  if (!works || !works.length) works = await liveOrcidWorks();
  renderPubs(works, orcid?.updated);
})();

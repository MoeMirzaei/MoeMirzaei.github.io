// Fills the page from data/*.json. data/orcid.json is refreshed daily by the GitHub Action.
const ORCID_ID = "0000-0002-8083-2653";

const ICONS = {
  scholar: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#4285F4"/><path fill="#fff" d="M12 4 3 10.5l3.7 2.7A6 6 0 0 1 12 10a6 6 0 0 1 5.3 3.2L21 10.5z"/><circle cx="12" cy="16" r="4" fill="#fff"/></svg>',
  orcid: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#A6CE39"/><path fill="#fff" d="M7.5 6.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM6.8 9.6h1.4v7.9H6.8zM10 9.6h3.3c3.1 0 4.5 2.2 4.5 3.95 0 1.9-1.5 3.95-4.5 3.95H10zm1.4 1.25v5.4h1.9c2.4 0 3-1.8 3-2.7 0-1.5-1-2.7-3-2.7z"/></svg>',
  wos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/></svg>',
  researchgate: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#00CCBB"/><text x="11" y="17" font-family="Georgia,serif" font-size="13" font-weight="700" text-anchor="middle" fill="#fff">R</text><text x="17.5" y="11" font-family="Georgia,serif" font-size="8" font-weight="700" text-anchor="middle" fill="#fff">G</text></svg>',
  linkedin: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M6.2 9.4h2.6V18H6.2zM7.5 5.3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.4 9.4h2.5v1.2c.4-.7 1.3-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1V18h-2.6v-4.2c0-1 0-2.3-1.4-2.3s-1.7 1.1-1.7 2.2V18h-2.6z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.8 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
};
const LABELS = { scholar: "Google Scholar", orcid: "ORCID", wos: "Web of Science", researchgate: "ResearchGate", linkedin: "LinkedIn", github: "GitHub" };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function getJSON(url, opts) {
  try {
    const r = await fetch(url, opts);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

const CV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>';

function renderLinks(links, el, cv) {
  el.innerHTML = (cv ? `<a class="btn btn-cv" href="${esc(cv)}" target="_blank" rel="noopener">${CV_ICON}Download CV</a>` : "") +
    Object.entries(links)
      .map(([k, url]) => `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ICONS[k] || ""}${LABELS[k] || k}</a>`)
      .join("");
}

// Turn advisor names into links to their pages (names come from profile.json "people").
function linkPeople(html, people) {
  for (const [name, url] of Object.entries(people || {})) {
    html = html.split(esc(name)).join(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>`);
  }
  return html;
}

// Photo viewer for News galleries
const LB = { list: [], i: 0 };
function lbShow() {
  $("lb-img").src = LB.list[LB.i];
  $("lb-count").textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : "";
}
function lbOpen(list, i) { LB.list = list; LB.i = i; lbShow(); $("lightbox").hidden = false; document.body.style.overflow = "hidden"; }
function lbClose() { $("lightbox").hidden = true; document.body.style.overflow = ""; }
function lbStep(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; lbShow(); }
document.addEventListener("keydown", (e) => {
  if ($("lightbox").hidden) return;
  if (e.key === "Escape") lbClose(); else if (e.key === "ArrowLeft") lbStep(-1); else if (e.key === "ArrowRight") lbStep(1);
});

function renderNews(p) {
  const posts = p.news || [], shown = p.newsShown || 3;
  if (!posts.length) { $("news").hidden = true; return; }
  if (p.linkedinActivity) $("li-activity").href = p.linkedinActivity;
  const post = (n, k) => {
    const imgs = n.images || [], vis = imgs.slice(0, 4), extra = imgs.length - vis.length;
    const gal = vis.map((src, i) => `<button type="button" data-post="${k}" data-i="${i}" aria-label="Open photo ${i + 1} of ${imgs.length}"><img src="${esc(src)}" alt="" loading="lazy">${i === 3 && extra > 0 ? `<span class="plus">+${extra}</span>` : ""}${i === 0 && imgs.length > 1 ? `<span class="plus plus-m">+${imgs.length - 1}</span>` : ""}</button>`).join("");
    return `<li class="post">
      ${imgs.length ? `<div class="gallery n${vis.length}">${gal}</div>` : ""}
      <div class="post-body">
        <span class="when">${esc(n.when)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${linkPeople(esc(n.text), p.people)}</p>
        ${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener">Read on LinkedIn →</a>` : ""}
        <div class="tags">${(n.tags || []).map((t) => `<span>#${esc(t)}</span>`).join("")}</div>
      </div>
    </li>`;
  };
  const draw = (all) => { $("news-list").innerHTML = (all ? posts : posts.slice(0, shown)).map(post).join(""); };
  draw(false);
  $("news-list").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-post]"); if (!b) return;
    lbOpen(posts[+b.dataset.post].images, +b.dataset.i);
  });
  if (posts.length > shown) {
    const btn = $("news-more"); btn.hidden = false; let open = false;
    btn.textContent = `See all ${posts.length} updates`;
    btn.onclick = () => { open = !open; draw(open); btn.textContent = open ? "Show fewer" : `See all ${posts.length} updates`; };
  }
  const lb = $("lightbox");
  lb.querySelector(".lb-close").onclick = lbClose;
  lb.querySelector(".lb-prev").onclick = () => lbStep(-1);
  lb.querySelector(".lb-next").onclick = () => lbStep(1);
  lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
}

function renderProfile(p) {
  renderNews(p);
  $("name").textContent = p.name;
  $("title").textContent = p.title;
  if (p.subtitle2) $("subtitle2").textContent = p.subtitle2;
  $("tagline").textContent = p.tagline;
  if (p.photo) $("photo").src = p.photo;
  $("interests").innerHTML = p.interests.map((i) => `<li>${esc(i)}</li>`).join("");
  renderLinks(p.links, $("links"), p.cv);
  renderLinks(p.links, $("links-footer"), p.cv);
  $("contact-linkedin").href = p.links.linkedin;
  $("skills").innerHTML = (p.skills || []).map((s) => `<li>${esc(s)}</li>`).join("");
  const L = (t) => linkPeople(esc(t), p.people);
  const card = (l) => `<li><b>${esc(l.role)}</b><span class="org">${L(l.org)}</span>${l.file ? `<a class="view" href="${esc(l.file)}" target="_blank" rel="noopener">${esc(l.fileLabel || "View certificate →")}</a>` : ""}<span class="when">${esc(l.when)}</span></li>`;
  $("teaching").innerHTML = (p.teaching || []).map(card).join("");
  $("leadership").innerHTML = (p.leadership || []).map(card).join("");
  $("talks").innerHTML = (p.talks || []).map(card).join("");
  $("memberships").innerHTML = (p.memberships || []).map(card).join("");
  const certs = p.certificates || [], shown = p.certificatesShown || 3;
  const drawCerts = (all) => { $("certificates").innerHTML = (all ? certs : certs.slice(0, shown)).map(card).join(""); };
  drawCerts(false);
  if (certs.length > shown) {
    const btn = $("cert-more"); btn.hidden = false; let open = false;
    btn.textContent = `See all ${certs.length} certificates`;
    btn.onclick = () => { open = !open; drawCerts(open); btn.textContent = open ? "Show fewer" : `See all ${certs.length} certificates`; };
  }
  $("edu").innerHTML = (p.education || []).map((e) => `
    <li>
      <div><h3>${esc(e.degree)}</h3><div class="school">${esc(e.school)}</div>${e.note ? `<div class="note">${linkPeople(esc(e.note), p.people)}</div>` : ""}</div>
      <div class="when">${esc(e.when)}</div>
    </li>`).join("");
  if (p.email) { $("contact-email").href = `mailto:${p.email}`; $("contact-email").textContent = p.email; }
  if (p.languages) $("languages").textContent = p.languages;

  $("timeline").innerHTML = p.experience.map((e) => `
    <li class="item${e.image ? "" : " no-img"}">
      <div>
        ${e.when ? `<div class="when">${esc(e.when)}</div>` : ""}
        <h3>${esc(e.role)}</h3>
        <div class="org">${linkPeople(esc(e.org), p.people)}</div>
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

// ORCID titles typed in ALL CAPS read badly; show them in sentence case.
const fixCase = (t) => (t && t === t.toUpperCase() && /[A-Z]{4}/.test(t))
  ? t.toLowerCase().replace(/(^|[:.?!]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase())
  : t;

function applyOverrides(works, overrides) {
  (works || []).forEach((w) => {
    const o = (overrides || []).find((o) => w.title.toLowerCase().startsWith(o.match.toLowerCase()));
    if (o) ["type", "venue", "year", "url"].forEach((k) => { if (o[k]) w[k] = o[k]; });
  });
  return (works || []).sort((a, b) => String(b.year || "0").localeCompare(String(a.year || "0")));
}

function renderPubs(works, updated) {
  (works || []).forEach((w) => { w.title = fixCase(w.title); });
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

  let works = orcid?.works;
  if (!works || !works.length) works = await liveOrcidWorks();
  renderPubs(applyOverrides(works, profile?.pubOverrides), orcid?.updated);
})();

/**
 * app.js — Main dashboard controller.
 * Handles: sector tabs, insights, stocks panel, favorites, global search.
 */

const API = "http://localhost:8000/api";

const SECTOR_ICONS = {
  All:"🌐", Tech:"💻", AI:"🤖", Finance:"💰",
  Pharma:"💊", Aerospace:"🚀", Energy:"⚡", Science:"🔬",
};

let activeTab      = "All";
let favoriteTickers = [];   // cached list of user's favorited tickers

/* ─── Startup ────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  showUsername();
  await buildSectorTabs();
  await loadFavoriteTickers();

  document.getElementById("fetch-btn").addEventListener("click", fetchLatest);
  document.getElementById("logout-btn").addEventListener("click", logout);
  initGlobalSearch();

  // Check if we have any articles — if not, auto-fetch all sectors on first load
  const count = await getInsightCount();
  if (count === 0) {
    await autoFetchAll();
  } else {
    switchTab("All", document.querySelector(".sector-tab.active"));
  }
});

/* ─── Auto-fetch on first load ───────────────────────────────── */
async function getInsightCount() {
  try {
    const res  = await fetch(`${API}/insights/`, { headers: authHeaders() });
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch(_) { return 0; }
}

async function autoFetchAll() {
  setContent(`
    <div class="empty-state">
      <div class="spinner"></div>
      <p style="margin-top:1rem;font-size:1rem;color:var(--text);font-weight:600">
        Fetching the latest news from the last 7 days…
      </p>
      <p style="margin-top:0.4rem;font-size:0.85rem;color:var(--muted)">
        Pulling from 21 RSS feeds across all sectors. This takes about 30 seconds on first load.
      </p>
    </div>`);

  try {
    const res  = await fetch(`${API}/insights/fetch-all`, { method:"POST", headers: authHeaders() });
    const data = await res.json();
    const total = data.total || 0;
    showToast(`Loaded ${total} articles from the last 7 days!`, "success");
  } catch(e) {
    showToast("Some feeds failed — showing what we got.", "");
  }
  switchTab("All", document.querySelector(".sector-tab.active"));
}

/* ─── Username ───────────────────────────────────────────────── */
function showUsername() {
  try {
    const p = JSON.parse(atob(getToken().split(".")[1]));
    document.getElementById("nav-username").textContent = p.username || "User";
  } catch(_){}
}

/* ─── Sector tabs (dynamic) ──────────────────────────────────── */
async function buildSectorTabs() {
  const bar = document.getElementById("sector-tabs");
  // Insert before the divider
  const divider = bar.querySelector(".tab-divider");

  try {
    const res     = await fetch(`${API}/insights/sectors`, { headers: authHeaders() });
    const sectors = await res.json();
    sectors.forEach(s => {
      const btn = document.createElement("button");
      btn.className      = "sector-tab";
      btn.dataset.sector = s;
      btn.textContent    = `${SECTOR_ICONS[s]||"📌"} ${s}`;
      btn.onclick        = () => switchTab(s, btn);
      bar.insertBefore(btn, divider);
    });
  } catch(_){}
}

/* ─── Tab switcher ───────────────────────────────────────────── */
function switchTab(tab, btnEl) {
  activeTab = tab;
  document.querySelectorAll(".sector-tab").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  const title    = document.getElementById("section-title");
  const sub      = document.getElementById("section-sub");
  const fetchBtn = document.getElementById("fetch-btn");
  const countLbl = document.getElementById("count-label");

  if (tab === "Stocks") {
    title.textContent    = "Stock Market";
    sub.textContent      = "Live data from Yahoo Finance — search any company or browse by sector";
    fetchBtn.style.display = "none";
    countLbl.textContent = "stocks";
    renderStocksPanel();
  } else if (tab === "Favorites") {
    title.textContent    = "My Favorites";
    sub.textContent      = "Your saved companies — live stock data";
    fetchBtn.style.display = "none";
    countLbl.textContent = "saved";
    renderFavoritesPanel();
  } else {
    title.textContent    = tab === "All" ? "Latest Insights" : `${SECTOR_ICONS[tab]||""} ${tab} Insights`;
    sub.textContent      = "AI-summarised articles — click Refresh to fetch latest";
    fetchBtn.style.display = "";
    countLbl.textContent = "articles";
    loadInsights(tab);
  }
}

/* ─────────────────────────────────────────────────────────────
   INSIGHTS
──────────────────────────────────────────────────────────────*/
async function loadInsights(sector) {
  setContent(`<div class="empty-state"><div class="spinner"></div></div>`);
  const qs = sector !== "All" ? `?sector=${encodeURIComponent(sector)}` : "";
  try {
    const res = await fetch(`${API}/insights/${qs}`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    document.getElementById("insight-count").textContent = data.length;
    if (!data.length) {
      setContent(`<div class="empty-state">
        <div style="font-size:2rem">📭</div>
        <p style="margin-top:0.5rem">No articles yet. Hit <strong>↻ Refresh</strong> to fetch the latest.</p>
      </div>`);
      return;
    }
    setContent(`<div class="insight-list">${data.map(insightCard).join("")}</div>`);
  } catch(e) {
    setContent(`<div class="empty-state" style="color:var(--danger)">${e.message}</div>`);
  }
}

async function fetchLatest() {
  const btn = document.getElementById("fetch-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Fetching last 7 days…`;
  try {
    const isAll = activeTab === "All";
    const url   = isAll ? `${API}/insights/fetch-all` : `${API}/insights/fetch`;
    const body  = isAll ? {} : { sector: activeTab };
    const res   = await fetch(url, { method:"POST", headers: authHeaders(), body: JSON.stringify(body) });
    const data  = await res.json();
    if (!res.ok) throw new Error(data.detail || "Fetch failed");
    const n = isAll ? (data.total || 0) : (Array.isArray(data) ? data.length : 0);
    showToast(n > 0 ? `${n} new article(s) from the last 7 days!` : "No new articles — you're up to date.", n > 0 ? "success" : "");
    loadInsights(activeTab);
  } catch(e) { showToast(e.message, "error"); }
  finally { btn.disabled = false; btn.innerHTML = "↻ Refresh"; }
}

async function deleteInsight(id, el) {
  el.style.opacity = "0.4";
  try {
    await fetch(`${API}/insights/${id}`, { method:"DELETE", headers: authHeaders() });
    el.remove();
    const remaining = document.querySelectorAll(".insight-card").length;
    document.getElementById("insight-count").textContent = remaining;
  } catch(e) { el.style.opacity="1"; showToast(e.message,"error"); }
}

function insightCard(ins) {
  const up = (ins.change || 0) >= 0;
  return `<div class="insight-card" id="ic-${ins.id}">
    <div class="card-top">
      <div class="card-title">${esc(ins.title)}</div>
    </div>
    <div class="card-meta">
      <span class="badge sector-badge" data-sector="${esc(ins.sector)}">${SECTOR_ICONS[ins.sector]||"📌"} ${esc(ins.sector)}</span>
      <span class="badge source-badge">${esc(ins.source)}</span>
      <span class="card-date">${fmtDate(ins.fetched_at)}</span>
    </div>
    <div class="card-summary">${esc(ins.summary||"No summary available.")}</div>
    <div class="card-footer">
      <a href="${esc(ins.url)}" target="_blank" rel="noopener">Read full article →</a>
      <button class="btn btn-danger" onclick="deleteInsight(${ins.id},document.getElementById('ic-${ins.id}'))">Remove</button>
    </div>
  </div>`;
}

/* ─────────────────────────────────────────────────────────────
   STOCKS PANEL
──────────────────────────────────────────────────────────────*/
const STOCK_SECTORS = ["Tech","AI","Finance","Pharma","Aerospace","Energy","Science"];
let activeStockSector = "Tech";
let stockSectorCache  = {};

function renderStocksPanel() {
  setContent(`
    <div id="stocks-panel">
      <div class="search-row" id="stock-search-area">
        <div class="inline-search-box">
          <input id="stock-input" type="text" placeholder="Search any company or ticker (e.g. Apple, TSLA, Samsung)…" autocomplete="off"/>
          <button class="btn btn-primary" onclick="doStockSearch()">Search</button>
        </div>
        <div id="stock-suggestions" class="suggestions-dropdown"></div>
      </div>
      <div id="stock-detail-area"></div>
      <div class="stock-sector-bar">
        ${STOCK_SECTORS.map((s,i)=>`
          <button class="stock-sector-btn${i===0?" active":""}" onclick="loadStockSector('${s}',this)">
            ${SECTOR_ICONS[s]||""} ${s}
          </button>`).join("")}
      </div>
      <div id="stocks-grid" class="stocks-grid">
        <div class="empty-state"><div class="spinner"></div></div>
      </div>
    </div>`);

  // Wire search
  const inp = document.getElementById("stock-input");
  inp.addEventListener("keydown", e => { if(e.key==="Enter") doStockSearch(); });
  inp.addEventListener("input",   e => stockLiveSuggest(e.target.value.trim()));

  loadStockSector("Tech", document.querySelector(".stock-sector-btn.active"));
}

async function loadStockSector(sector, btn) {
  activeStockSector = sector;
  document.querySelectorAll(".stock-sector-btn").forEach(b=>b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const grid = document.getElementById("stocks-grid");
  if (!grid) return;

  // Use cache if available
  if (stockSectorCache[sector]) { renderStockGrid(stockSectorCache[sector]); return; }

  grid.innerHTML = `<div class="empty-state"><div class="spinner"></div><p style="margin-top:0.5rem;color:var(--muted)">Loading ${sector}…</p></div>`;
  try {
    const res  = await fetch(`${API}/stocks/sector/${sector}`, { headers: authHeaders() });
    const data = await res.json();
    stockSectorCache[sector] = data;
    renderStockGrid(data);
    document.getElementById("insight-count").textContent = data.length;
  } catch(e) {
    grid.innerHTML = `<div class="empty-state" style="color:var(--danger)">${e.message}</div>`;
  }
}

function renderStockGrid(stocks) {
  const grid = document.getElementById("stocks-grid");
  if (!grid) return;
  grid.innerHTML = stocks.map(s => miniStockCard(s)).join("");
}

function miniStockCard(s) {
  const up    = (s.change||0) >= 0;
  const arrow = up ? "▲" : "▼";
  const cls   = up ? "up" : "down";
  const price = s.price != null ? `$${s.price.toFixed(2)}` : "—";
  const chg   = s.change != null ? `${up?"+":""}${s.change} (${up?"+":""}${s.change_pct}%)` : "—";
  const isFav = favoriteTickers.includes(s.ticker);

  return `<div class="stock-mini-card" id="smc-${s.ticker}">
    <div class="smc-top">
      <div>
        <div class="smc-ticker">${esc(s.ticker)}</div>
        <div class="smc-name">${esc(s.name)}</div>
      </div>
      <div style="text-align:right">
        <div class="smc-price">${price}</div>
        <div class="smc-change ${cls}">${arrow} ${chg}</div>
      </div>
    </div>
    <div class="smc-stats">
      <span>Cap <strong>${s.market_cap}</strong></span>
      <span>P/E <strong>${s.pe_ratio}</strong></span>
      <span>EPS <strong>${s.eps!=="N/A"?"$"+s.eps:"N/A"}</strong></span>
    </div>
    <div class="smc-footer">
      <button class="btn btn-sm" onclick="openStockDetail('${s.ticker}')">Details →</button>
      <button class="btn fav-btn ${isFav?"fav-active":""}" id="fav-btn-${s.ticker}"
        onclick="toggleFavorite('${s.ticker}','${esc(s.name)}','${esc(s.sector||"")}',this)">
        ${isFav?"★ Saved":"☆ Save"}
      </button>
    </div>
  </div>`;
}

async function openStockDetail(ticker) {
  const area = document.getElementById("stock-detail-area");
  if (!area) return;
  area.style.display = "block";
  area.innerHTML = `<div class="empty-state"><div class="spinner"></div><p style="color:var(--muted);margin-top:0.4rem">Loading ${ticker}…</p></div>`;
  area.scrollIntoView({behavior:"smooth", block:"start"});
  try {
    const res = await fetch(`${API}/stocks/quote/${ticker}`, { headers: authHeaders() });
    const s   = await res.json();
    renderStockDetail(s, area);
  } catch(e) {
    area.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

function renderStockDetail(s, area) {
  const up    = (s.change||0) >= 0;
  const arrow = up ? "▲" : "▼";
  const cls   = up ? "up" : "down";
  const price = s.price != null ? `$${s.price.toFixed(2)}` : "—";
  const chg   = s.change != null ? `${up?"+":""}${s.change} (${up?"+":""}${s.change_pct}%)` : "—";
  const isFav = favoriteTickers.includes(s.ticker);

  const newsHtml = s.news?.length
    ? s.news.map(n=>`
        <a class="news-item" href="${esc(n.url)}" target="_blank" rel="noopener">
          <div class="news-title">${esc(n.title)}</div>
          <div class="news-provider">${esc(n.provider)}</div>
        </a>`).join("")
    : `<p style="color:var(--muted);font-size:0.85rem">No recent news found.</p>`;

  area.innerHTML = `
    <div class="stock-detail-card">
      <div class="sdc-header">
        <div>
          <div class="sdc-ticker">${s.ticker}</div>
          <div class="sdc-name">${esc(s.name)}</div>
          <div style="font-size:0.8rem;color:var(--muted)">${esc(s.sector||"")} · ${esc(s.industry||"")}</div>
        </div>
        <div style="text-align:right">
          <div class="sdc-price">${price}</div>
          <div class="sdc-change ${cls}">${arrow} ${chg}</div>
          <button class="btn fav-btn ${isFav?"fav-active":""} mt-sm" id="fav-btn-${s.ticker}-detail"
            onclick="toggleFavorite('${s.ticker}','${esc(s.name)}','${esc(s.sector||"")}',this)">
            ${isFav?"★ Saved":"☆ Save to Favorites"}
          </button>
        </div>
      </div>
      <div class="sdc-metrics">
        ${met("Market Cap",s.market_cap)} ${met("P/E (TTM)",s.pe_ratio)}
        ${met("Forward P/E",s.forward_pe)} ${met("EPS","$"+s.eps)}
        ${met("Revenue",s.revenue)} ${met("Gross Margin",s.gross_margin)}
        ${met("Dividend",s.dividend_yield)} ${met("Beta",s.beta)}
        ${met("52W High",s.week_52_high?"$"+s.week_52_high:"N/A")}
        ${met("52W Low",s.week_52_low?"$"+s.week_52_low:"N/A")}
        ${met("Avg Volume",s.avg_volume)} ${met("Employees",s.employees)}
      </div>
      <div class="sdc-section">
        <div class="sdc-section-title">About</div>
        <p class="sdc-desc">${esc(s.description)}</p>
        ${s.website?`<a href="${esc(s.website)}" target="_blank" rel="noopener" style="font-size:0.85rem;margin-top:0.4rem;display:inline-block">🔗 ${esc(s.website)}</a>`:""}
      </div>
      <div class="sdc-section">
        <div class="sdc-section-title">Latest News</div>
        <div class="news-list">${newsHtml}</div>
      </div>
      <button class="btn btn-ghost" onclick="this.closest('.stock-detail-card').parentElement.style.display='none'"
        style="margin-top:1rem">✕ Close</button>
    </div>`;
}

function met(label, val) {
  return `<div class="metric-cell"><div class="metric-label">${label}</div><div class="metric-value">${val}</div></div>`;
}

/* ─────────────────────────────────────────────────────────────
   FAVORITES
──────────────────────────────────────────────────────────────*/
async function loadFavoriteTickers() {
  try {
    const res = await fetch(`${API}/favorites/tickers`, { headers: authHeaders() });
    favoriteTickers = await res.json();
  } catch(_) { favoriteTickers = []; }
}

async function toggleFavorite(ticker, name, sector, btn) {
  const isFav = favoriteTickers.includes(ticker);
  try {
    if (isFav) {
      await fetch(`${API}/favorites/${ticker}`, { method:"DELETE", headers: authHeaders() });
      favoriteTickers = favoriteTickers.filter(t => t !== ticker);
      // update all buttons for this ticker
      document.querySelectorAll(`[id^="fav-btn-${ticker}"]`).forEach(b => {
        b.textContent = "☆ Save"; b.classList.remove("fav-active");
      });
      showToast(`${ticker} removed from favorites`);
    } else {
      await fetch(`${API}/favorites/`, {
        method:"POST", headers: authHeaders(),
        body: JSON.stringify({ ticker, name, sector })
      });
      favoriteTickers.push(ticker);
      document.querySelectorAll(`[id^="fav-btn-${ticker}"]`).forEach(b => {
        b.textContent = "★ Saved"; b.classList.add("fav-active");
      });
      showToast(`${ticker} added to favorites!`, "success");
    }
  } catch(e) { showToast(e.message, "error"); }
}

async function renderFavoritesPanel() {
  setContent(`<div class="empty-state"><div class="spinner"></div></div>`);
  try {
    const res  = await fetch(`${API}/favorites/`, { headers: authHeaders() });
    const favs = await res.json();
    document.getElementById("insight-count").textContent = favs.length;

    if (!favs.length) {
      setContent(`<div class="empty-state">
        <div style="font-size:2rem">⭐</div>
        <p style="margin-top:0.5rem">No favorites yet.<br>
        Search for a company or browse <strong>📈 Stocks</strong> and click <em>☆ Save</em>.</p>
      </div>`);
      return;
    }

    setContent(`<div class="empty-state"><div class="spinner"></div><p style="margin-top:0.5rem;color:var(--muted)">Loading live data…</p></div>`);

    // Fetch live data for each favorite in parallel
    const cards = await Promise.all(favs.map(async fav => {
      try {
        const r = await fetch(`${API}/stocks/quote/${fav.ticker}`, { headers: authHeaders() });
        return await r.json();
      } catch(_) { return { ticker: fav.ticker, name: fav.name, price: null, change: null }; }
    }));

    document.getElementById("insight-count").textContent = cards.length;
    setContent(`<div class="stocks-grid">${cards.map(s => miniStockCard(s)).join("")}</div>`);
  } catch(e) {
    setContent(`<div class="empty-state" style="color:var(--danger)">${e.message}</div>`);
  }
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL SEARCH (nav bar)
──────────────────────────────────────────────────────────────*/
function initGlobalSearch() {
  const inp  = document.getElementById("global-search");
  const box  = document.getElementById("global-suggestions");
  let timer;

  inp.addEventListener("input", () => {
    const q = inp.value.trim();
    clearTimeout(timer);
    if (q.length < 1) { box.style.display="none"; return; }
    timer = setTimeout(() => globalSuggest(q), 350);
  });

  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const q = inp.value.trim();
      box.style.display = "none";
      if (q) { goToStocksAndSearch(q); }
    }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".global-search-wrap")) box.style.display = "none";
  });
}

async function globalSuggest(q) {
  const box = document.getElementById("global-suggestions");
  try {
    const res  = await fetch(`${API}/stocks/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.length) { box.style.display="none"; return; }
    box.style.display = "block";
    box.innerHTML = data.map(r => `
      <div class="suggestion-item" onclick="goToStocksAndSearch('${esc(r.ticker)}')">
        <strong>${esc(r.ticker)}</strong>
        <span style="color:var(--muted);margin-left:0.5rem;flex:1">${esc(r.name)}</span>
        <span class="badge" style="font-size:0.7rem">${esc(r.exchange)}</span>
      </div>`).join("");
  } catch(_) { box.style.display="none"; }
}

function goToStocksAndSearch(ticker) {
  document.getElementById("global-search").value = "";
  document.getElementById("global-suggestions").style.display = "none";
  // Switch to Stocks tab then open detail
  const btn = document.querySelector('[data-sector="Stocks"]');
  switchTab("Stocks", btn);
  setTimeout(() => openStockDetail(ticker), 100);
}

/* ─────────────────────────────────────────────────────────────
   STOCK SEARCH (in stocks panel)
──────────────────────────────────────────────────────────────*/
let stockSuggestTimer;
async function stockLiveSuggest(q) {
  const box = document.getElementById("stock-suggestions");
  if (!box) return;
  clearTimeout(stockSuggestTimer);
  if (q.length < 1) { box.style.display="none"; return; }
  stockSuggestTimer = setTimeout(async () => {
    try {
      const res  = await fetch(`${API}/stocks/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.length) { box.style.display="none"; return; }
      box.style.display = "block";
      box.innerHTML = data.map(r => `
        <div class="suggestion-item" onclick="pickStockSuggestion('${esc(r.ticker)}')">
          <strong>${esc(r.ticker)}</strong>
          <span style="color:var(--muted);margin-left:0.5rem;flex:1">${esc(r.name)}</span>
          <span class="badge" style="font-size:0.7rem">${esc(r.exchange)}</span>
        </div>`).join("");
    } catch(_){}
  }, 350);
}

function pickStockSuggestion(ticker) {
  const inp = document.getElementById("stock-input");
  const box = document.getElementById("stock-suggestions");
  if (inp) inp.value = ticker;
  if (box) box.style.display = "none";
  openStockDetail(ticker);
}

function doStockSearch() {
  const inp = document.getElementById("stock-input");
  const box = document.getElementById("stock-suggestions");
  const q   = inp?.value.trim();
  if (box) box.style.display = "none";
  if (q)  openStockDetail(q.toUpperCase());
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
──────────────────────────────────────────────────────────────*/
function setContent(html) {
  document.getElementById("main-content").innerHTML = html;
}

function esc(s) {
  if (!s && s !== 0) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

let toastTimer;
function showToast(msg, type="") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className=""; }, 3500);
}

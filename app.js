/* app.js — the four-stage draw: When → Where → Life → Story. */

"use strict";

/* ---------- RNG and helpers ---------- */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let RNG = mulberry32((Date.now() & 0xffffff) >>> 0);

const rand = () => RNG();
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (items, w) => {
  const total = items.reduce((s, i) => s + (w(i) || 0), 0);
  let r = rand() * total;
  for (const item of items) { r -= w(item) || 0; if (r <= 0) return item; }
  return items[items.length - 1];
};

const $ = (s) => document.querySelector(s);
const el = (id) => document.getElementById(id);
const hash = (s) => { let h = 0; for (const c of s) { h = ((h << 5) - h + c.charCodeAt(0)) | 0; } return h >>> 0; };
const YEAR_MIN = 600, YEAR_MAX = 1527;

// He/she pronouns: rewrite the historical-voice texts (written with "they")
// into the person's own pronouns, preserving capitalisation.
function pronounify(text, sex) {
  const fem = sex === 'female';
  const map = { 'they': fem ? 'she' : 'he', 'them': fem ? 'her' : 'him',
    'their': fem ? 'her' : 'his', 'theirs': fem ? 'hers' : 'his',
    'themselves': fem ? 'herself' : 'himself' };
  return text.replace(/\b(they|them|their|theirs|themselves)\b/gi, (m) => {
    const rep = map[m.toLowerCase()] || m;
    return (m[0] === m[0].toUpperCase()) ? rep[0].toUpperCase() + rep.slice(1) : rep;
  });
}
function srcTag(key, estimate) {
  if (ACTIVE_SOURCES) ACTIVE_SOURCES.add(key);
  const s = SOURCES.find(x => x.key === key);
  const name = s ? s.label.split(',')[0] : 'unattributed';
  const label = `${name}${estimate ? ' · est.' : ''}`;
  return s?.url ? `<a class="src-chip" href="${s.url}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="src-chip">${label}</span>`;
}
let ACTIVE_SOURCES = null;

/* ---------- stages ---------- */
const STAGES = ['when', 'where', 'life', 'story'];
let current = null;
let played = new Set();

function showStage(name) {
  current = name;
  for (const s of STAGES) el(`stage-${s}`).hidden = (s !== name);
  el('hero').hidden = true;
  el('about').hidden = true;
  el('progress').hidden = false;
  paintRail();
  window.scrollTo(0, 0);
}

function paintRail() {
  document.querySelectorAll('#progress li').forEach((li) => {
    const s = li.dataset.stage;
    const i = STAGES.indexOf(s);
    const here = STAGES.indexOf(current);
    li.classList.toggle('active', s === current);
    li.classList.toggle('done', i < here || played.has(s));
    const btn = li.querySelector('button');
    btn.disabled = !(played.has(s) || (i <= here));
  });
}

document.querySelectorAll('#progress li button').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const s = e.target.closest('li').dataset.stage;
    if (!played.has(s) && s !== current) return;
    showStage(s);
    if (s === 'story') renderStory();
    else if (s === 'life') renderLife();
    else if (s === 'where') renderWhere();
    else if (s === 'when') renderWhen();
  });
});

/* ---------- hash state ---------- */
function setHash() {
  try {
    const parts = [`s=${SEED}`];
    if (current) parts.push(`stage=${current}`);
    history.replaceState(null, '', `#${parts.join('&')}`);
  } catch { /* sandboxed frames keep no URL: seeding still works in memory */ }
}

/* ---------- stage 1: when ---------- */
function popAt(year) {
  const P = POPULATION;
  if (year <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) {
    if (year <= P[i][0]) {
      const [x0, y0] = P[i - 1], [x1, y1] = P[i];
      return y0 + (y1 - y0) * (year - x0) / (x1 - x0);
    }
  }
  return P[P.length - 1][1];
}
function drawYear() {
  const CUM = [];
  let cum = 0;
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) { cum += popAt(y); CUM.push([y, cum]); }
  const target = rand() * cum;
  let lo = 0, hi = CUM.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (CUM[mid][1] < target) lo = mid + 1; else hi = mid; }
  return CUM[lo][0];
}

function drawPopGraph() {
  const svg = el('pop-graph');
  if (svg.dataset.drawn) return;
  svg.dataset.drawn = '1';
  const W = 400, H = 180, LEFT = 58, RIGHT = 12, TOP = 16, BOT = 30;
  const MAXP = 600000;
  const x = (y) => LEFT + (y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * (W - LEFT - RIGHT);
  const yy = (p) => H - BOT - (p / MAXP) * (H - TOP - BOT);
  let d = `M ${x(YEAR_MIN)} ${yy(popAt(YEAR_MIN))}`;
  for (let y = YEAR_MIN; y <= YEAR_MAX; y += 5) d += ` L ${x(y)} ${yy(popAt(y))}`;
  if ((YEAR_MAX - YEAR_MIN) % 5 !== 0) d += ` L ${x(YEAR_MAX)} ${yy(popAt(YEAR_MAX))}`;
  const area = d + ` L ${x(YEAR_MAX)} ${H - BOT} L ${x(YEAR_MIN)} ${H - BOT} Z`;
  let grid = '';
  for (let t = 0; t <= MAXP; t += 100000) {
    const y = yy(t);
    grid += `<line x1="${LEFT}" y1="${y}" x2="${W - RIGHT}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`
      + `<text x="${LEFT - 8}" y="${y + 3}" text-anchor="end" class="axis-label">${t === 0 ? '0' : (t / 1000) + 'k'}</text>`;
  }
  const xticks = [600, 800, 1000, 1200, 1400, 1527];
  let xaxis = '';
  for (const t of xticks) {
    xaxis += `<line x1="${x(t)}" y1="${H - BOT}" x2="${x(t)}" y2="${H - BOT + 5}" stroke="var(--muted)"/>`
      + `<text x="${x(t)}" y="${H - BOT + 18}" text-anchor="middle" class="axis-label">${t}</text>`;
  }
  svg.innerHTML = `
    <path d="${area}" fill="var(--accent-dim)"/>
    <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${grid}
    <line x1="${LEFT}" y1="${TOP - 8}" x2="${LEFT}" y2="${H - BOT}" stroke="var(--muted)" stroke-width="1.5"/>
    <line x1="${LEFT}" y1="${H - BOT}" x2="${W - RIGHT}" y2="${H - BOT}" stroke="var(--muted)" stroke-width="1.5"/>
    ${xaxis}
    <text x="${LEFT - 44}" y="${(H - BOT + TOP) / 2}" class="axis-title" transform="rotate(-90 ${LEFT - 44} ${(H - BOT + TOP) / 2})" text-anchor="middle">Population (estimate)</text>
    <text x="${(LEFT + W - RIGHT) / 2}" y="${H - 4}" text-anchor="middle" class="axis-title">Birth year</text>
    <g id="year-marker" visibility="hidden" pointer-events="none"><line id="year-marker-line" y1="${TOP}" y2="${H - BOT}" stroke="var(--danger)" stroke-dasharray="3 3"/><circle id="year-marker-dot" cy="0" r="5" fill="var(--danger)"/></g>`;
  svg.addEventListener('click', (e) => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const year = Math.round(YEAR_MIN + (loc.x - LEFT) / (W - LEFT - RIGHT) * (YEAR_MAX - YEAR_MIN));
    if (year >= YEAR_MIN && year <= YEAR_MAX) setSelectedYear(year);
  });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Estimated population by birth year, 600 to 1527. Click the graph to select a year.');
}
function setSelectedYear(year) {
  const value = Number(year);
  if (!Number.isFinite(value)) return;
  const y = Math.max(YEAR_MIN, Math.min(YEAR_MAX, Math.round(value)));
  el('year-range').value = y; el('year-number').value = y; el('year-output').textContent = y;
  const svg = el('pop-graph'), marker = el('year-marker');
  const W = 400, H = 180, LEFT = 58, RIGHT = 12, TOP = 16, BOT = 30, MAXP = 600000;
  const x = LEFT + (y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * (W - LEFT - RIGHT);
  const py = H - BOT - (popAt(y) / MAXP) * (H - TOP - BOT);
  marker.setAttribute('visibility', 'visible');
  el('year-marker-line').setAttribute('x1', x); el('year-marker-line').setAttribute('x2', x);
  el('year-marker-dot').setAttribute('cx', x); el('year-marker-dot').setAttribute('cy', py);
}

function renderWhen() {
  drawPopGraph();
  el('when-src').innerHTML = 'Population curve is an illustrative model, not a census series; figures after 1463 are especially uncertain. See <a href="#" onclick="showAbout();return false;">sources and method</a>.';
}

/* ---------- stage 2: where — real terrain map ---------- */
let NAME_MODE = 'medieval';
function mapXY(lat, lon, W, H) {
  const B = MAP_BOUNDS;
  const x = (lon - B.left) / (B.right - B.left) * W;
  const y = (B.top - lat) / (B.top - B.bottom) * H;
  return { x, y };
}
function drawRegion() {
  // Weighted by population weight of each medieval land.
  return weighted(REGIONS, (r) => r.weight);
}
function placeName(place) {
  return NAME_MODE === 'medieval' ? (place.medieval || place.name) : place.name;
}
function drawPopMap() {
  const svg = el('map-svg');
  const W = 400, H = 400 * (MAP_BOUNDS.top - MAP_BOUNDS.bottom) / (MAP_BOUNDS.right - MAP_BOUNDS.left) * MAP_STRETCH;
  svg.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(1)}`);
  if (!svg.dataset.drawn) {
    svg.dataset.drawn = '1';
    const im = IMAGES.terrain;
    let inner = `<image href="${im.src}" x="0" y="0" width="${W}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`;
    for (const c of REGION_CENTROIDS) {
      const { x, y } = mapXY(c.lat, c.lon, W, H);
      inner += `<text x="${x}" y="${y}" text-anchor="middle" class="map-label">${c.name}</text>`;
    }
    for (const p of PLACES) {
      const { x, y } = mapXY(p.lat, p.lon, W, H);
      inner += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.major ? 5 : 3.4}" data-place="${p.name}" class="place-dot${p.major ? '' : ' small'}">`
        + `<title>${placeName(p)} — ${p.kind} (${p.name})</title></circle>`;
      if (p.major) inner += `<text x="${(x + 6).toFixed(1)}" y="${(y - 5).toFixed(1)}" data-place-label="${p.name}" class="city-label">${placeName(p)}</text>`;
    }
    inner += `<circle id="map-selected-dot" r="7" class="map-selected" visibility="hidden"/>`;
    inner += `<text id="map-selected-label" x="0" y="0" text-anchor="middle" class="place-label sel" visibility="hidden"></text>`;
    svg.innerHTML = inner;
    svg.querySelectorAll('.place-dot').forEach((dot) => {
      dot.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const place = PLACES.find(x => x.name === dot.dataset.place);
        if (place) selectPlace(place);
      });
      dot.setAttribute('tabindex', '0'); dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', `${placeName(PLACES.find(x => x.name === dot.dataset.place))} (${dot.dataset.place})`);
      dot.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); dot.click(); } });
    });
    svg.querySelectorAll('.city-label').forEach(label => label.setAttribute('visibility', 'visible'));
    svg.addEventListener('click', (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      const loc = pt.matrixTransform(ctm.inverse());
      const near = nearestPlace(loc.x, loc.y, W, H);
      if (near) selectPlace(near);
    });
  }
  markSelectedOnMap(W, H);
}
function nearestPlace(px, py, W, H) {
  let best = null, bestD = Infinity;
  for (const p of PLACES) {
    const { x, y } = mapXY(p.lat, p.lon, W, H);
    const d = (x - px) ** 2 + (y - py) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
function markSelectedOnMap(W, H) {
  const dot = document.getElementById('map-selected-dot');
  const label = document.getElementById('map-selected-label');
  if (!dot || !drawn.place) return;
  const { x, y } = mapXY(drawn.place.lat, drawn.place.lon, W, H);
  dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1));
  dot.setAttribute('visibility', 'visible');
  label.setAttribute('x', x.toFixed(1)); label.setAttribute('y', (y - 9).toFixed(1));
  label.textContent = placeName(drawn.place);
  label.setAttribute('visibility', 'visible');
}
function selectPlace(place) {
  drawn.place = place;
  drawn.region = place.region;
  drawPopMap();
  const region = REGIONS.find(r => r.id === place.region);
  el('where-result').textContent = `${placeName(place)}${NAME_MODE === 'medieval' && place.medieval && place.medieval !== place.name ? ` (today ${place.name})` : ''} — ${region.name}`;
  const kind = place.kind === 'fortress' ? 'a fortress town' : place.kind === 'mining' ? 'a mining town'
    : place.kind === 'monastery' ? 'a monastery village' : place.kind === 'market' ? 'a market town'
    : place.kind === 'border town' ? 'a border town (frontier)' : place.kind === 'town' ? 'a town' : 'a village';
  el('where-sub').textContent = `${kind}. ${region.hint[0].toUpperCase() + region.hint.slice(1)}.`;
  el('where-select').hidden = true;
  el('where-again').hidden = false;
  el('where-next').hidden = false;
  setHash();
}
function setNameMode(mode) {
  NAME_MODE = mode;
  drawPopMap();
  const svg = el('map-svg');
  // refresh tooltips + selected label
  svg.querySelectorAll('.place-dot').forEach(c => {
    const p = PLACES.find(x => x.name === c.dataset.place);
    if (p) c.querySelector('title').textContent = `${placeName(p)} — ${p.kind} (${p.name})`;
  });
  svg.querySelectorAll('.city-label').forEach(label => {
    const p = PLACES.find(x => x.name === label.dataset.placeLabel);
    if (p) label.textContent = placeName(p);
  });
  if (drawn.place) selectPlace(drawn.place);
  el('toggle-modern').classList.toggle('is-on', mode === 'modern');
  el('toggle-medieval').classList.toggle('is-on', mode === 'medieval');
}
function renderWhere() {
  drawPopMap();
  el('region-choices').innerHTML = REGIONS.map(r => `<button type="button" class="toggle-btn" data-region="${r.id}">${r.name}</button>`).join('');
  el('region-choices').querySelectorAll('[data-region]').forEach(btn => btn.addEventListener('click', () => {
    const choices = PLACES.filter(p => p.region === btn.dataset.region);
    const place = weighted(choices, p => p.major ? 3 : 1);
    selectPlace(place);
  }));
  el('where-src').innerHTML = 'Terrain base: <a href="https://commons.wikimedia.org/wiki/File:Bosnia_and_Herzegovina_relief_location_map.svg" target="_blank" rel="noopener noreferrer">Wikimedia Commons relief map</a> (DzWiki & NordNordWest, CC BY-SA 3.0). Historical place and region context: <a href="https://press.umich.edu/Books/T/The-Late-Medieval-Balkans" target="_blank" rel="noopener noreferrer">Fine, The Late Medieval Balkans</a> and <a href="https://nyupress.org/9780814755617/bosnia/" target="_blank" rel="noopener noreferrer">Malcolm, Bosnia: A Short History</a>. Settlement coordinates are approximate modern locations; historical region boundaries and labels are schematic.';
}

/* ---------- demographics summary (estimated from the life model) ---------- */
function lifeProfile(year) {
  // Broad scenario ranges, not measured medieval-Bosnian vital statistics.
  // Their variation is intentional and visible in the UI; evidence is sparse.
  if (year < 900) return { childMortality: .40, annualAdultHazard: .020, births: 4.8, label: 'early medieval' };
  if (year < 1200) return { childMortality: .36, annualAdultHazard: .018, births: 5.0, label: 'high medieval' };
  if (year < 1349) return { childMortality: .34, annualAdultHazard: .017, births: 5.4, label: 'late medieval, pre-plague' };
  if (year <= 1351) return { childMortality: .42, annualAdultHazard: .024, births: 5.1, label: 'Black Death years' };
  if (year < 1463) return { childMortality: .38, annualAdultHazard: .020, births: 4.9, label: 'late medieval' };
  return { childMortality: .36, annualAdultHazard: .019, births: 4.6, label: 'Ottoman-Hungarian frontier era' };
}
function drawSummary(year) {
  const profile = lifeProfile(year), saved = RNG, rng = mulberry32(0xB05A + year);
  RNG = rng;
  const lives = Array.from({ length: 1600 }, () => pickLifespan(year));
  const mean = lives.reduce((a, b) => a + b, 0) / lives.length;
  const sorted = lives.slice().sort((a, b) => a - b);
  const paths = OCCUPATIONS.map(o => ({ label: o.label.replace(/^(a|an) /, ''), pct: o.weight * 100 }))
    .sort((a, b) => b.pct - a.pct).slice(0, 5);
  RNG = saved;
  return { profile, mean, median: sorted[Math.floor(sorted.length / 2)], child: lives.filter(l => l < 5).length / lives.length, paths };
}

function renderDemoStats() {
  const c = drawSummary(drawn.year || YEAR_MIN);
  const top = c.paths.slice(0, 5);
  el('demo-stats').innerHTML = [
    ['Mean lifespan', `${Math.round(c.mean)} years (est.)`],
    ['Median lifespan', `${Math.round(c.median)} years (est.)`],
    ['Childhood mortality', `${Math.round(c.child * 100)}% die before age 5 (est.)`],
    ['Children per household', `about ${c.profile.births.toFixed(1)} (est.)`],
    ['Period model', c.profile.label],
    ['Typical life paths', top.map(t => `${t.label} ${Math.round(t.pct)}%`).join(' · ')],
    ['Possible hazards', c.profile.label === 'Black Death years' ? 'plague · childhood illness · childbirth · accident (est.)' : 'childhood illness · childbirth · accident · conflict (est.)'],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
}

/* ---------- stage 3: life ---------- */
function pickName(sex, occ) {
  const pool = occ.noble ? NAMES[sex].noble : NAMES[sex].common;
  return pick(pool);
}
function pickReligion(year, regionId) {
  if (year < 1100) return { id: 'unknown', weight: 1, label: 'not specified — evidence is too sparse for this modeled life' };
  let items = RELIGIONS.slice();
  if (year < 1203) items = items.filter(r => r.id !== 'krstjanin');
  if (regionId === 'podrinje' || regionId === 'soli' || regionId === 'hum') {
    items = items.map(r => r.id === 'orthodox' ? { ...r, weight: r.weight * 2.2 } : r);
  }
  if (regionId === 'donjikraji' || regionId === 'krajina' || regionId === 'usora') {
    items = items.map(r => r.id === 'catholic' ? { ...r, weight: r.weight * 1.4 } : r);
  }
  if (year < 1100) {
    items = items.map(r => r.id === 'catholic' ? { ...r, weight: r.weight * 1.6 } : r);
  } else if (year > 1350) {
    items = items.map(r => {
      if (r.id === 'krstjanin') return { ...r, weight: r.weight * 0.7 };
      if (r.id === 'catholic') return { ...r, weight: r.weight * 1.5 };
      return r;
    });
  }
  return weighted(items, (i) => i.weight);
}
function pickOccupation(nobleOnly, year) {
  const available = OCCUPATIONS.filter(o => !(year < 1203 && o.id === 'krstjanin'));
  if (nobleOnly) {
    return weighted(available.filter(o => o.noble), (o) => o.weight);
  }
  return weighted(available, (o) => o.weight);
}
function pickLifespan(year) {
  const profile = lifeProfile(year);
  if (rand() < profile.childMortality) return Math.floor(rand() * 5);
  let age = 5;
  while (age < 100) {
    const rate = age < 45 ? profile.annualAdultHazard : age < 60 ? profile.annualAdultHazard * 2.7 : age < 75 ? profile.annualAdultHazard * 5 : .15;
    if (rand() < rate) break;
    age++;
  }
  return age;
}
function rulerAt(year) {
  if (year > 1527) return { from: 1528, to: year, name: 'beyond this model’s historical window', title: 'not modeled', note: 'this person outlived the game’s 1527 birth-year boundary; later political context is not modeled' };
  for (const r of RULERS) if (year >= r.from && year <= r.to) return r;
  return RULERS[RULERS.length - 1];
}
function lordAt(regionId, year) {
  if (year > 1463) return { from: 1464, to: 1527, house: 'regional rule not modeled here', note: 'after the 1463 conquest, detailed local lordship is outside this life model' };
  const region = REGIONS.find(r => r.id === regionId);
  for (const l of region.lords) if (year >= l.from && year <= l.to) return l;
  return region.lords[region.lords.length - 1];
}
function reignsOver(birth, death) {
  const list = RULERS.filter(r => r.to >= birth && r.from <= death);
  return list.map(r => {
    const from = Math.max(r.from, birth), to = Math.min(r.to, death);
    return `${r.name} — reigned ${r.from}${r.to < 9000 ? '–' + r.to : ''} (${from === r.from ? '' : 'from ' + from + ' '})`.trim();
  });
}
function lordSpansOver(regionId, birth, death) {
  const region = REGIONS.find(r => r.id === regionId);
  const list = region.lords.filter(l => l.to >= birth && l.from <= Math.min(death, 1463)).map(l => {
    const from = Math.max(l.from, birth), to = Math.min(l.to, death, 1463);
    return `${l.house} — ${from}–${to}`;
  });
  if (death > 1463) list.push('local lordship after 1463 not modeled');
  return list;
}
function eventsIn(birth, death, regionId, occId) {
  const list = EVENTS.filter(e =>
    death >= e.year && birth <= (e.end ?? e.year)
    && (e.regions === 'all' || (Array.isArray(e.regions) && e.regions.includes(regionId)))
    && (e.classes === 'all' || (Array.isArray(e.classes) && e.classes.includes(occId))));
  return list.map(e => ({ ...e, at: Math.max(birth, Math.min(death, e.year)) }));
}

function buildFamily(life) {
  const p = life;
  const fam = [];
  const father = pick(p.sex === 'female' ? NAMES.male.common : NAMES.male.common);
  fam.push({ name: father, relation: 'father', born: p.year - (26 + Math.floor(rand() * 10)), died: p.year + (30 + Math.floor(rand() * 30)) });
  const mother = pick(NAMES.female.common);
  const motherDeath = p.year + (25 + Math.floor(rand() * 20));
  fam.push({ name: mother, relation: 'mother', born: p.year - (24 + Math.floor(rand() * 8)), died: motherDeath });
  const nSib = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < nSib; i++) {
    const sx = rand() < 0.5 ? 'female' : 'male';
    const born = p.year + Math.floor((rand() - 0.5) * 14);
    const diesYoung = rand() < 0.32;
    fam.push({ name: pick(sx === 'female' ? NAMES.female.common : NAMES.male.common), relation: sx === 'female' ? 'sister' : 'brother', born, died: diesYoung ? born + Math.floor(rand() * 5) : p.year + (35 + Math.floor(rand() * 35)), sex: sx });
  }
  return fam;
}

function childProfession(occ, sex) {
  const fam = occ.label.replace(/^a /, 'a ').replace(/^an /, 'an ');
  return `a child of ${fam}'s household`;
}
function drawLife() {
  const year = drawn.year;
  const region = REGIONS.find(r => r.id === drawn.region);
  const nobleOnly = el('noble-only').checked;
  const occ = pickOccupation(nobleOnly, year);
  const sex = rand() < 0.5 ? 'female' : 'male';
  const name = pickName(sex, occ);
  const religion = occ.id === 'krstjanin'
    ? RELIGIONS.find(r => r.id === 'krstjanin')
    : pickReligion(year, region.id);
  const lifespan = pickLifespan(year);
  const deathYear = year + lifespan;
  const householdChildren = lifespan >= 16
    ? Math.max(0, Math.min(10, Math.round(lifeProfile(year).births + (rand() - .5) * 4))) : 0;
  const place = drawn.place || weighted(PLACES.filter(p => p.region === region.id), p => p.major ? 3 : 1);
  const typeLabel = place.kind === 'fortress' ? 'a fortress town' : place.kind === 'mining' ? 'a mining town'
    : place.kind === 'monastery' ? 'a monastery village' : place.kind === 'market' ? 'a market town'
    : place.kind === 'town' ? 'a town' : 'a village';
  const child = lifespan < 16;
  const titleOcc = child ? childProfession(occ, sex) : occ.label;
  return {
    year, region: region.id, occ, sex, name, religion, lifespan, deathYear,
    titleOcc, child,
    settlement: place.name, settlementType: typeLabel,
    ruler: rulerAt(year), lord: lordAt(region.id, year),
    events: eventsIn(year, deathYear, region.id, occ.id),
    family: buildFamily({ year, sex, deathYear }), householdChildren,
    reigns: reignsOver(year, deathYear),
    lordSpans: lordSpansOver(region.id, year, deathYear),
    nobleOnly,
  };
}

function renderLife() {
  renderDemoStats();
  el('life-src').innerHTML = 'Demographic values are explicit scenario assumptions, not measured Bosnian statistics; they vary by broad period and are not calibrated to a surviving census. See <a href="#" onclick="showAbout();return false;">sources and method</a>.';
  if (!drawn.life) {
    el('life-card').hidden = true;
    el('generate').hidden = false;
    el('life-again').hidden = true;
    el('life-hint').textContent = 'Choose whether to sample only from the nobility, then press Generate life.';
    return;
  }
  renderLifeCard();
}
function renderLifeCard() {
  const p = drawn.life;
  el('life-card').hidden = false;
  el('generate').hidden = true;
  el('life-again').hidden = false;
  // Title at the TOP: name, walk of life, years.
  el('life-title').textContent = p.child
    ? `${p.name}, ${p.titleOcc}, died at ${p.lifespan}, ${p.year}–${p.deathYear}`
    : `${p.name}, ${p.titleOcc}, lived ${p.lifespan} years, ${p.year}–${p.deathYear}`;
  el('life-stats').innerHTML = [
    ['Born', `${p.year} in ${p.settlement}`],
    ['Region', REGIONS.find(r => r.id === p.region).name],
    ['Biological sex', p.sex],
    ['Faith', p.religion.label],
    ['Ruled by (at birth)', `${p.ruler.name} (${p.ruler.from}–${p.ruler.to})`],
    ['Under (at birth)', `${p.lord.house} (${p.lord.from}–${p.lord.to})`],
    ['Rulers over lifetime', p.reigns.join('; ') || '—'],
    ['Lords over lifetime', p.lordSpans.join('; ') || '—'],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
  const svg = el('tl-svg');
  const W = 360, H = 84, y = H - 18;
  const lifeSpan = Math.max(1, p.deathYear - p.year);
  const x = (yr) => 12 + (Math.max(p.year, Math.min(p.deathYear, yr)) - p.year) / lifeSpan * (W - 24);
  const marks = p.events.map((e) => `<circle cx="${x(e.at)}" cy="${y}" r="3" fill="var(--accent)"/>`).join('');
  svg.innerHTML = `
    <line x1="12" y1="${y}" x2="${W - 12}" y2="${y}" stroke="var(--border)"/>
    <circle cx="${x(p.year)}" cy="${y}" r="5" fill="var(--accent)" opacity="0.8"/>
    <circle cx="${x(p.deathYear)}" cy="${y}" r="5" fill="var(--danger)" opacity="0.8"/>
    ${marks}
    <text x="12" y="${H - 4}" font-size="10" fill="var(--muted)">${p.year}</text>
    <text x="${W - 12}" y="${H - 4}" text-anchor="end" font-size="10" fill="var(--muted)">${p.deathYear}</text>`;
  el('life-hint').textContent = p.events.length
    ? `${p.events.length} major event${p.events.length > 1 ? 's' : ''} touched this life.`
    : 'A quiet life, by the look of it.';
  el('life-next').hidden = false;
  el('life-next').focus();
}

/* ---------- stage 4: story ---------- */
function personalEvents(life) {
  const out = [];
  const start = life.year + 5, end = life.deathYear;
  for (let y = start; y <= end; y++) {
    if (y - life.year >= 16 && y - life.year <= 26 && rand() < 0.11) {
      out.push({ year: y, kind: 'marriage', text: pick([
        'The marriage was made, with a feast that emptied a barrel and lasted three days.',
        'They married that year, and the two households were joined.',
        'A marriage was arranged and settled, as marriages were.',
      ]) });
    }
    if (y - life.year >= 19 && y - life.year < 45 && rand() < 0.14) {
      out.push({ year: y, kind: 'child', text: pick([
        'A child was born and survived the first winter.',
        'Another child arrived in the house.',
        'A birth that year, and the family grew.',
      ]) });
    }
    if (rand() < 0.05) out.push({ year: y, kind: 'illness', text: 'A fever went through the house and left them thinner.' });
    if (rand() < 0.045) out.push({ year: y, kind: 'harvest', text: 'The harvest was poor and the winter that followed was tight.' });
    if (rand() < 0.028) out.push({ year: y, kind: 'raid', text: 'Raiders came down the valley and the cattle were driven off.' });
    if (rand() < 0.02) out.push({ year: y, kind: 'coin', text: 'Ragusan coins were passing through their hands that year.' });
  }
  return out.sort((a, b) => a.year - b.year);
}

function familyEvents(life) {
  const evs = [];
  for (const f of life.family) {
    if (f.born > life.year && f.born <= life.deathYear) {
      evs.push({ year: f.born, kind: 'family', text: `${f.relation[0].toUpperCase() + f.relation.slice(1)} ${f.name} was born.` });
    }
    const died = Math.min(f.died, life.deathYear);
    if (died > life.year && died <= life.deathYear && died > f.born) {
      const cause = died >= 1349 && died <= 1351 ? ' In this generated family story, the plague is imagined as the cause.' : '';
      evs.push({ year: died, kind: 'family', text: `${f.relation[0].toUpperCase() + f.relation.slice(1)} ${f.name} died in ${died}.${cause}` });
    }
  }
  return evs.sort((a, b) => a.year - b.year);
}

function imgFigure(key, caption, source) {
  const im = IMAGES[key];
  if (!im) return '';
  return `<figure class="story-img"><img src="${im.src}" alt="${caption}"/>`
    + `<figcaption>${caption}<br><a href="${im.page}" target="_blank" rel="noopener noreferrer">${im.title || 'Image source'}</a> · ${im.artist || 'unknown'} · ${im.license || ''}${source ? ' · ' + source : ''}${im.ai ? ' · AI-generated' : ' · not AI-generated'}</figcaption></figure>`;
}

function cultureParagraph(life) {
  const c = CULTURE;
  const bits = [];
  const customs = c.customs.filter(item => {
    if (item.text.startsWith('A slava')) return life.religion.id === 'orthodox' && life.year >= 1200;
    if (item.text.startsWith('The krstjani')) return life.religion.id === 'krstjanin' && life.year >= 1203;
    if (item.text.startsWith('The dead were buried under a stećak')) return life.year >= 1100;
    return true;
  });
  for (const group of [customs, c.food, c.clothing, c.songs, c.appearance]) {
    const item = pick(group);
    bits.push(`${pronounify(item.text, life.sex)} ${srcTag(item.src, item.estimate)}`);
  }
  bits.push('<b>Appearance is a reconstruction, not a portrait of this fictional person.</b>');
  return bits;
}

function lifeStory(life) {
  ACTIVE_SOURCES = new Set();
  const p = life;
  const regionObj = REGIONS.find(r => r.id === p.region);
  const personal = personalEvents(p);
  const family = familyEvents(p);
  const hist = p.events;
  const birthRuler = p.ruler;
  const he = p.sex === 'female' ? 'she' : 'he';
  const He = he[0].toUpperCase() + he.slice(1);
  const His = p.sex === 'female' ? 'Her' : 'His';
  const his = p.sex === 'female' ? 'her' : 'his';
  const him = p.sex === 'female' ? 'her' : 'him';
  const ageAt = (y) => y - p.year;

  // Relevance: war, plague, conquest, religion and coronations belong in the
  // flow of the story; the rest is grouped at the end.
  const RELEVANT = new Set(['war', 'plague', 'conquest', 'religion', 'coronation', 'settlement']);
  const timeline = [
    ...personal,
    ...family,
    ...hist.map(h => ({ year: h.at, kind: h.kind, text: h.text, src: h.src || 'fine', historical: true })),
  ].sort((a, b) => a.year - b.year);
  const childhood = timeline.filter(e => ageAt(e.year) < 16 && (e.historical ? RELEVANT.has(e.kind) : true));
  const adulthood = timeline.filter(e => ageAt(e.year) >= 16 && ageAt(e.year) < 60 && (e.historical ? RELEVANT.has(e.kind) : true));
  const oldAge = timeline.filter(e => ageAt(e.year) >= 60 && (e.historical ? RELEVANT.has(e.kind) : true));
  const otherMajor = hist.filter(h => !RELEVANT.has(h.kind) || !ageAt(h.at) >= 0)
    .filter(h => RELEVANT.has(h.kind) === false);
  const otherList = hist.filter(h => !RELEVANT.has(h.kind));

  const householdLine = p.occ.noble
    ? `The family belonged to ${p.occ.id === 'vlastelic' ? 'the petty nobility (vlasteličići)' : 'the landed nobility'}.`
    : p.occ.id === 'krstjanin'
      ? 'The household belonged to the krstjani of the Bosnian Church.'
      : p.occ.id === 'roblje'
        ? 'The household was caught up in the slave trade to the coast.'
        : `The household's livelihood centered on ${{kmet: 'smallholder farming', pastir: 'herding', rudar: 'mining', trgovac: 'trade', vojnik: 'military service', svecenik: 'priestly service', domazet: 'hired labor', pisar: 'scribal work'}[p.occ.id] || 'work'}.`;
  const opening = `${p.name} was born in ${p.year} in ${p.settlement}, ${p.settlementType} in ${regionObj.name} — ${regionObj.hint}. ${householdLine}`;
  const house = `The land ${he} lived on belonged to ${p.lord.house} (${p.lord.from}–${p.lord.to}); ${pronounify(p.lord.note, p.sex)}.`;
  const crown = `The ruler of the day was ${birthRuler.name} (${birthRuler.from}–${birthRuler.to}). ${pronounify(birthRuler.note, p.sex)}.`;
  const faith = p.religion.id === 'unknown'
    ? `The surviving evidence is too sparse to assign ${his} household a religious affiliation with confidence. ${srcTag('fine-early', false)}`
    : `${pronounify(`They were ${p.religion.label}`, p.sex)}${p.religion.id === 'krstjanin' ? ' — one of the Bosnian Christians the rest of Europe called heretics' : ''}. ${srcTag(p.religion.id === 'krstjanin' ? 'church' : 'fine', false)}`;

  const pieces = [`<p>${opening}</p>`, `<p>${house}</p>`, `<p>${crown}</p>`, `<p>${faith}</p>`];

  pieces.push(`<h3>Childhood</h3>`);
  if (p.child) {
    pieces.push(`<p>${He} never reached a tradesman's age. The household, the fields, the church calendar and the family's dead were the whole of ${his} world. <b>(Reconstruction — est.)</b></p>`);
  } else {
    const wk = OCCUPATION_DETAIL[p.occ.id];
    if (wk) pieces.push(`<p>${pronounify(wk, p.sex)}</p>`);
  }
  const weaveEvents = (events) => {
    if (!events.length) return '';
    const chosen = events.slice(0, 4);
    return chosen.map(e => `${pronounify(e.text, p.sex)} (${e.year})${e.src && e.historical ? ' ' + srcTag(e.src, false) : ''}`).join(' ');
  };
  if (childhood.length) {
    pieces.push(`<p>${weaveEvents(childhood)}</p>`);
  } else {
    pieces.push(`<p>Nothing out of the ordinary marked the first years — by the standards of the time, that was luck.</p>`);
  }

  if (!p.child) {
    pieces.push(`<h3>Adulthood</h3>`);
    if (adulthood.length) {
      pieces.push(`<p>${weaveEvents(adulthood)}</p>`);
    } else {
      pieces.push(`<p>The adult years passed in work, weddings and the slow turn of seasons; no great event crossed ${his} road.</p>`);
    }
  }

  if (p.householdChildren) {
    pieces.push(`<p>As an adult, the household is modeled with ${p.householdChildren} children. This is a broad period-based estimate, not a record of a real family.</p>`);
  }

  if (ageAt(p.deathYear) >= 60) {
    pieces.push(`<h3>Old age</h3>`);
    const old = oldAge.length
      ? oldAge.map(e => `${pronounify(e.text, p.sex)} (${e.year})${e.src && e.historical ? ' ' + srcTag(e.src, false) : ''}`).join(' ')
      : `${He} lived past sixty — old for the time — and saw the youngest generation grow up. <b>(est.)</b>`;
    pieces.push(`<p>${old}</p>`);
  }

  if (otherList.length) {
    pieces.push(`<h3>Beyond the central story</h3>`);
    pieces.push(`<p>${weaveEvents(otherList.map(e => ({ ...e, year: e.at, historical: true, src: e.src || 'fine' })))}</p>`);
  }

  // Everyday life: customs, food, clothing, song, appearance — with a photo
  // and clear labels of what is reconstruction.
  const culture = cultureParagraph(p);
  pieces.push(`<h3>Everyday life</h3>`);
  pieces.push(`<p>${culture.join(' ')}</p>`);
  if (p.deathYear >= 1200) pieces.push(imgFigure('stecci', 'A Bosnian necropolis of stećci. This later medieval burial tradition is not assigned to the fictional person.', 'Fine, Late Medieval Balkans'));

  // Where they lived, then and now.
  const site = SITE_IMAGES[p.region] || SITE_IMAGES.stecci;
  pieces.push(`<h3>Where they lived — then and now</h3>`);
  pieces.push(`<p>${site.then} (${regionObj.name}). ${site.now}</p>`);
  pieces.push(imgFigure(site.img, site.then, 'present-day photo of the same site'));

  pieces.push('<h3>People, objects and symbols in the historical record</h3>');
  pieces.push('<p>No surviving portrait is identified as this randomly generated person. The following are reference images of real period sources or objects, not possessions of the fictional character; every image is individually credited and marked as not AI-generated.</p>');
  if (p.deathYear >= 1404) {
    pieces.push(imgFigure('manuscript', 'Religious imagery in Hval’s 1404 Bosnian Church manuscript, with a human figure: a source-era reference, not a portrait or universal costume reference.', 'Hval manuscript, written for Duke Hrvoje Vukčić Hrvatinić'));
    ACTIVE_SOURCES.add('hval-manuscript');
    ACTIVE_SOURCES.add('hval-context');
  }
  if ((p.occ.id === 'vojnik' || p.occ.noble) && p.year >= 1200) {
    pieces.push(imgFigure('sword', 'A medieval Bosnian sword displayed at Museum Semberija. It is a representative weapon reference, not an item attributed to this person.', 'Wikimedia Commons, CC BY-SA 4.0'));
    ACTIVE_SOURCES.add('sword-object');
  }
  if (p.deathYear >= 1250) {
    pieces.push(imgFigure('dobojFind', 'An inscribed stećak from the Doboj region, tentatively dated to the late 13th or early 14th century; the damaged inscription mentions a scribe of Prince Hrvatin.', 'Doboj Museum medieval collection; not this family’s grave'));
    ACTIVE_SOURCES.add('doboj-find');
  }
  if (p.year >= 1330 && p.year <= 1463) {
    const s = SOURCES.find(x => x.key === 'museum-ring');
    pieces.push(`<p><b>Ornaments:</b> the museum documents a gold signet ring attributed to Tripa Buća, an official of King Tvrtko I. <a href="${s.url}" target="_blank" rel="noopener noreferrer">View the museum’s artifact record and photograph</a>. This elite object is not presented as belonging to the generated person.</p>`);
    ACTIVE_SOURCES.add('museum-ring');
  }
  if (p.year >= 1250 && p.year <= 1463 && /Kotromanić/i.test(p.lord.house)) {
    pieces.push(imgFigure('kotromanicArms', 'Kotromanić arms as reproduced in a later armorial source. This is a later depiction, not a surviving contemporary shield.', 'Stanislaus Rubcich armorial tradition; CC BY-SA 4.0'));
    ACTIVE_SOURCES.add('kotromanic-arms');
  } else if (/Kosače/i.test(p.lord.house)) {
    pieces.push(`<p><b>House arms:</b> the selected local lord is ${p.lord.house}. No verified image for this specific lineage is included here; the app deliberately does not invent a coat of arms.</p>`);
  }

  // How it ended.
  let end;
  if (p.lifespan < 6) {
    end = `${p.name} died in ${p.deathYear}, aged ${p.lifespan || 'a few months'}. ${deathCause(p)}`;
  } else {
    end = `${p.name} died in ${p.deathYear}, aged ${p.lifespan}. ${deathCause(p)} The political context near the end was ${rulerAt(p.deathYear).name}.`;
  }
  pieces.push(`<p>${pronounify(end, p.sex)}</p>`);

  // Sources used in this life.
  const used = ACTIVE_SOURCES;
  used.add(p.year < 1154 ? 'fine-early' : 'fine');
  used.add('malcolm');
  if (p.year <= 1189 && p.deathYear >= 1189) used.add('kulin');
  if (p.year < 900) used.add('slavic-sites');
  if (p.year >= 1463) { used.add('jajce-unesco'); used.add('relations'); }
  const srcList = [...used].map(k => {
    const s = SOURCES.find(x => x.key === k);
    return `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>` : s.label}</li>`;
  }).join('');
  pieces.push(`<h3>Sources for this life</h3><ul class="src-list">${srcList}</ul>`);
  pieces.push(`<p class="fine-print">This is procedurally generated fiction, not a real person or a biography written by generative AI. Historical facts are cited; demographic figures and reconstructed details are model estimates. Photographs are historical/current reference images credited individually; no image shown here is AI-generated.</p>`);

  return pieces.join('\n');
}

function renderStory() {
  const p = drawn.life;
  el('life-name').textContent = p.child
    ? `${p.name}, ${p.titleOcc}, died at ${p.lifespan}, ${p.year}–${p.deathYear}`
    : `${p.name}, ${p.titleOcc}, lived ${p.lifespan} years, ${p.year}–${p.deathYear}`;
  el('stats-label').textContent = 'This is procedurally generated fiction, not a real person. The game does not use generative AI to write this biography. Historical claims are linked; estimates and representative imagery are labeled.';
  el('life-story').innerHTML = lifeStory(p);
  el('life-stats2').innerHTML = [
    ['Born', p.year],
    ['Place', `${p.settlement} (${REGIONS.find(r => r.id === p.region).name})`],
    ['Died', p.deathYear],
    ['Faith', p.religion.label],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
}

/* ---------- about ---------- */
function renderAbout() {
  const imgCredits = Object.entries(IMAGES).map(([k, im]) =>
    `<li><a href="${im.page}" target="_blank" rel="noopener noreferrer">${im.title}</a> — ${im.artist || 'unknown'} — ${im.license}</li>`).join('');
  const srcList = SOURCES.map(s => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>` : s.label}</li>`).join('');
  el('about-body').innerHTML = `
    <p>This is a lightweight copy of <a href="https://anyhumanever.com/" target="_blank" rel="noopener noreferrer">Any Human Ever</a>, focused on births from early Slavic settlement (about 600) through the Ottoman conquest of Jajce in 1527, the end of the Jajce Banate. The Kingdom of Bosnia fell in 1463; Jajce remained under Hungarian rule from 1464 to 1527.</p>
    <p><b>What is real:</b> the rulers, noble houses, wars, plagues, treaties and religious events are drawn from the historical scholarship listed below.</p>
    <p><b>What is estimated:</b> the population curve, lifespan/mortality/fertility ranges, occupation odds, and everyday-life details are scenario assumptions, not Bosnian census or family records. Numeric demographic parameters are not directly attested for medieval Bosnia; they vary by broad period and are not precision demographic history. The map shows modern terrain, approximate settlement coordinates, and schematic historical regions.</p>
    <p><b>What is invented:</b> individual names, households, life events and biographies are procedurally generated fiction, not archival records. Names are drawn from late-medieval name pools, so early-period names are only literary approximations. The game uses no generative AI to write the person’s life or generate its images.</p>
    <p><b>Images:</b> photos and map are source images credited individually and below; image artwork is not AI-generated. Reconstructed heraldry is labeled as a modern reconstruction, not an authenticated medieval object.</p>
    <h3>Sources</h3><ul class="src-list">${srcList}</ul>
    <h3>Image credits</h3><ul class="src-list">${imgCredits}</ul>`;
}
function showAbout() { renderAbout(); el('about').hidden = false; el('hero').hidden = true; for (const s of STAGES) el(`stage-${s}`).hidden = true; el('progress').hidden = true; }
function hideAbout() { el('about').hidden = true; el('progress').hidden = false; if (current) showStage(current); else el('hero').hidden = false; }

/* ---------- flow ---------- */
let SEED = null;
let drawn = { year: null, region: null, place: null, life: null };

function newSeed() { SEED = (Math.random() * 0xffffffff) >>> 0; RNG = mulberry32(SEED); }

function playFromHero() {
  newSeed();
  drawn = { year: null, region: null, place: null, life: null };
  played = new Set(['when']);
  showStage('when');
  drawWhenStage();
  setHash();
}
function drawWhenStage(year = null) {
  drawn.year = year == null ? drawYear() : Math.max(YEAR_MIN, Math.min(YEAR_MAX, Math.round(year)));
  setSelectedYear(drawn.year);
  el('when-result').textContent = `Year ${drawn.year}`;
  el('when-sub').textContent = `Roughly ${Math.round(popAt(drawn.year) / 1000)}k people in Bosnia at that time (estimate).`;
  el('when-select').hidden = true;
  el('when-again').hidden = false;
  el('when-next').hidden = false;
  el('when-next').focus();
}
function drawWhereStage() {
  const region = drawRegion();
  const choices = PLACES.filter(p => p.region === region.id);
  const place = weighted(choices, p => p.major ? 3 : 1);
  selectPlace(place);
}
function generateLifeStage() {
  drawn.life = drawLife();
  played.add('life');
  renderLifeCard();
  setHash();
}
function drawStoryStage() {
  played.add('story');
  renderStory();
  showStage('story');
  setHash();
}

el('draw').addEventListener('click', playFromHero);
el('when-select').addEventListener('click', drawWhenStage);
el('when-again').addEventListener('click', drawWhenStage);
el('year-range').addEventListener('input', (e) => setSelectedYear(e.target.value));
el('year-number').addEventListener('change', (e) => { if (e.target.value) setSelectedYear(e.target.value); });
el('use-year').addEventListener('click', () => { const n = Number(el('year-number').value); if (Number.isFinite(n) && n >= YEAR_MIN && n <= YEAR_MAX) drawWhenStage(n); });
el('toggle-medieval').addEventListener('click', () => setNameMode('medieval'));
el('toggle-modern').addEventListener('click', () => setNameMode('modern'));
el('when-next').addEventListener('click', () => { played.add('where'); showStage('where'); renderWhere(); drawWhereStage(); });
el('where-select').addEventListener('click', drawWhereStage);
el('where-again').addEventListener('click', drawWhereStage);
el('where-next').addEventListener('click', () => { played.add('life'); showStage('life'); drawn.life = null; renderLife(); });
el('generate').addEventListener('click', generateLifeStage);
el('life-again').addEventListener('click', generateLifeStage);
el('life-next').addEventListener('click', drawStoryStage);
el('again').addEventListener('click', playFromHero);
el('share').addEventListener('click', () => {
  const url = location.href;
  try {
    if (navigator.share) navigator.share({ title: 'Any Human Ever - in medieval Bosnia', url });
    else { navigator.clipboard.writeText(url); el('share-url').hidden = false; el('share-url').textContent = url; }
  } catch { /* sandboxed frame: no URL to share */ }
});

/* ---------- boot ---------- */
(function boot() {
  drawPopGraph();
  el('hero').hidden = false;
  el('progress').hidden = true;
})();

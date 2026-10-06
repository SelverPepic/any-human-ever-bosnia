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
  const s = SOURCES.find(x => x.key === key);
  const name = s ? s.label.split(',')[0] : 'unattributed';
  return `<span class="src-chip">${name}${estimate ? ' · est.' : ''}</span>`;
}

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
  for (let y = 600; y <= 1463; y++) { cum += popAt(y); CUM.push([y, cum]); }
  const target = rand() * cum;
  let lo = 0, hi = CUM.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (CUM[mid][1] < target) lo = mid + 1; else hi = mid; }
  return CUM[lo][0];
}

function drawPopGraph() {
  const svg = el('pop-graph');
  if (svg.dataset.drawn) return;
  svg.dataset.drawn = '1';
  const W = 400, H = 170, LEFT = 56, RIGHT = 12, TOP = 14, BOT = 26;
  const x = (y) => LEFT + (y - 600) / 863 * (W - LEFT - RIGHT);
  const maxLog = Math.log10(560000), minLog = Math.log10(20000);
  const yy = (p) => H - BOT - (Math.log10(p) - minLog) / (maxLog - minLog) * (H - TOP - BOT);
  let d = `M ${x(600)} ${yy(popAt(600))}`;
  for (let y = 600; y <= 1463; y += 5) d += ` L ${x(y)} ${yy(popAt(y))}`;
  const area = d + ` L ${x(1463)} ${H - BOT} L ${x(600)} ${H - BOT} Z`;
  // Y axis ticks with labelled population counts.
  const ticks = [20000, 50000, 100000, 300000, 560000];
  let axis = '';
  for (const t of ticks) {
    const y = yy(t);
    axis += `<line x1="${LEFT}" y1="${y}" x2="${W - RIGHT}" y2="${y}" stroke="var(--border)" stroke-dasharray="2 4"/>`
      + `<text x="${LEFT - 6}" y="${y + 3}" text-anchor="end" class="axis-label">${t >= 1000 ? (t / 1000) + 'k' : t}</text>`;
  }
  svg.innerHTML = `
    <path d="${area}" fill="var(--accent-dim)"/>
    <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${axis}
    <line x1="${LEFT}" y1="${TOP - 6}" x2="${LEFT}" y2="${H - BOT}" stroke="var(--muted)"/>
    <text x="${LEFT}" y="${H - 6}" class="axis-label">600</text>
    <text x="${x(1000)}" y="${H - 6}" class="axis-label">1000</text>
    <text x="${x(1200)}" y="${H - 6}" class="axis-label">1200</text>
    <text x="${W - RIGHT}" y="${H - 6}" text-anchor="end" class="axis-label">1463</text>
    <text x="${LEFT - 40}" y="${(H - BOT + TOP) / 2}" class="axis-title" transform="rotate(-90 ${LEFT - 40} ${(H - BOT + TOP) / 2})" text-anchor="middle">Population (estimate)</text>`;
}

function renderWhen() {
  drawPopGraph();
  el('when-src').innerHTML = 'Population figures are rough estimates reconstructed from historical scholarship — not a census. See <a href="#" onclick="showAbout();return false;">About</a>.';
}

/* ---------- stage 2: where ---------- */
function drawRegion() {
  return weighted(REGIONS, (r) => r.weight);
}
function nearestPlace(px, py) {
  let best = null, bestD = Infinity;
  for (const r of REGIONS) {
    for (const p of r.places) {
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bestD) { bestD = d; best = { place: p, region: r }; }
    }
  }
  return best;
}
function settlementName(region, type) {
  const pool = (type === 'village' || type === 'hamlet') ? region.villages.concat(region.towns) : region.towns;
  return pick(pool);
}
function drawPopMap() {
  const svg = el('map-svg');
  if (!svg.dataset.drawn) {
    svg.dataset.drawn = '1';
    let inner = `<rect x="0" y="0" width="400" height="300" fill="transparent" data-map-hit="1"/>`;
    for (const r of REGIONS) {
      inner += `<circle cx="${r.x}" cy="${r.y}" r="36" data-region="${r.id}" class="map-region"/>`;
    }
    for (const r of REGIONS) {
      inner += `<text x="${r.x}" y="${r.y + 4}" text-anchor="middle" class="map-label">${r.name}</text>`;
      for (const p of r.places) {
        inner += `<circle cx="${p.x}" cy="${p.y}" r="${p.kind === 'village' ? 2.2 : 3.4}" data-place="${p.name}" class="place-dot">`
          + `<title>${p.name} — ${p.kind}</title></circle>`;
      }
    }
    inner += `<text id="map-selected-label" x="0" y="0" text-anchor="middle" class="place-label sel" visibility="hidden"></text>`;
    inner += `<circle id="map-selected-dot" r="5" class="map-selected" visibility="hidden"/>`;
    svg.innerHTML = inner;
    svg.addEventListener('click', (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      const loc = pt.matrixTransform(ctm.inverse());
      const near = nearestPlace(loc.x, loc.y);
      if (near) selectPlace(near.region.id, near.place.name);
    });
  }
  markSelectedOnMap();
}
function markSelectedOnMap() {
  const dot = document.getElementById('map-selected-dot');
  const label = document.getElementById('map-selected-label');
  if (!dot || !drawn.place) return;
  dot.setAttribute('cx', drawn.place.x); dot.setAttribute('cy', drawn.place.y);
  dot.setAttribute('visibility', 'visible');
  label.setAttribute('x', drawn.place.x); label.setAttribute('y', drawn.place.y - 8);
  label.textContent = drawn.place.name;
  label.setAttribute('visibility', 'visible');
}
function highlightRegion(regionId) {
  document.querySelectorAll('#map-svg .map-region').forEach((c) => {
    const on = c.dataset.region === regionId;
    c.classList.toggle('map-active', on);
    c.setAttribute('r', on ? 40 : 34);
  });
}
function selectPlace(regionId, placeName) {
  const region = REGIONS.find(r => r.id === regionId);
  const place = region.places.find(p => p.name === placeName);
  drawn.region = region.id;
  drawn.place = place;
  drawPopMap();
  highlightRegion(region.id);
  el('where-result').textContent = `${place.name}, ${region.name}`;
  const kind = place.kind === 'fortress' ? 'a fortress town' : place.kind === 'mining' ? 'a mining town'
    : place.kind === 'monastery' ? 'a monastery village' : place.kind === 'market' ? 'a market town'
    : place.kind === 'town' ? 'a town' : 'a village';
  el('where-sub').textContent = `Closest place with data: ${kind}. ${region.hint[0].toUpperCase() + region.hint.slice(1)}.`;
  el('where-select').hidden = true;
  el('where-again').hidden = false;
  el('where-next').hidden = false;
  setHash();
}
function renderWhere() {
  drawPopMap();
  el('where-src').innerHTML = 'Map is schematic — region positions and place dots are illustrative, not survey-accurate (estimate).';
}

/* ---------- demographics summary (estimated from the life model) ---------- */
const DEMO = (function computeDemo() {
  const saved = RNG;
  RNG = mulberry32(20260101);
  const lives = [];
  for (let i = 0; i < 4000; i++) {
    const age = pickLifespan(1000, true);
    lives.push(age);
  }
  const mean = lives.reduce((a, b) => a + b, 0) / lives.length;
  const sorted = lives.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const child = lives.filter(l => l < 5).length / lives.length;
  const paths = OCCUPATIONS.map(o => ({ label: o.label.replace(/^(a|an) /, ''), pct: o.weight * 100 }))
    .sort((a, b) => b.pct - a.pct).slice(0, 6);
  RNG = saved;
  return {
    mean, median, child,
    avgChildren: 3.6,
    paths,
  };
})();

function renderDemoStats() {
  const c = DEMO;
  const top = c.paths.slice(0, 5);
  el('demo-stats').innerHTML = [
    ['Mean life expectancy', `${Math.round(c.mean)} years (est.)`],
    ['Median lifespan', `${Math.round(c.median)} years (est.)`],
    ['Childhood mortality', `${Math.round(c.child * 100)}% die before age 5 (est.)`],
    ['Children per woman', `${c.avgChildren} (est.)`],
    ['Typical life paths', top.map(t => `${t.label} ${Math.round(t.pct)}%`).join(' · ')],
    ['Leading causes of death', 'childhood illness · childbirth · war · plague (est.)'],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
}

/* ---------- stage 3: life ---------- */
function pickName(sex, occ) {
  const pool = occ.noble ? NAMES[sex].noble : NAMES[sex].common;
  return pick(pool);
}
function pickReligion(year, regionId) {
  let items = RELIGIONS.slice();
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
function pickOccupation(nobleOnly) {
  if (nobleOnly) {
    return weighted(OCCUPATIONS.filter(o => o.noble), (o) => o.weight);
  }
  return weighted(OCCUPATIONS, (o) => o.weight);
}
function pickLifespan(year, forDemo) {
  if (rand() < 0.3) return Math.floor(rand() * 5);
  let age = 5;
  while (age < 80) {
    const rate = age < 45 ? 0.012 : age < 60 ? 0.035 : 0.09;
    if (rand() < rate) break;
    age++;
  }
  return age;
}
function rulerAt(year) {
  for (const r of RULERS) if (year >= r.from && year <= r.to) return r;
  return RULERS[RULERS.length - 1];
}
function lordAt(regionId, year) {
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
  return region.lords.filter(l => l.to >= birth && l.from <= death).map(l => {
    const from = Math.max(l.from, birth), to = Math.min(l.to, death);
    return `${l.house} — ${from}–${to}`;
  });
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
  const occ = pickOccupation(nobleOnly);
  const sex = rand() < 0.5 ? 'female' : 'male';
  const name = pickName(sex, occ);
  const religion = pickReligion(year, region.id);
  const lifespan = pickLifespan(year);
  const deathYear = Math.min(1463, year + lifespan);
  const place = drawn.place || { name: settlementName(region, 'town'), kind: 'town' };
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
    family: buildFamily({ year, sex, deathYear }),
    reigns: reignsOver(year, deathYear),
    lordSpans: lordSpansOver(region.id, year, deathYear),
    nobleOnly,
  };
}

function renderLife() {
  renderDemoStats();
  el('life-src').innerHTML = 'All summary figures are model-based estimates calibrated on the historical literature — see <a href="#" onclick="showAbout();return false;">About</a>.';
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
    ['Sex', p.sex === 'female' ? 'female — she' : 'male — he'],
    ['Faith', p.religion.label],
    ['Ruled by (at birth)', `${p.ruler.name} (${p.ruler.from}–${p.ruler.to})`],
    ['Under (at birth)', `${p.lord.house} (${p.lord.from}–${p.lord.to})`],
    ['Rulers over lifetime', p.reigns.join('; ') || '—'],
    ['Lords over lifetime', p.lordSpans.join('; ') || '—'],
  ].map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');
  const svg = el('tl-svg');
  const W = 360, H = 84, y = H - 18;
  const x = (yr) => 12 + (yr - 600) / 863 * (W - 24);
  const marks = p.events.map((e) => `<circle cx="${x(e.at)}" cy="${y}" r="3" fill="var(--accent)"/>`).join('');
  svg.innerHTML = `
    <line x1="12" y1="${y}" x2="${W - 12}" y2="${y}" stroke="var(--border)"/>
    <circle cx="${x(p.year)}" cy="${y}" r="5" fill="var(--accent)" opacity="0.8"/>
    <circle cx="${x(p.deathYear)}" cy="${y}" r="5" fill="var(--danger)" opacity="0.8"/>
    ${marks}
    <text x="12" y="${H - 4}" font-size="10" fill="var(--muted)">600</text>
    <text x="${W - 12}" y="${H - 4}" text-anchor="end" font-size="10" fill="var(--muted)">1463</text>`;
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
      const cause = died >= 1349 && died <= 1351 ? ' The plague took the house.' : died >= 1463 ? ' The conquest of that year ended the family line.' : (f.relation === 'mother' ? ' Of fever.' : '');
      evs.push({ year: died, kind: 'family', text: `${f.relation[0].toUpperCase() + f.relation.slice(1)} ${f.name} died in ${died}.${cause}` });
    }
  }
  return evs.sort((a, b) => a.year - b.year);
}

function imgFigure(key, caption, source) {
  const im = IMAGES[key];
  if (!im) return '';
  return `<figure class="story-img"><img src="${im.src}" alt="${caption}"/>`
    + `<figcaption>${caption}<br><a href="${im.page}" target="_blank" rel="noopener noreferrer">Photo: Wikimedia Commons</a> · ${im.artist || 'unknown'} · ${im.license || ''}${source ? ' · ' + source : ''}</figcaption></figure>`;
}

function cultureParagraph(life) {
  const c = CULTURE;
  const bits = [];
  const customs = [pick(c.customs), pick(c.customs.filter(x => x !== null))];
  bits.push(`${pronounify(pick(c.customs).text, life.sex)} ${srcTag(pick(c.customs).src, pick(c.customs).estimate)}`);
  bits.push(`${pronounify(pick(c.food).text, life.sex)} ${srcTag(pick(c.food).src, pick(c.food).estimate)}`);
  bits.push(`${pronounify(pick(c.clothing).text, life.sex)} ${srcTag(pick(c.clothing).src, pick(c.clothing).estimate)}`);
  bits.push(`${pronounify(pick(c.songs).text, life.sex)} ${srcTag(pick(c.songs).src, pick(c.songs).estimate)}`);
  bits.push(`${pronounify(pick(c.appearance).text, life.sex)} ${srcTag(pick(c.appearance).src, pick(c.appearance).estimate)} <b>Appearance is a reconstruction (estimate), not a portrait.</b>`);
  return bits;
}

function lifeStory(life) {
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

  const opening = `${p.name} was born in ${p.year} in ${p.settlement}, ${p.settlementType} in ${regionObj.name} — ${regionObj.hint}. ${His} family were ${p.occ.label.replace(/^a /, '')}s by trade.`;
  const house = `The land ${he} lived on belonged to ${p.lord.house} (${p.lord.from}–${p.lord.to}); ${pronounify(p.lord.note, p.sex)}.`;
  const crown = `The ruler of the day was ${birthRuler.name} (${birthRuler.from}–${birthRuler.to}). ${pronounify(birthRuler.note, p.sex)}.`;
  const faith = `${pronounify(`They were ${p.religion.label}`, p.sex)}${p.religion.id === 'krstjanin' ? ' — one of the Bosnian Christians the rest of Europe called heretics' : ''}. ${srcTag(p.religion.id === 'krstjanin' ? 'church' : 'fine', false)}`;

  const pieces = [`<p>${opening}</p>`, `<p>${house}</p>`, `<p>${crown}</p>`, `<p>${faith}</p>`];

  pieces.push(`<h3>Childhood</h3>`);
  if (p.child) {
    pieces.push(`<p>${He} never reached a tradesman's age. The household, the fields, the church calendar and the family's dead were the whole of ${his} world. <b>(Reconstruction — est.)</b></p>`);
  } else {
    const wk = OCCUPATION_DETAIL[p.occ.id];
    if (wk) pieces.push(`<p>${pronounify(wk, p.sex)}</p>`);
  }
  if (childhood.length) {
    for (const e of childhood) {
      pieces.push(`<p>${pronounify(e.text, p.sex)} (${e.year})${e.src && e.historical ? ' ' + srcTag(e.src, false) : ''}</p>`);
    }
  } else {
    pieces.push(`<p>Nothing out of the ordinary marked the first years — by the standards of the time, that was luck.</p>`);
  }

  if (!p.child) {
    pieces.push(`<h3>Adulthood</h3>`);
    if (adulthood.length) {
      for (const e of adulthood) {
        pieces.push(`<p>${pronounify(e.text, p.sex)} (${e.year})${e.src && e.historical ? ' ' + srcTag(e.src, false) : ''}</p>`);
      }
    } else {
      pieces.push(`<p>The adult years passed in work, weddings and the slow turn of seasons; no great event crossed ${his} road.</p>`);
    }
  }

  if (ageAt(p.deathYear) >= 60) {
    pieces.push(`<h3>Old age</h3>`);
    const old = oldAge.length
      ? oldAge.map(e => `${pronounify(e.text, p.sex)} (${e.year})${e.src && e.historical ? ' ' + srcTag(e.src, false) : ''}`).join(' ')
      : `${He} lived past sixty — old for the time — and saw the youngest generation grow up. <b>(est.)</b>`;
    pieces.push(`<p>${old}</p>`);
  }

  if (otherList.length) {
    pieces.push(`<h3>Other major events during ${his} lifetime</h3>`);
    pieces.push(`<ul class="src-list">${otherList.map(e => `<li>${e.text} (${e.at})</li>`).join('')}</ul>`);
  }

  // Everyday life: customs, food, clothing, song, appearance — with a photo
  // and clear labels of what is reconstruction.
  const culture = cultureParagraph(p);
  pieces.push(`<h3>Everyday life</h3>`);
  pieces.push(`<p>${culture.join(' ')}</p>`);
  pieces.push(imgFigure('stecci', 'A necropolis of stećci — the carved stone tombs of the Bosnian highlands, the same burial custom the story mentions.', 'burial custom: Fine, Late Medieval Balkans'));

  // Where they lived, then and now.
  const site = SITE_IMAGES[p.region] || SITE_IMAGES.stecci;
  pieces.push(`<h3>Where they lived — then and now</h3>`);
  pieces.push(`<p>${site.then} (${regionObj.name}). ${site.now}</p>`);
  pieces.push(imgFigure(site.img, site.then, 'present-day photo of the same site'));

  // How it ended.
  let end;
  if (p.lifespan < 6) {
    end = `${p.name} died in ${p.deathYear}, aged ${p.lifespan || 'a few months'}. ${deathCause(p)}`;
  } else {
    end = `${p.name} died in ${p.deathYear}, aged ${p.lifespan}. ${deathCause(p)} ${rulerAt(p.deathYear).name} held the throne at the end${p.deathYear >= 1463 ? ', though the throne itself had gone' : ''}.`;
  }
  pieces.push(`<p>${pronounify(end, p.sex)}</p>`);

  // Sources used in this life.
  const used = new Set();
  for (const key of ['fine', 'malcolm', 'cirkovic', 'church']) used.add(key);
  const srcList = [...used].map(k => {
    const s = SOURCES.find(x => x.key === k);
    return `<li>${s.label}</li>`;
  }).join('');
  pieces.push(`<h3>Sources for this life</h3><ul class="src-list">${srcList}</ul>`);
  pieces.push(`<p class="fine-print">Everything marked “est.” is a model-based estimate or a reconstruction, not a recorded fact. No image in this story is AI-generated; all photos are Wikimedia Commons, credited above.</p>`);

  return pieces.join('\n');
}

function renderStory() {
  const p = drawn.life;
  el('life-name').textContent = p.child
    ? `${p.name}, ${p.titleOcc}, died at ${p.lifespan}, ${p.year}–${p.deathYear}`
    : `${p.name}, ${p.titleOcc}, lived ${p.lifespan} years, ${p.year}–${p.deathYear}`;
  el('stats-label').textContent = 'This life is AI-generated fiction, not a real person. Everything around it — rulers, wars, plagues, customs — is real and sourced; anything estimated is marked “est.”';
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
  const srcList = SOURCES.map(s => `<li>${s.label}</li>`).join('');
  el('about-body').innerHTML = `
    <p>This is a lightweight copy of <a href="https://anyhumanever.com/" target="_blank" rel="noopener noreferrer">Any Human Ever</a>, focused on people living in medieval Bosnia, from the Slavic settlement (6th–7th century) to the fall of the Kingdom of Bosnia in 1463.</p>
    <p><b>What is real:</b> the rulers, noble houses, wars, plagues, treaties and religious events are drawn from the historical scholarship listed below.</p>
    <p><b>What is estimated:</b> the population curve, every summary statistic (life expectancy, childhood mortality, children per woman, life paths, causes of death) and the everyday-life details marked “est.” are model-based estimates or reconstructions. The map is schematic.</p>
    <p><b>What is invented:</b> the individual lives, their names, families and “famous for” lines are narrative fiction, not records.</p>
    <p><b>Images:</b> no image in this app is AI-generated. All photos are from Wikimedia Commons, credited below and at the point of use.</p>
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
function drawWhenStage() {
  drawn.year = drawYear();
  el('when-result').textContent = `Year ${drawn.year}`;
  el('when-sub').textContent = `Roughly ${Math.round(popAt(drawn.year) / 1000)}k people in Bosnia at that time (estimate).`;
  el('when-select').hidden = true;
  el('when-again').hidden = false;
  el('when-next').hidden = false;
  el('when-next').focus();
}
function drawWhereStage() {
  const region = drawRegion();
  const place = pick(region.places);
  selectPlace(region.id, place.name);
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
el('when-next').addEventListener('click', () => { played.add('where'); showStage('where'); drawWhereStage(); });
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

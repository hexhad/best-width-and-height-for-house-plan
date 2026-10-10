// Ayadi calculations (Wasthu Vidyawa) for a rectangular floor plan.
// All dimensions are in inches. Every factor is (area × multiplier) mod divisor.

export const MIN_INCHES = 200;
export const MAX_INCHES = 600;

/** The eleven factors, in display order. Labels live in i18n.js. */
export const FACTORS = [
  { key: "aya", mul: 8, div: 12 },
  { key: "weya", mul: 9, div: 10 },
  { key: "yoni", mul: 3, div: 8 },
  { key: "nekatha", mul: 8, div: 27 },
  { key: "dawasa", mul: 9, div: 7 },
  { key: "ayusha", mul: 27, div: 100 },
  { key: "anshaka", mul: 4, div: 9 },
  { key: "rashiya", mul: 5, div: 12 },
  { key: "thithiya", mul: 9, div: 30 },
  { key: "wanshaya", mul: 3, div: 4 },
  { key: "dewatha", mul: 5, div: 3 },
];

/**
 * Computes every factor for an area.
 * With `zeroAsDivisor` (the traditional reading), a remainder of 0 counts as the
 * divisor itself: 0 Aya is 12, 0 Vara is 7, 0 Tithi is 30, and so on.
 */
export function computeFactors(area, { zeroAsDivisor = true } = {}) {
  const out = {};
  for (const f of FACTORS) {
    const r = (area * f.mul) % f.div;
    out[f.key] = zeroAsDivisor && r === 0 ? f.div : r;
  }
  return out;
}

const inList = (list) => (v) => list.includes(v);

// Yoni compatibility: each good yoni clashes with some nakath, days, tithi and rashi.
const YONI_CLASH = {
  1: { nekatha: [13, 3, 20, 10], dawasa: [2], thithiya: [4, 9, 14, 19, 24, 29], rashiya: [11, 12] },
  3: { nekatha: [19, 9, 26, 16], dawasa: [7], thithiya: [3, 8, 13, 18, 23, 28], rashiya: [8, 9] },
  5: { nekatha: [8, 25, 15, 5], dawasa: [5], thithiya: [2, 7, 12, 17, 22, 27], rashiya: [5, 6] },
  7: { nekatha: [24, 14, 4, 21], dawasa: [4], thithiya: [1, 6, 11, 16, 21, 26], rashiya: [2, 3] },
};

/** Returns the factor keys that clash with the plan's yoni, or an empty array. */
export function yoniClashes(f) {
  const clash = YONI_CLASH[f.yoni];
  if (!clash) return [];
  return Object.keys(clash).filter((k) => clash[k].includes(f[k]));
}

/**
 * The rules a plan is judged by. `test` gets the computed factors.
 * `factor` links a rule to the factor it reads, so the UI can mark it.
 */
export const RULES = [
  { id: "aya", factor: "aya", test: (f) => f.aya > 6 },
  { id: "weya", factor: "weya", test: (f) => f.weya < 5 },
  { id: "ayaWeya", factor: "aya", test: (f) => f.aya > f.weya },
  {
    id: "yoni",
    factor: "yoni",
    test: (f) => [1, 3, 5, 7].includes(f.yoni),
  },
  {
    id: "yoniMatch",
    factor: "yoni",
    test: (f) => yoniClashes(f).length === 0,
  },
  {
    id: "nekatha",
    factor: "nekatha",
    test: (f) => inList([2, 5, 7, 9, 11, 14, 16, 18, 20, 23, 25, 27])(f.nekatha),
  },
  { id: "dawasa", factor: "dawasa", test: (f) => [2, 3, 6].includes(f.dawasa) },
  { id: "ayusha", factor: "ayusha", test: (f) => f.ayusha > 50 },
  {
    id: "anshaka",
    factor: "anshaka",
    test: (f) => [1, 3, 5, 6, 8].includes(f.anshaka),
  },
  {
    id: "rashiya",
    factor: "rashiya",
    test: (f) => [2, 3, 5, 9, 11].includes(f.rashiya),
  },
  {
    id: "thithiya",
    factor: "thithiya",
    test: (f) => ![5, 10, 15, 20, 25, 30].includes(f.thithiya),
  },
  { id: "wanshaya", factor: "wanshaya", test: (f) => [1, 2, 3].includes(f.wanshaya) },
  { id: "dewatha", factor: "dewatha", test: (f) => [1, 2].includes(f.dewatha) },
];

export const ALL_RULE_IDS = RULES.map((r) => r.id);

/**
 * Judges one plan. `active` is a Set of rule ids to apply.
 * Returns the factors, every rule's verdict, and whether all active rules pass.
 */
export function evaluate(length, width, active, opts) {
  const area = length * width;
  const factors = computeFactors(area, opts);
  let passed = 0;
  let ok = true;
  const verdicts = RULES.map((r) => {
    const pass = r.test(factors);
    const on = active.has(r.id);
    if (on) {
      if (pass) passed += 1;
      else ok = false;
    }
    return { id: r.id, pass, on };
  });
  return { length, width, area, factors, verdicts, passed, ok };
}

/** Fast path for scanning: true when every active rule passes. */
function passesAll(area, rules, opts) {
  const f = computeFactors(area, opts);
  for (const r of rules) if (!r.test(f)) return false;
  return true;
}

function steps(start, end, oddOnly) {
  const lo = Math.max(1, Math.min(start, end));
  const hi = Math.max(start, end);
  const out = [];
  const first = oddOnly && lo % 2 === 0 ? lo + 1 : lo;
  for (let i = first; i <= hi; i += oddOnly ? 2 : 1) out.push(i);
  return out;
}

/**
 * Every length × width in the two ranges that passes all active rules.
 * Ranges may be given in either order. `oddOnly` keeps the traditional odd-inch sizes.
 */
export function scan({ length: [l0, l1], width: [w0, w1], active, oddOnly = true, zeroAsDivisor = true }) {
  const rules = RULES.filter((r) => active.has(r.id));
  const opts = { zeroAsDivisor };
  const lengths = steps(l0, l1, oddOnly);
  const widths = steps(w0, w1, oddOnly);
  const hits = [];
  for (const l of lengths) {
    for (const w of widths) {
      if (passesAll(l * w, rules, opts)) hits.push({ length: l, width: w, area: l * w });
    }
  }
  return { hits, checked: lengths.length * widths.length };
}

/**
 * The passing sizes nearest to a given plan, within `radius` inches on each side.
 * Sorted by how far the corner moves (Euclidean distance in inches).
 */
export function nearest(length, width, { active, oddOnly = true, zeroAsDivisor = true, radius = 24, limit = 6 }) {
  const { hits } = scan({
    length: [Math.max(1, length - radius), length + radius],
    width: [Math.max(1, width - radius), width + radius],
    active,
    oddOnly,
    zeroAsDivisor,
  });
  return hits
    .filter((h) => !(h.length === length && h.width === width))
    .map((h) => ({ ...h, distance: Math.hypot(h.length - length, h.width - width) }))
    .sort((a, b) => a.distance - b.distance || a.area - b.area)
    .slice(0, limit);
}

const squareness = (p) => Math.max(p.length, p.width) / Math.min(p.length, p.width);

export const SORTS = {
  areaAsc: (a, b) => a.area - b.area,
  areaDesc: (a, b) => b.area - a.area,
  square: (a, b) => squareness(a) - squareness(b) || a.area - b.area,
  length: (a, b) => a.length - b.length || a.width - b.width,
};

// Formatting

export const toFeet = (inches) => ({ ft: Math.floor(inches / 12), inch: inches % 12 });

export const fmtFtIn = (inches) => {
  const { ft, inch } = toFeet(inches);
  return `${ft}' ${inch}"`;
};

/** Square feet, one decimal. */
export const sqft = (area) => (area / 144).toFixed(1);

import { describe, expect, it } from "vitest";
import { ALL_RULE_IDS, computeFactors, evaluate, nearest, scan, yoniClashes } from "./wasthu.js";

// The original App.jsx algorithm, kept verbatim as the reference for the legacy reading.
const legacyMods = (m) => ({
  aya: (m * 8) % 12,
  weya: (m * 9) % 10,
  yoni: (m * 3) % 8,
  nekatha: (m * 8) % 27,
  dawasa: (m * 9) % 7,
  ayusha: (m * 27) % 100,
  anshaka: (m * 4) % 9,
  rashiya: (m * 5) % 12,
  thithiya: (m * 9) % 30,
  wanshaya: (m * 3) % 4,
  dewatha: (m * 5) % 3,
});
const legacyExcluded = ({ yoni, nekatha, dawasa, thithiya, rashiya }) =>
  (yoni === 1 && [13, 3, 20, 10].includes(nekatha)) ||
  (yoni === 3 && [19, 9, 26, 16].includes(nekatha)) ||
  (yoni === 5 && [8, 25, 15, 5].includes(nekatha)) ||
  (yoni === 7 && [24, 14, 4, 21].includes(nekatha)) ||
  (yoni === 1 && dawasa === 2) ||
  (yoni === 3 && dawasa === 7) ||
  (yoni === 5 && dawasa === 5) ||
  (yoni === 7 && dawasa === 4) ||
  (yoni === 1 && [4, 9, 14, 19, 24, 29].includes(thithiya)) ||
  (yoni === 3 && [3, 8, 13, 18, 23, 28].includes(thithiya)) ||
  (yoni === 5 && [2, 7, 12, 17, 22, 27].includes(thithiya)) ||
  (yoni === 7 && [1, 6, 11, 16, 21, 26].includes(thithiya)) ||
  (yoni === 1 && [11, 12].includes(rashiya)) ||
  (yoni === 3 && [8, 9].includes(rashiya)) ||
  (yoni === 5 && [5, 6].includes(rashiya)) ||
  (yoni === 7 && [2, 3].includes(rashiya));
const legacyPass = (m) =>
  m.aya > 6 &&
  m.weya < 5 &&
  [1, 3, 5, 7].includes(m.yoni) &&
  [2, 5, 7, 9, 11, 14, 16, 18, 20, 23, 25, 27].includes(m.nekatha) &&
  [2, 3, 6].includes(m.dawasa) &&
  m.ayusha > 50 &&
  [1, 3, 5, 6, 8].includes(m.anshaka) &&
  [2, 3, 5, 9, 11].includes(m.rashiya) &&
  ![5, 10, 15, 20, 25, 30].includes(m.thithiya) &&
  [1, 2, 3].includes(m.wanshaya) &&
  [1, 2].includes(m.dewatha) &&
  !legacyExcluded(m);

const all = new Set(ALL_RULE_IDS);

describe("computeFactors", () => {
  it("reads a zero remainder as the divisor by default", () => {
    // 3 × 3 = 9: 72 % 12 = 0, so අය is 12
    expect(computeFactors(9).aya).toBe(12);
    expect(computeFactors(9, { zeroAsDivisor: false }).aya).toBe(0);
  });

  it("keeps every factor within 1..divisor in the traditional reading", () => {
    for (let a = 1; a < 3000; a++) {
      const f = computeFactors(a);
      expect(f.dawasa).toBeGreaterThanOrEqual(1);
      expect(f.dawasa).toBeLessThanOrEqual(7);
      expect(f.thithiya).toBeLessThanOrEqual(30);
      expect(f.nekatha).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("scan", () => {
  it("matches the original algorithm exactly in the legacy reading", () => {
    const { hits } = scan({ length: [361, 500], width: [281, 391], active: all, zeroAsDivisor: false });
    const expected = [];
    for (let x = 361; x <= 500; x += 2)
      for (let y = 281; y <= 391; y += 2) if (legacyPass(legacyMods(x * y))) expected.push(`${x}x${y}`);
    expect(hits.map((h) => `${h.length}x${h.width}`)).toEqual(expected);
  });

  it("accepts ranges in either order", () => {
    const a = scan({ length: [361, 401], width: [281, 301], active: all });
    const b = scan({ length: [401, 361], width: [301, 281], active: all });
    expect(a.hits).toEqual(b.hits);
  });

  it("returns every size when no rule is active", () => {
    const { hits, checked } = scan({ length: [201, 209], width: [201, 205], active: new Set() });
    expect(hits.length).toBe(checked);
    expect(checked).toBe(5 * 3);
  });

  it("only yields passing plans", () => {
    const { hits } = scan({ length: [200, 600], width: [200, 400], active: all });
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits.slice(0, 200)) expect(evaluate(h.length, h.width, all).ok).toBe(true);
  });
});

describe("yoniClashes", () => {
  it("flags the day that clashes with a yoni", () => {
    expect(yoniClashes({ yoni: 3, dawasa: 7, nekatha: 1, thithiya: 1, rashiya: 1 })).toEqual(["dawasa"]);
    expect(yoniClashes({ yoni: 2, dawasa: 7, nekatha: 1, thithiya: 1, rashiya: 1 })).toEqual([]);
  });
});

describe("nearest", () => {
  it("finds passing plans close to a failing one, nearest first", () => {
    const out = nearest(400, 300, { active: all });
    expect(out.length).toBeGreaterThan(0);
    for (let i = 1; i < out.length; i++) expect(out[i].distance).toBeGreaterThanOrEqual(out[i - 1].distance);
    for (const p of out) expect(evaluate(p.length, p.width, all).ok).toBe(true);
  });
});

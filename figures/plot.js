/**
 * Plot: a house on its plot of land, seen from the 2:1 corner. The pointer,
 * projected onto the ground, sets the house's near corner: its distance along
 * x from the middle is half the length (දිග), along y half the width (පළල).
 * Both snap to an odd number of inches between 201 and 599, the old rule, and
 * the footprint follows on two springs. The house keeps its parts as it grows:
 * a raised plinth, walls with a door and windows, a step at the door, and a
 * hipped roof whose ridge runs along the longer side. At rest the door is
 * bright; under the pointer the plinth, the footprint being set, takes it.
 * The slider is the roof's pitch, in degrees.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  spring, stepS, flatDot, mk, place, pointer, prism, put, register, disposer, solid,
} = HL;

const IN = 5;                       // inches to one world unit
const LO = 201, HI = 599;           // odd inches, the house's least and greatest side
const PH = 72, PB = 4;              // the plot's half side and thickness
const PL = 4, OV = 3, WH = 26, EV = 5, FS = 2; // plinth height and overhang, wall height, eave overhang, fascia
const ZW = PL + WH;
const REST = [371, 305];            // 30' 11" by 25' 5"

/** The nearest odd inch to v, held between LO and HI. */
const odd = (v) => clamp(Math.round((v - 1) / 2) * 2 + 1, LO, HI);
const ftin = (n) => `${Math.floor(n / 12)}' ${n % 12}"`;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.4);
  const top = ((HI / IN) / 2 + EV) * Math.tan(rad(44)) + ZW;
  fit(C, [[-PH, -PH, -PB], [PH, PH, -PB], [PH, -PH, -PB], [-PH, PH, -PB], [0, 0, top]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-PH, -PH, PH, PH, 10, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  // survey pegs at the plot's corners
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) place(flatDot(g, C, 0.9, "dot off"), P(x * (PH - 7), y * (PH - 7), 0));

  const plinth = solid(g), step = solid(g), walls = solid(g);
  const door = mk("path", { class: "nf hi" }, g), wins = mk("path", { class: "nf lo" }, g);
  const roof = solid(g);

  const L = spring(REST[0] / IN, { eps: 0.02 }), W = spring(REST[1] / IN, { eps: 0.02 }), pitch = spring(value, { eps: 0.02 });
  let drawn = "";

  /** A rounded opening on a wall face: u along the face, v up it, at(u, v) the world point. */
  const hole = (u0, v0, u1, v1, at) => poly(rrect(u0, v0, u1, v1, 1.3, 3).map((q) => at(q.u, q.v)));

  function draw() {
    const l = L.x / 2, w = W.x / 2, p = pitch.x, key = [l, w, p].map((n) => n.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    // plinth and walls: two rounded solids, one on the other
    const [br, bi] = rings(-l - OV, -w - OV, l + OV, w + OV, 2.4, 1);
    put(plinth, prism(P, front, br, bi, 0, PL));
    const dx = -l * 0.36, dw = 4.6;
    const [sr, si] = rings(dx - dw - 3, w + OV, dx + dw + 3, w + OV + 4.5, 1.4, 0.6);
    put(step, prism(P, front, sr, si, 0, PL / 2));
    const [wr, wi] = rings(-l, -w, l, w, 1.6, 0.8);
    put(walls, prism(P, front, wr, wi, PL, ZW));
    // the door and a window on the front (+y) face, a window on the side (+x) face
    const fy = (u, v) => P(u, w, v), fx = (u, v) => P(l, u, v);
    door.setAttribute("d", hole(dx - dw, PL, dx + dw, PL + 17, fy));
    const wx = l * 0.42, ww = Math.min(6, l * 0.2), sw = Math.min(7, w * 0.3);
    wins.setAttribute("d", hole(wx - ww, PL + 8, wx + ww, PL + 17, fy) + hole(-sw, PL + 8, sw, PL + 17, fx));
    // the hipped roof: the hull of the eave ring (with its fascia) and the ridge
    const a = l + EV, b = w + EV, h = Math.min(a, b) * Math.tan(rad(p));
    const ra = Math.max(0.7, a - b), rb = Math.max(0.7, b - a);
    const eave = rrect(-a, -b, a, b, 2.4, 4), ridge = rrect(-ra, -rb, ra, rb, 0.7, 3);
    const sil = poly(hull(ringAt(P, eave, ZW - FS).concat(ringAt(P, eave, ZW), ringAt(P, ridge, ZW + h))));
    // steeper than the camera's 30°, the back slopes turn away: of the hips only the near one is inside the outline
    const crease = open(ringAt(P, run(eave, front), ZW)) + seg(P(a - 1, b - 1, ZW), P(ra - 0.7, rb - 0.7, ZW + h));
    put(roof, { sil, crease });
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const s of [L, W, pitch]) if (stepS(s, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B.unregister);

  function aim(over) {
    const [li, wi] = over ? [odd(Math.abs(over[0]) * 2 * IN), odd(Math.abs(over[1]) * 2 * IN)] : REST;
    L.t = li / IN; W.t = wi / IN;
    plinth.sil.classList.toggle("hi", !!over);
    door.classList.toggle("hi", !over);
    read.textContent = over ? `දිග ${ftin(li)} × පළල ${ftin(wi)}` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (q) => aim(unproj(C, q[0], q[1], 0)),
    leave: () => aim(null),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { pitch.t = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "plot",
  means: "A house on its plot: the pointer sets its length and width in odd inches, and the plinth, walls and hipped roof follow.",
  rules: [1, 3, 5, 9],
  range: [32, 38, 44],
  tour: [[238, 227], [200, 208], [166, 227], null],
  mount,
});

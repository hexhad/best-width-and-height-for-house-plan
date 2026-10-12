# වාස්තු මිනුම් (Wasthu dimensions)

Find house lengths and widths that satisfy the traditional Sri Lankan Wasthu Vidyawa (Ayadi) rules, or check the dimensions of an existing plan. The interface is in Sinhala and English (toggle in the top bar); all strings live in `src/lib/i18n.js`.

```sh
yarn          # install
yarn dev      # http://localhost:5173
yarn test     # rule engine tests
yarn build
```

## How it works

All maths lives in `src/lib/wasthu.js`. For a plan of `length × width` inches, each factor is `(area × multiplier) mod divisor`:

| Factor | × | mod | Rule (default) |
| --- | --- | --- | --- |
| අය | 8 | 12 | greater than 6, and greater than වැය |
| වැය | 9 | 10 | less than 5 |
| යෝනි | 3 | 8 | 1, 3, 5 or 7, with no clash against its නැකත, දවස, තිථි or රාශිය |
| නැකත | 8 | 27 | 2, 5, 7, 9, 11, 14, 16, 18, 20, 23, 25, 27 |
| දවස | 9 | 7 | 2, 3, 6 |
| අයුෂ | 27 | 100 | greater than 50 |
| අංශක | 4 | 9 | 1, 3, 5, 6, 8 |
| රාශිය | 5 | 12 | 2, 3, 5, 9, 11 |
| තිථිය | 9 | 30 | not 5, 10, 15, 20, 25, 30 |
| වංශය | 3 | 4 | 1, 2, 3 |
| දෙවතා | 5 | 3 | 1, 2 |

Two settings can be switched in the UI:

- **Odd inches only** (on by default): only odd-inch lengths and widths are searched.
- **Zero remainder = divisor** (on by default): a remainder of 0 is read as the divisor (0 අය is 12, 0 දවස is 7, 0 තිථිය is 30). Turn it off for the raw remainder. With every rule on, both readings give the same plans; they differ when some rules are off.

## Visuals

- 3D preview of the selected plan: three.js via `@react-three/fiber` and `drei`, lazy loaded.
- Page background and logo: `@paper-design/shaders-react` (MeshGradient, LiquidMetal).

---

<p align="center">
  <a href="https://hexhad.github.io"><img src=".github/hexhad.svg" width="40" height="40" alt="HEXHAD"></a>
  <br>
  <sub>Built by <a href="https://hexhad.github.io"><b>HEXHAD</b></a> · Made in Sri Lanka</sub>
</p>

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowsOutSimple, CaretDown, Desktop, MagnifyingGlass, Moon, Ruler, Sun } from "@phosphor-icons/react";
import { ALL_RULE_IDS, MAX_INCHES, MIN_INCHES, RULES, SORTS, evaluate, nearest, scan } from "./lib/wasthu.js";
import { usePersistentState } from "./hooks/usePersistentState.js";
import { useTheme } from "./hooks/useTheme.js";
import { LangContext, useLang } from "./hooks/useLang.js";
import { Parts } from "./components/Parts.jsx";
import { Backdrop, LiquidMark } from "./components/Atmosphere.jsx";
import { DimensionInput, RangeField, RuleToggle, Segmented, Switch } from "./components/Controls.jsx";
import { PlanReport, ResultGrid } from "./components/Results.jsx";
import { MadeByHexhad } from "./components/Hexhad.jsx";

const PAGE = 48;

const RULE_GROUPS = [
  { key: "money", ids: ["aya", "weya", "ayaWeya", "ayusha"] },
  { key: "yoni", ids: ["yoni", "yoniMatch"] },
  { key: "time", ids: ["nekatha", "dawasa", "thithiya", "rashiya"] },
  { key: "other", ids: ["anshaka", "wanshaya", "dewatha"] },
];
const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

const THEME_ICON = { auto: <Desktop size={18} />, light: <Sun size={18} />, dark: <Moon size={18} /> };

export default function App() {
  const theme = useTheme();
  const { t, toggle: toggleLang } = useLang();
  const [mode, setMode] = usePersistentState("mode", "search");
  const [lengthRange, setLengthRange] = usePersistentState("lengthRange", [361, 500]);
  const [widthRange, setWidthRange] = usePersistentState("widthRange", [281, 391]);
  const [manual, setManual] = usePersistentState("manual", { length: 371, width: 301 });
  const [ruleIds, setRuleIds] = usePersistentState("rules", ALL_RULE_IDS);
  const [oddOnly, setOddOnly] = usePersistentState("oddOnly", true);
  const [zeroAsDivisor, setZeroAsDivisor] = usePersistentState("zeroAsDivisor", true);
  const [sort, setSort] = usePersistentState("sort", "areaAsc");
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState(null);
  // Rules start open where there is room beside the results, folded on phones.
  const [rulesOpen, setRulesOpen] = useState(() => matchMedia("(min-width: 960px)").matches);

  const active = useMemo(() => new Set(ruleIds.filter((id) => RULE_BY_ID[id])), [ruleIds]);
  const opts = { zeroAsDivisor };

  // Scanning follows the sliders a frame behind, so dragging stays smooth on large ranges.
  const liveQuery = useMemo(
    () => ({ lengthRange, widthRange, active, oddOnly, zeroAsDivisor }),
    [lengthRange, widthRange, active, oddOnly, zeroAsDivisor],
  );
  const query = useDeferredValue(liveQuery);
  const { hits, checked } = useMemo(
    () =>
      scan({
        length: query.lengthRange,
        width: query.widthRange,
        active: query.active,
        oddOnly: query.oddOnly,
        zeroAsDivisor: query.zeroAsDivisor,
      }),
    [query],
  );
  const sorted = useMemo(() => [...hits].sort(SORTS[sort] ?? SORTS.areaAsc), [hits, sort]);

  const selectedHit = sorted.find((h) => `${h.length}x${h.width}` === selected) ?? sorted[0];
  const searchPlan = selectedHit && evaluate(selectedHit.length, selectedHit.width, active, opts);

  const manualValid = manual.length >= 12 && manual.width >= 12;
  const manualPlan = manualValid ? evaluate(manual.length, manual.width, active, opts) : null;
  const manualFails = manualPlan ? !manualPlan.ok : false;
  const suggestions = useMemo(
    () => (manualFails ? nearest(manual.length, manual.width, { active, oddOnly, zeroAsDivisor }) : null),
    [manualFails, manual.length, manual.width, active, oddOnly, zeroAsDivisor],
  );

  const toggleRule = (id) =>
    setRuleIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : ALL_RULE_IDS.filter((x) => x === id || ids.includes(x)),
    );

  const resetPage = (fn) => (v) => {
    fn(v);
    setShown(PAGE);
  };

  const themeLabel = `${t.theme.label}: ${t.theme[theme.pref]}`;

  return (
    <LangContext value={t}>
      <Backdrop theme={theme.resolved} />

      <header className="topbar">
        <div className="brand">
          <LiquidMark theme={theme.resolved} />
          <span className="brand-name">{t.brand}</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="lang-btn" onClick={toggleLang} lang={t.lang === "si" ? "en" : "si"}>
            {t.switchTo}
          </button>
          <button type="button" className="icon-btn" onClick={theme.cycle} aria-label={themeLabel} title={themeLabel}>
            {THEME_ICON[theme.pref]}
          </button>
        </div>
      </header>

      <main className="shell">
        <section className="intro">
          <div className="intro-copy">
            <h1>{t.heading}</h1>
            <p className="lede">{t.lede}</p>
          </div>
        </section>

        <section className="workspace">
          <aside className="panel glass" aria-label={t.settings}>
            <Segmented
              label={t.mode}
              value={mode}
              onChange={setMode}
              options={[
                { value: "search", label: t.search, icon: <MagnifyingGlass size={16} /> },
                { value: "check", label: t.check, icon: <Ruler size={16} /> },
              ]}
            />

            {mode === "search" ? (
              <div className="panel-section">
                <RangeField
                  label={t.length}
                  value={lengthRange}
                  onChange={resetPage(setLengthRange)}
                  min={MIN_INCHES}
                  max={MAX_INCHES}
                />
                <RangeField
                  label={t.width}
                  value={widthRange}
                  onChange={resetPage(setWidthRange)}
                  min={MIN_INCHES}
                  max={MAX_INCHES}
                />
              </div>
            ) : (
              <div className="panel-section dims">
                <DimensionInput
                  label={t.length}
                  inches={manual.length}
                  onChange={(length) => setManual((m) => ({ ...m, length }))}
                />
                <DimensionInput label={t.width} inches={manual.width} onChange={(width) => setManual((m) => ({ ...m, width }))} />
              </div>
            )}

            <details className="panel-section rules" open={rulesOpen} onToggle={(e) => setRulesOpen(e.currentTarget.open)}>
              <summary>
                <h2>{t.rules}</h2>
                <span className="num faint">
                  {active.size}/{RULES.length}
                </span>
                <CaretDown size={14} className="caret" aria-hidden="true" />
              </summary>
              <div className="link-row">
                <button
                  type="button"
                  className="link"
                  onClick={() => resetPage(setRuleIds)(ALL_RULE_IDS)}
                  disabled={active.size === RULES.length}
                >
                  {t.selectAll}
                </button>
                <button type="button" className="link" onClick={() => resetPage(setRuleIds)([])} disabled={active.size === 0}>
                  {t.clearAll}
                </button>
              </div>
              {RULE_GROUPS.map((g) => (
                <div key={g.key} className="rule-group">
                  <h3>{t.groups[g.key]}</h3>
                  {g.ids.map((id) => (
                    <RuleToggle key={id} id={id} on={active.has(id)} onToggle={() => resetPage(toggleRule)(id)} />
                  ))}
                </div>
              ))}
            </details>

            <div className="panel-section">
              <h2>{t.calculation}</h2>
              <Switch checked={oddOnly} onChange={resetPage(setOddOnly)} label={t.oddOnly} hint={t.oddOnlyHint} />
              <Switch
                checked={zeroAsDivisor}
                onChange={resetPage(setZeroAsDivisor)}
                label={t.zeroAsDivisor}
                hint={t.zeroAsDivisorHint}
              />
            </div>
          </aside>

          <div className="results">
            {mode === "search" ? (
              <>
                <div className="toolbar">
                  <p className="count">
                    <Parts parts={t.count(checked.toLocaleString(), hits.length.toLocaleString())} />
                  </p>
                  {hits.length > 1 && (
                    <label className="sort">
                      <span className="visually-hidden">{t.sortBy}</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        {Object.keys(SORTS).map((k) => (
                          <option key={k} value={k}>
                            {t.sorts[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {searchPlan ? (
                  <>
                    <PlanReport plan={searchPlan} theme={theme.resolved} />
                    <ResultGrid
                      items={sorted.slice(0, shown)}
                      selected={`${searchPlan.length}x${searchPlan.width}`}
                      onSelect={setSelected}
                    />
                    {shown < sorted.length && (
                      <button type="button" className="more" onClick={() => setShown((n) => n + PAGE * 2)}>
                        {t.showMore} <span className="num faint">({(sorted.length - shown).toLocaleString()})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty glass">
                    <h2>{t.noneTitle}</h2>
                    <p className="muted">{t.noneBody}</p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setLengthRange([MIN_INCHES, MAX_INCHES]);
                        setWidthRange([MIN_INCHES, MAX_INCHES]);
                      }}
                    >
                      <ArrowsOutSimple size={16} />
                      {t.maxRange}
                    </button>
                  </div>
                )}
              </>
            ) : manualPlan ? (
              <PlanReport
                plan={manualPlan}
                theme={theme.resolved}
                suggestions={suggestions}
                onPick={(s) => setManual({ length: s.length, width: s.width })}
              />
            ) : (
              <div className="empty glass">
                <h2>{t.enterTitle}</h2>
                <p className="muted">{t.enterBody}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>{t.footer}</p>
        <div className="footer-studio">
          <MadeByHexhad />
          <span>© {new Date().getFullYear()} HEXHAD</span>
        </div>
      </footer>
    </LangContext>
  );
}

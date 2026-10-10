import { useDeferredValue, useMemo, useState } from "react";
import { ArrowsOutSimple, CaretDown, Desktop, MagnifyingGlass, Moon, Ruler, Sun } from "@phosphor-icons/react";
import { ALL_RULE_IDS, MAX_INCHES, MIN_INCHES, RULES, SORTS, evaluate, nearest, scan } from "./lib/wasthu.js";
import { usePersistentState } from "./hooks/usePersistentState.js";
import { useTheme } from "./hooks/useTheme.js";
import { Backdrop, LiquidMark } from "./components/Atmosphere.jsx";
import { DimensionInput, RangeField, RuleToggle, Segmented, Switch } from "./components/Controls.jsx";
import { PlanReport, ResultGrid } from "./components/Results.jsx";

const PAGE = 48;

const RULE_GROUPS = [
  { title: "අය සහ වැය", ids: ["aya", "weya", "ayaWeya", "ayusha"] },
  { title: "යෝනිය", ids: ["yoni", "yoniMatch"] },
  { title: "නැකත සහ කාලය", ids: ["nekatha", "dawasa", "thithiya", "rashiya"] },
  { title: "අනෙකුත්", ids: ["anshaka", "wanshaya", "dewatha"] },
];
const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

const THEME_ICON = { auto: <Desktop size={18} />, light: <Sun size={18} />, dark: <Moon size={18} /> };
const THEME_LABEL = { auto: "පද්ධතියට අනුව", light: "ආලෝක", dark: "අඳුරු" };

export default function App() {
  const theme = useTheme();
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
  const sorted = useMemo(() => [...hits].sort((SORTS[sort] ?? SORTS.areaAsc).fn), [hits, sort]);

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

  return (
    <>
      <Backdrop theme={theme.resolved} />

      <header className="topbar">
        <div className="brand">
          <LiquidMark theme={theme.resolved} />
          <span className="brand-name">වාස්තු මිනුම්</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={theme.cycle}
          aria-label={`තේමාව: ${THEME_LABEL[theme.pref]}`}
          title={`තේමාව: ${THEME_LABEL[theme.pref]}`}
        >
          {THEME_ICON[theme.pref]}
        </button>
      </header>

      <main className="shell">
        <section className="intro">
          <div className="intro-copy">
            <h1>නිවසට ශුභ දිග සහ පළල</h1>
            <p className="lede">ආයාදි නීති 13 අනුව ගැළපෙන මිනුම් සොයන්න, නැතහොත් ඔබේ සැලැස්මේ මිනුම් පරීක්ෂා කරන්න.</p>
          </div>
          <figure className="intro-figure">
            <iframe
              key={theme.resolved}
              src={`${import.meta.env.BASE_URL}hairline-plot.html?theme=${theme.resolved}&play=1`}
              title="නිවසේ දිග සහ පළල වෙනස් කරන රේඛා චිත්‍රය"
              loading="lazy"
            />
          </figure>
        </section>

        <section className="workspace">
          <aside className="panel glass" aria-label="සැකසුම්">
            <Segmented
              label="ක්‍රමය"
              value={mode}
              onChange={setMode}
              options={[
                { value: "search", label: "සොයන්න", icon: <MagnifyingGlass size={16} /> },
                { value: "check", label: "පරීක්ෂා කරන්න", icon: <Ruler size={16} /> },
              ]}
            />

            {mode === "search" ? (
              <div className="panel-section">
                <RangeField
                  label="දිග"
                  value={lengthRange}
                  onChange={resetPage(setLengthRange)}
                  min={MIN_INCHES}
                  max={MAX_INCHES}
                />
                <RangeField
                  label="පළල"
                  value={widthRange}
                  onChange={resetPage(setWidthRange)}
                  min={MIN_INCHES}
                  max={MAX_INCHES}
                />
              </div>
            ) : (
              <div className="panel-section dims">
                <DimensionInput label="දිග" inches={manual.length} onChange={(length) => setManual((m) => ({ ...m, length }))} />
                <DimensionInput label="පළල" inches={manual.width} onChange={(width) => setManual((m) => ({ ...m, width }))} />
              </div>
            )}

            <details className="panel-section rules" open={rulesOpen} onToggle={(e) => setRulesOpen(e.currentTarget.open)}>
              <summary>
                <h2>නීති</h2>
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
                  සියල්ල තෝරන්න
                </button>
                <button type="button" className="link" onClick={() => resetPage(setRuleIds)([])} disabled={active.size === 0}>
                  සියල්ල ඉවත් කරන්න
                </button>
              </div>
              {RULE_GROUPS.map((g) => (
                <div key={g.title} className="rule-group">
                  <h3>{g.title}</h3>
                  {g.ids.map((id) => (
                    <RuleToggle key={id} rule={RULE_BY_ID[id]} on={active.has(id)} onToggle={() => resetPage(toggleRule)(id)} />
                  ))}
                </div>
              ))}
            </details>

            <div className="panel-section">
              <h2>ගණනය කිරීම</h2>
              <Switch
                checked={oddOnly}
                onChange={resetPage(setOddOnly)}
                label="ඔත්තේ අඟල් පමණක්"
                hint="සම්ප්‍රදායට අනුව දිග සහ පළල ඔත්තේ අඟල් වේ"
              />
              <Switch
                checked={zeroAsDivisor}
                onChange={resetPage(setZeroAsDivisor)}
                label="ශේෂය 0 නම් බෙදුම්කාරය ගන්න"
                hint="උදා: අය 0 නම් 12 ලෙස, දවස 0 නම් 7 ලෙස"
              />
            </div>
          </aside>

          <div className="results">
            {mode === "search" ? (
              <>
                <div className="toolbar">
                  <p className="count">
                    <span className="num">{checked.toLocaleString()}</span> න් ගැළපෙන{" "}
                    <strong className="num">{hits.length.toLocaleString()}</strong>
                  </p>
                  {hits.length > 1 && (
                    <label className="sort">
                      <span className="visually-hidden">පිළිවෙල</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        {Object.entries(SORTS).map(([k, s]) => (
                          <option key={k} value={k}>
                            {s.label}
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
                        තවත් පෙන්වන්න <span className="num faint">({(sorted.length - shown).toLocaleString()})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty glass">
                    <h2>මෙම පරාසයේ ගැළපෙන මිනුමක් නැත</h2>
                    <p className="muted">පරාසය පුළුල් කරන්න, නැතහොත් නීති කිහිපයක් ඉවත් කරන්න.</p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setLengthRange([MIN_INCHES, MAX_INCHES]);
                        setWidthRange([MIN_INCHES, MAX_INCHES]);
                      }}
                    >
                      <ArrowsOutSimple size={16} />
                      උපරිම පරාසය
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
                <h2>දිග සහ පළල ඇතුලත් කරන්න</h2>
                <p className="muted">අඩි සහ අඟල් වලින් ඇතුලත් කළ විට ප්‍රතිඵලය මෙහි පෙන්වයි.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>ගණනය කිරීම් සම්ප්‍රදායික ආයාදි ක්‍රමයට අනුවයි. ඉදිකිරීමට පෙර වාස්තු ශිල්පියෙකුගෙන් තහවුරු කරගන්න.</p>
      </footer>
    </>
  );
}

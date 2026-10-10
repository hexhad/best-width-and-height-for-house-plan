import { lazy, Suspense } from "react";
import { ArrowRight, Check, Minus, X } from "@phosphor-icons/react";
import { FACTORS, RULES, fmtFtIn, sqft, yoniClashes } from "../lib/wasthu.js";
import { useReducedMotion } from "../hooks/useMedia.js";

const HouseScene = lazy(() => import("./HouseScene.jsx"));

const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));
const FACTOR_LABEL = Object.fromEntries(FACTORS.map((f) => [f.key, f.label]));

function factorStatus(key, verdicts) {
  const linked = verdicts.filter((v) => v.on && RULE_BY_ID[v.id].factor === key);
  if (linked.length === 0) return "off";
  return linked.every((v) => v.pass) ? "pass" : "fail";
}

const STATUS_ICON = {
  pass: <Check size={14} weight="bold" aria-label="සමත්" />,
  fail: <X size={14} weight="bold" aria-label="අසමත්" />,
  off: <Minus size={14} aria-label="නීතියක් නැත" />,
};

/** Every factor of one plan, with its verdict against the active rules, and a 3D preview. */
export function PlanReport({ plan, theme, suggestions, onPick }) {
  const reduce = useReducedMotion();
  const failed = plan.verdicts.filter((v) => v.on && !v.pass);
  const activeCount = plan.verdicts.filter((v) => v.on).length;
  const clashes = yoniClashes(plan.factors);

  return (
    <article className="report glass" aria-live="polite">
      <div className="report-scene">
        <Suspense fallback={<div className="scene-skeleton" />}>
          <HouseScene length={plan.length} width={plan.width} theme={theme} reduce={reduce} />
        </Suspense>
      </div>

      <div className="report-body">
        <header className="report-head">
          <div className={`verdict ${plan.ok ? "ok" : "bad"}`}>
            {plan.ok ? <Check size={16} weight="bold" /> : <X size={16} weight="bold" />}
            {plan.ok ? "ශුභයි" : "ගැළපෙන්නේ නැත"}
          </div>
          <h2 className="num">
            {fmtFtIn(plan.length)} <span className="faint">×</span> {fmtFtIn(plan.width)}
          </h2>
          <p className="muted">
            වර්ගඵලය <span className="num">{sqft(plan.area)}</span> වර්ග අඩි. නීති {activeCount} න්{" "}
            <span className="num">{plan.passed}</span> ක් සමත්.
          </p>
        </header>

        {failed.length > 0 && (
          <ul className="fail-list">
            {failed.map((v) => (
              <li key={v.id}>
                <X size={13} weight="bold" aria-hidden="true" />
                {RULE_BY_ID[v.id].label}
                {v.id === "yoniMatch" && clashes.length > 0 && (
                  <span className="faint"> ({clashes.map((k) => FACTOR_LABEL[k]).join(", ")})</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <dl className="factors">
          {FACTORS.map((f) => {
            const v = plan.factors[f.key];
            const status = factorStatus(f.key, plan.verdicts);
            return (
              <div key={f.key} className={`factor ${status}`}>
                <dt>
                  {f.label}
                  <span className="factor-status">{STATUS_ICON[status]}</span>
                </dt>
                <dd>
                  <span className="factor-value num">
                    {v}
                    <span className="faint">/{f.div}</span>
                  </span>
                  {f.name && <span className="factor-name">{f.name(v)}</span>}
                </dd>
              </div>
            );
          })}
        </dl>

        {suggestions && (
          <section className="suggest" aria-label="ළඟම ශුභ මිනුම්">
            <h3>ළඟම ශුභ මිනුම්</h3>
            {suggestions.length === 0 ? (
              <p className="muted">අඟල් 24 ක් ඇතුලත ගැළපෙන මිනුමක් නැත. නීති කිහිපයක් ඉවත් කර බලන්න.</p>
            ) : (
              <div className="suggest-list">
                {suggestions.map((s) => (
                  <button key={`${s.length}x${s.width}`} type="button" className="suggest-item" onClick={() => onPick(s)}>
                    <span className="num">
                      {fmtFtIn(s.length)} × {fmtFtIn(s.width)}
                    </span>
                    <span className="faint num">
                      {s.length - plan.length >= 0 ? "+" : ""}
                      {s.length - plan.length}" / {s.width - plan.width >= 0 ? "+" : ""}
                      {s.width - plan.width}"
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </article>
  );
}

/** Passing sizes as a selectable grid. */
export function ResultGrid({ items, selected, onSelect }) {
  return (
    <ul className="result-grid" role="listbox" aria-label="ශුභ මිනුම්">
      {items.map((h, i) => {
        const key = `${h.length}x${h.width}`;
        const isSel = selected === key;
        return (
          <li key={key} style={{ "--i": Math.min(i, 12) }}>
            <button type="button" role="option" aria-selected={isSel} className="result" onClick={() => onSelect(key)}>
              <span className="result-dims num">
                {fmtFtIn(h.length)}
                <span className="faint"> × </span>
                {fmtFtIn(h.width)}
              </span>
              <span className="result-meta">
                <span className="num">{sqft(h.area)}</span> වර්ග අඩි
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

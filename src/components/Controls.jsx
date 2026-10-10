import { useId } from "react";
import { Check } from "@phosphor-icons/react";
import { fmtFtIn, toFeet } from "../lib/wasthu.js";

/** A two-thumb range built from two native range inputs, so keyboard and screen readers just work. */
export function RangeField({ label, value, onChange, min, max }) {
  const id = useId();
  const [a, b] = value;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const pct = (v) => ((v - min) / (max - min)) * 100;

  return (
    <div className="range-field">
      <div className="range-head">
        <span id={id} className="field-label">
          {label}
        </span>
        <span className="range-values num">
          {fmtFtIn(lo)} <span className="faint">සිට</span> {fmtFtIn(hi)}
        </span>
      </div>
      <div className="range-track" style={{ "--lo": `${pct(lo)}%`, "--hi": `${pct(hi)}%` }}>
        <input
          type="range"
          min={min}
          max={max}
          value={a}
          aria-labelledby={id}
          aria-label="අවම"
          aria-valuetext={fmtFtIn(a)}
          onChange={(e) => onChange([Number(e.target.value), b])}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={b}
          aria-labelledby={id}
          aria-label="උපරිම"
          aria-valuetext={fmtFtIn(b)}
          onChange={(e) => onChange([a, Number(e.target.value)])}
        />
      </div>
      <div className="range-scale num faint">
        <span>{fmtFtIn(min)}</span>
        <span>{fmtFtIn(max)}</span>
      </div>
    </div>
  );
}

/** Feet + inches entry for one dimension; reports total inches. */
export function DimensionInput({ label, inches, onChange }) {
  const id = useId();
  const { ft, inch } = toFeet(inches);
  const set = (nextFt, nextIn) => onChange(Math.max(0, nextFt) * 12 + Math.min(11, Math.max(0, nextIn)));
  const parse = (s) => (s === "" ? 0 : Math.floor(Number(s)) || 0);

  return (
    <fieldset className="dim-input">
      <legend className="field-label">{label}</legend>
      <div className="dim-row">
        <label className="dim-cell" htmlFor={`${id}-ft`}>
          <input
            id={`${id}-ft`}
            className="num"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={ft}
            onChange={(e) => set(parse(e.target.value), inch)}
          />
          <span>අඩි</span>
        </label>
        <label className="dim-cell" htmlFor={`${id}-in`}>
          <input
            id={`${id}-in`}
            className="num"
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            value={inch}
            onChange={(e) => set(ft, parse(e.target.value))}
          />
          <span>අඟල්</span>
        </label>
      </div>
      <p className="helper num">= අඟල් {inches}</p>
    </fieldset>
  );
}

export function Switch({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch-row" onClick={() => onChange(!checked)}>
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>
      <span className="switch" aria-hidden="true" />
    </button>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={label}
      style={{ "--count": options.length, "--index": options.findIndex((o) => o.value === value) }}
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A rule toggle: label, the values it accepts, and a check when on. */
export function RuleToggle({ rule, on, onToggle }) {
  return (
    <button type="button" className="rule" aria-pressed={on} onClick={onToggle}>
      <span className="rule-box" aria-hidden="true">
        <Check size={12} weight="bold" />
      </span>
      <span className="rule-text">
        <span className="rule-label">{rule.label}</span>
        <span className="rule-hint">{rule.hint}</span>
      </span>
    </button>
  );
}

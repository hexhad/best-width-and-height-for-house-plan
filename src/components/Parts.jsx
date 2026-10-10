/** Renders a sentence from i18n parts: strings as text, { n } parts as numbers. */
export function Parts({ parts }) {
  return parts.map((p, i) =>
    typeof p === "string" ? (
      p
    ) : p.strong ? (
      <strong key={i} className="num">
        {p.n}
      </strong>
    ) : (
      <span key={i} className="num">
        {p.n}
      </span>
    ),
  );
}

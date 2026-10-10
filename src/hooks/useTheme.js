import { useEffect } from "react";
import { useMedia } from "./useMedia.js";
import { usePersistentState } from "./usePersistentState.js";

const ORDER = ["auto", "light", "dark"];

/** Theme preference (auto, light, dark) and the resolved theme. */
export function useTheme() {
  const [pref, setPref] = usePersistentState("theme", "auto");
  const systemDark = useMedia("(prefers-color-scheme: dark)");
  const resolved = pref === "auto" ? (systemDark ? "dark" : "light") : pref;

  useEffect(() => {
    const root = document.documentElement;
    if (pref === "auto") delete root.dataset.theme;
    else root.dataset.theme = pref;
  }, [pref]);

  const cycle = () => setPref((p) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length]);
  return { pref, resolved, cycle };
}

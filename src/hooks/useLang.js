import { createContext, useContext, useEffect } from "react";
import { STRINGS } from "../lib/i18n.js";
import { usePersistentState } from "./usePersistentState.js";

export const LangContext = createContext(STRINGS.si);

/** The active language's strings. */
export const useT = () => useContext(LangContext);

/** The chosen language (Sinhala by default), its strings, and a toggle. Keeps <html lang> and the title in step. */
export function useLang() {
  const [lang, setLang] = usePersistentState("lang", "si");
  const t = STRINGS[lang] ?? STRINGS.si;

  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.title = t.title;
  }, [t]);

  const toggle = () => setLang((l) => (l === "si" ? "en" : "si"));
  return { t, toggle };
}

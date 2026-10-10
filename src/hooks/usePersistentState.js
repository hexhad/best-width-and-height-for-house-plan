import { useEffect, useState } from "react";

const PREFIX = "wasthu:";

/** useState that remembers its value in localStorage. Storage failures are ignored. */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // private mode or blocked storage: keep working in memory
    }
  }, [key, value]);

  return [value, setValue];
}

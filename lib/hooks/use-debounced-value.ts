"use client";

import { useEffect, useState } from "react";

/** Debounces a fast-changing value (typically search input) so it settles
 *  before driving a query. Three call sites (media library, projects,
 *  templates) each hand-rolled their own `setTimeout` debounce with slightly
 *  different delays before this — one shared home. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

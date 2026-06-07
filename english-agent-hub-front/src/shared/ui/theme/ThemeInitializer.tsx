"use client";

import { useEffect } from "react";
import { themeColorActions } from "./themeStore";

export function ThemeInitializer() {
  useEffect(() => {
    themeColorActions.hydrate();
  }, []);
  return null;
}

"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("qawra-theme");
    const shouldDark = saved === "dark";

    document.documentElement.classList.toggle("dark", shouldDark);
    setReady(true);
  }, []);

  return <>{children}</>;
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  function toggleTheme() {
    const nextTheme = !isDark;
    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("color-theme", nextTheme ? "dark" : "light");
    setIsDark(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
      aria-label="Đổi giao diện sáng tối"
      title="Đổi giao diện sáng tối"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

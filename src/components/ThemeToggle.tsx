"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Reads state set by the no-flash inline script (ThemeScript) in <head>,
    // which runs before hydration — server and first client render must both
    // show "dark" to avoid a hydration mismatch, so this can't be a lazy
    // useState initializer; it has to correct itself post-mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLight(document.documentElement.dataset.theme === "light");
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("theme", next ? "light" : "dark");
  }

  return (
    <div className="flex h-16 w-full items-center justify-between border-t border-b border-[#343b4f] px-8 py-5">
      <span className="text-base font-medium text-[#aec4e1]">Тема</span>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        onClick={toggle}
        className={`flex h-[22px] w-[41px] shrink-0 items-center rounded-full p-[2px] transition-colors ${
          isLight ? "justify-end bg-[var(--accent-orange)]" : "justify-start bg-[#000c12]"
        }`}
      >
        <span className="size-[18px] rounded-full bg-white" />
      </button>
    </div>
  );
}

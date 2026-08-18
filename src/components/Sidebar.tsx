"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { CloseIcon, MenuIcon } from "./icons";

// Sidebar always stays dark regardless of the light/dark content theme,
// so its colors are hardcoded here rather than driven by CSS variables.
const SIDEBAR_SURFACE = "#0c2333";
const SIDEBAR_ACCENT_BLUE = "#519ef5";
const SIDEBAR_TEXT_INACTIVE = "#aec4e1";

const NAV = [
  { href: "/income", label: "Доходы", icon: "nav-income" },
  { href: "/expenses", label: "Расходы", icon: "nav-expenses" },
  { href: "/reports", label: "Отчёты", icon: "nav-reports" },
  { href: "/certificates", label: "Сертификаты", icon: "nav-certificates" },
  { href: "/history", label: "История", icon: "nav-history" },
  { href: "/settings", label: "Настройки", icon: "nav-settings" },
];

// Shared between the fixed desktop rail and the mobile slide-in drawer —
// same nav links, theme toggle and logout, just wrapped differently.
function SidebarContent({
  logoutAction,
  onNavigate,
  onClose,
}: {
  logoutAction: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/figma/logo.svg" alt="" width={23} height={27} />
          <p className="text-xl font-extrabold tracking-wide text-white uppercase">Accounting</p>
        </div>
        {onClose && (
          <button type="button" aria-label="Закрыть" onClick={onClose} className="cursor-pointer text-white">
            <CloseIcon />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 border-l-4 px-8 py-5 text-base font-medium hover:bg-white/5"
              style={{
                borderColor: active ? SIDEBAR_ACCENT_BLUE : "transparent",
                backgroundColor: active ? "rgba(48,130,223,0.1)" : "transparent",
                color: active ? SIDEBAR_ACCENT_BLUE : SIDEBAR_TEXT_INACTIVE,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/icons/figma/${item.icon}${active ? "-active" : ""}.svg`}
                alt=""
                width={24}
                height={24}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ThemeToggle />

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 px-8 py-5 text-base font-medium hover:bg-white/5"
          style={{ color: SIDEBAR_TEXT_INACTIVE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/figma/nav-logout.svg" alt="" width={24} height={24} />
          Выйти
        </button>
      </form>
    </>
  );
}

// Fixed rail, desktop only — the mobile equivalent is MobileNav below.
export function Sidebar({ logoutAction }: { logoutAction: () => void }) {
  return (
    <div
      className="hidden h-full w-[300px] shrink-0 flex-col md:flex"
      style={{ backgroundColor: SIDEBAR_SURFACE }}
    >
      <SidebarContent logoutAction={logoutAction} />
    </div>
  );
}

// Compact top bar + slide-in drawer, mobile only (see the Figma mobile frames —
// the fixed desktop rail becomes a hamburger menu below the md breakpoint).
export function MobileNav({ logoutAction }: { logoutAction: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center justify-between p-6 md:hidden" style={{ backgroundColor: SIDEBAR_SURFACE }}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/figma/logo.svg" alt="" width={23} height={27} />
        <p className="text-xl font-extrabold tracking-wide text-white uppercase">Accounting</p>
      </div>
      <button type="button" aria-label="Меню" onClick={() => setOpen(true)} className="cursor-pointer text-white">
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-[300px] max-w-[85vw] flex-col overflow-y-auto"
            style={{ backgroundColor: SIDEBAR_SURFACE }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              logoutAction={logoutAction}
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

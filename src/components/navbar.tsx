"use client";

import { AboutDialog } from "@/components/about/about-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { APP_INFO } from "@/lib/app-info";

export function Navbar() {
  return (
    <header className="navbar-glass">
      <div className="navbar-content">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gruvbox-green/20 flex items-center justify-center">
            <span className="text-gruvbox-green text-2xl">♪</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-gruvbox-text sm:text-2xl">
            {APP_INFO.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <AboutDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { APP_INFO } from "@/lib/app-info";

export function AboutDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Acerca de"
        title="Acerca de"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gruvbox-surface/60 text-gruvbox-text transition-all duration-200 hover:bg-gruvbox-surface hover:shadow-md hover:scale-105 border border-gruvbox-gray/35 dark:border-gruvbox-gray"
      >
        <Info className="h-4 w-4" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-gruvbox-gray/25 bg-gruvbox-surface shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gruvbox-green/20 flex items-center justify-center">
                    <span className="text-gruvbox-green text-xl">♪</span>
                  </div>
                  <h2 className="text-xl font-bold text-gruvbox-text">
                    {APP_INFO.name}
                  </h2>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-gruvbox-gray hover:text-gruvbox-text hover:bg-gruvbox-gray/20 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-gruvbox-text/90 leading-relaxed">
                {APP_INFO.description}
              </p>

              <div className="mt-6 space-y-2.5 border-t border-gruvbox-gray/25 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gruvbox-gray">Versión</span>
                  <span className="font-medium text-gruvbox-text">
                    {APP_INFO.version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gruvbox-gray">Desarrollador</span>
                  <span className="font-medium text-gruvbox-text">
                    {APP_INFO.author}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
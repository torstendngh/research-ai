"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import { Button } from "@/components/shared/button";
import LogoIcon from "@/components/shared/icons/logo-icon";

const STORAGE_KEY = "beta-notice-acknowledged";

// Tiny localStorage-backed store so the dialog stays closed during SSR and
// re-renders when acknowledged, without setting state from an effect.
let listeners: (() => void)[] = [];
const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};
const isAcknowledged = () => localStorage.getItem(STORAGE_KEY) !== null;
const acknowledge = () => {
  localStorage.setItem(STORAGE_KEY, "true");
  listeners.forEach((l) => l());
};

/**
 * One-time notice shown on the landing page: the app is a beta under active
 * development and shouldn't be trusted with important work. Acknowledging it
 * is remembered per browser via localStorage.
 */
const BetaNoticeDialog = () => {
  const acknowledged = useSyncExternalStore(
    subscribe,
    isAcknowledged,
    () => true, // treat as acknowledged on the server so SSR renders nothing
  );

  return (
    <AnimatePresence>
      {!acknowledged && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") acknowledge();
          }}
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            role="presentation"
            onClick={acknowledge}
            className="fixed inset-0 backdrop-blur-md bg-black/5"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.1 }}
            role="alertdialog"
            aria-modal
            aria-label="Beta notice"
            className={cn(
              "relative flex w-full max-w-sm flex-col gap-4 p-5",
              "rounded-2xl border border-zinc-200 bg-white shadow-md/3",
            )}
          >
            <div className="flex flex-col gap-1.5">
              <div className="mb-1 flex items-center gap-2">
                <LogoIcon className="size-5 text-zinc-900" />
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium tracking-tight text-zinc-600">
                  Beta
                </span>
              </div>
              <h2 className="text-base font-medium tracking-tight text-zinc-900">
                ResearchAI is in beta
              </h2>
              <div className="text-sm text-zinc-500">
                This project is under active development. Things may change or
                break at any time, and your data could be lost — please
                don&apos;t rely on it for important work yet.
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button size="sm" onClick={acknowledge} autoFocus>
                I understand
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BetaNoticeDialog;

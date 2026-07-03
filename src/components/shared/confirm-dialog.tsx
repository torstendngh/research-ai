"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import { Button } from "./button";
import LoadingIcon from "./icons/loading-icon";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Runs when confirmed. If it returns a promise, the button shows a spinner
   *  and the dialog closes on resolve (unless `busy` is controlled below). */
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** A destructive action (red button). Defaults to true. */
  destructive?: boolean;
  /** Controlled in-flight state. When provided, the parent owns busy/close. */
  busy?: boolean;
  /** Controlled error message shown above the actions. */
  error?: string | null;
}

/**
 * A small modal that asks the user to confirm a destructive or irreversible
 * action before it runs. Left uncontrolled it awaits `onConfirm`, shows a
 * spinner while it runs, and closes on success; pass `busy`/`error` to drive
 * those from the parent instead (e.g. flows that redirect on success).
 */
const ConfirmDialog = ({ open, ...rest }: ConfirmDialogProps) => (
  <AnimatePresence>{open && <ConfirmDialogBody {...rest} />}</AnimatePresence>
);

// The body only mounts while open, so its busy/error state starts fresh on
// every open without needing a reset effect.
const ConfirmDialogBody = ({
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  busy: controlledBusy,
  error: controlledError,
}: Omit<ConfirmDialogProps, "open">) => {
  const isControlled = controlledBusy !== undefined;
  const [internalBusy, setInternalBusy] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const busy = controlledBusy ?? internalBusy;
  const error = controlledError ?? internalError;

  const close = () => {
    if (busy) return;
    onClose();
  };

  const confirm = async () => {
    if (busy) return;
    if (isControlled) {
      onConfirm();
      return;
    }
    setInternalBusy(true);
    setInternalError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setInternalError(
        e instanceof Error ? e.message : "Something went wrong. Please try again.",
      );
      setInternalBusy(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        role="presentation"
        onClick={close}
        className="fixed inset-0 backdrop-blur-md bg-black/5"
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.1 }}
        role="alertdialog"
        aria-modal
        className={cn(
          "relative flex w-full max-w-sm flex-col gap-4 p-5",
          "rounded-2xl border border-zinc-200 bg-white shadow-md/3",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-medium tracking-tight text-zinc-900">
            {title}
          </h2>
          {description && (
            <div className="text-sm text-zinc-500">{description}</div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={confirm}
            disabled={busy}
            autoFocus
          >
            {busy && <LoadingIcon className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDialog;

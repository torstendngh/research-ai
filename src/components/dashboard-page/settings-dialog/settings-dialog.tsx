"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/tailwind-utils";
import IconButton from "@/components/shared/icon-button";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import AccountIcon from "@/components/shared/icons/account-icon";
import CloseIcon from "@/components/shared/icons/close-icon";
import StorageIcon from "@/components/shared/icons/storage-icon";
import UsageIcon from "@/components/shared/icons/usage-icon";
import { createClient } from "@/lib/supabase/client";
import {
  deleteAccount,
  getAccountOverview,
  type AccountOverview,
} from "@/lib/actions/account";
import AccountTab from "./account-tab";
import StorageTab from "./storage-tab";
import UsageTab from "./usage-tab";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "usage" | "storage" | "account";

const TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
  { id: "account", label: "Account", icon: <AccountIcon /> },
  { id: "usage", label: "Usage", icon: <UsageIcon /> },
  { id: "storage", label: "Storage", icon: <StorageIcon /> },
];

/**
 * Account settings, opened from the avatar in the navbar. A left tab rail
 * switches between Usage, Storage, and Account (sign out + delete account).
 * Everything is fetched fresh each time the dialog opens.
 */
const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [tab, setTab] = useState<SettingsTab>("account");
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getAccountOverview()
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const close = () => {
    if (isDeleting) return;
    setTab("account");
    setOverview(null);
    setLoadFailed(false);
    setConfirmingDelete(false);
    setDeleteError(null);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      // The auth user is gone; end the (now invalid) session and leave.
      await createClient().auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      setIsDeleting(false);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete the account.",
      );
    }
  };

  const usage = overview?.usage ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className={cn(
              "relative flex w-full max-w-2xl overflow-hidden",
              "h-[26rem] max-h-[85vh]",
              "rounded-2xl border border-zinc-200 bg-white shadow-md/3",
            )}
          >
            {/* Tab rail */}
            <aside className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-zinc-200 bg-zinc-50 p-2">
              <h2 className="px-2 py-1.5 text-sm font-medium tracking-tight">Settings</h2>
              {TABS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5",
                    "cursor-pointer select-none text-sm",
                    "[&_svg]:size-4.5 [&_svg]:shrink-0",
                    id === tab
                      ? "bg-zinc-200 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </aside>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-h-11 items-center gap-2 border-b border-zinc-200 px-3 py-1.5">
                <p className="flex-1 truncate px-1 text-sm font-medium text-zinc-800">
                  {TABS.find(({ id }) => id === tab)?.label}
                </p>
                <IconButton label="Close" onClick={close} disabled={isDeleting}>
                  <CloseIcon className="size-4" />
                </IconButton>
              </div>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
                {tab === "usage" && <UsageTab usage={usage} loadFailed={loadFailed} />}

                {tab === "storage" && <StorageTab usage={usage} loadFailed={loadFailed} />}

                {tab === "account" && (
                  <AccountTab
                    overview={overview}
                    onRequestDelete={() => setConfirmingDelete(true)}
                  />
                )}
              </div>
            </div>
          </motion.div>

          <ConfirmDialog
            open={confirmingDelete}
            onClose={() => setConfirmingDelete(false)}
            onConfirm={handleDeleteAccount}
            busy={isDeleting}
            error={deleteError}
            title="Delete account?"
            description="This permanently deletes your account and all projects, sources, chats and podcasts. This cannot be undone."
            confirmLabel="Delete permanently"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsDialog;

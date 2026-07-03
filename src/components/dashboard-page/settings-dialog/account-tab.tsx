import Image from "next/image";
import { Button } from "@/components/shared/button";
import logout from "@/lib/supabase/logout";
import type { AccountOverview } from "@/lib/actions/account";

/**
 * Profile info, sign out, and the delete-account danger zone. The delete
 * confirmation itself is a ConfirmDialog rendered by the settings dialog.
 */
const AccountTab = ({
  overview,
  onRequestDelete,
}: {
  overview: AccountOverview | null;
  onRequestDelete: () => void;
}) => (
  <>
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
        {overview?.avatarUrl && (
          <Image
            src={overview.avatarUrl}
            alt="User avatar"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-zinc-800">
          {overview?.name ?? "—"}
        </span>
        <span className="truncate text-xs text-zinc-500">
          {overview?.email ?? ""}
        </span>
      </div>
    </div>

    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-zinc-700">Sign out of this device</span>
      <Button variant="outline" size="sm" onClick={() => logout()}>
        Log out
      </Button>
    </div>

    <div className="mt-auto flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Danger zone
      </h3>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-zinc-700">
          Delete your account and all data
        </span>
        <Button
          variant="destructive-outline"
          size="sm"
          onClick={onRequestDelete}
        >
          Delete account
        </Button>
      </div>
    </div>
  </>
);

export default AccountTab;

"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/tailwind-utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import Button from "./button";
import SettingsDialog from "../settings-dialog";

const Avatar = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      setUsername(
        user?.user_metadata?.full_name ??
          user?.user_metadata?.name ??
          user?.email ??
          null,
      );
    });
  }, []);

  return (
    <>
      <Button
        className="flex-1 min-w-0"
        label={username}
        onClick={() => setIsSettingsOpen(true)}
        icon={
          <div
            className={cn(
              "flex items-center justify-center overflow-hidden",
              "h-5 w-5 rounded-full shrink-0",
              "bg-zinc-200",
            )}
          >
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt="User avatar"
                width={20}
                height={20}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        }
      />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Avatar;

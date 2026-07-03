"use client";

import { useState } from "react";
import { cn } from "@/lib/tailwind-utils";
import SourcesIcon from "@/components/shared/icons/sources-icon";
import { hostnameOf } from "./source-utils";

/** Favicon for web sources; PDFs and unparseable URLs fall back to the generic icon. */
const SourceFavicon = ({ url, className }: { url: string | null | undefined; className?: string }) => {
  const [failed, setFailed] = useState(false);
  const host = hostnameOf(url);

  if (!host || failed) {
    return <SourcesIcon className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny external favicon, not worth the image pipeline
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      onError={() => setFailed(true)}
      className={cn(className, "rounded-sm")}
    />
  );
};

export default SourceFavicon;

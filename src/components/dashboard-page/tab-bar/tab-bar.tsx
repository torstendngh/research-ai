"use client";

import { cn } from "@/lib/tailwind-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shared/tooltip";
import tabs from "./tabs";
import { useDashboard } from "../dashboard-context";

/** Main view switcher: Sources / Chat / Mind Map / Options. */
const TabBar = () => {
  const { mainTab, setMainTab, sources } = useDashboard();
  const hasSources = sources.length > 0;

  return (
    // Padding + matching negative margin on the same element that scrolls:
    // `overflow-x-auto` forces the browser to clip overflow-y too, so without
    // this the active tab's shadow gets cut off top and bottom. Padding is
    // inside the clip box, so the shadow now has room to render.
    <div className={cn("flex overflow-x-auto py-1.5 -my-1.5", "gap-1")}>
      {tabs.map((tab) => {
        const active = mainTab === tab.id;
        const disabled = tab.id !== "sources" && !hasSources;

        const button = (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (!disabled) setMainTab(tab.id);
            }}
            aria-disabled={disabled}
            className={cn(
              "flex items-center shrink-0",
              "px-2.5 py-1 gap-1.5 rounded-md",
              "cursor-pointer select-none not-hover:transition-colors duration-100",
              "[&>svg]:size-4.5",
              disabled && "cursor-not-allowed opacity-45",
              active
                ? "bg-white text-zinc-900 border border-zinc-200 shadow-md/3"
                : disabled
                  ? "text-zinc-400 border border-transparent"
                  : "text-zinc-500 border border-transparent hover:bg-zinc-200 active:bg-zinc-200",
            )}
          >
            {tab.icon}
            <span className="text-sm">{tab.title}</span>
          </button>
        );

        return (
          <div key={tab.id} className="flex items-center gap-1">
            {tab.id === "overview" && (
              <div className="mx-1 h-5 w-px shrink-0 bg-zinc-200" />
            )}
            {disabled ? (
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="bottom">
                  Add sources to this project first.
                </TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabBar;

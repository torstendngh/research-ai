"use client";

import ArrowUpIcon from "@/components/shared/icons/arrow-up-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shared/tooltip";
import { cn } from "@/lib/tailwind-utils";
import { useEffect, useRef } from "react";
import { useDashboard } from "../dashboard-context";
import PromptContextChips from "../prompt-context-chips";
import { buildChatPrompt } from "../prompt-context-format";
import SendButton from "../send-button";

const Prompt = () => {
  const { sendMessage, project, isResponding, chatPrompt } = useDashboard();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The textarea stays enabled while a reply streams in, so the user can keep
  // typing the next question without losing focus; only submitting is blocked.
  const disabled = !project;
  const hasPrompt =
    chatPrompt.draft.trim().length > 0 || chatPrompt.chips.length > 0;
  const canSubmit = !disabled && !isResponding && hasPrompt;

  // Focus and move the caret to the end whenever the prompt is filled elsewhere
  // (e.g. an "ask the chat" button on a mind-map node).
  useEffect(() => {
    if (chatPrompt.focusNonce === 0) return;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    const end = element.value.length;
    element.setSelectionRange(end, end);
  }, [chatPrompt.focusNonce]);

  const submit = () => {
    if (!canSubmit) return;
    const content = buildChatPrompt(chatPrompt.draft, chatPrompt.chips);
    chatPrompt.setDraft("");
    chatPrompt.clearChips();
    sendMessage(content);
    // Clicking the send button moves focus to it; bring it back to the input
    // so the next question can be typed right away.
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="p-4 flex flex-col">
      <div
        className={cn(
          "flex max-w-3xl w-full mx-auto flex-col gap-1.5",
          "rounded-3xl border border-zinc-200 bg-white shadow-md/3",
          "p-1.5 pl-3.5",
          "transition-colors",
          disabled && "opacity-60",
        )}
      >
        <PromptContextChips
          chips={chatPrompt.chips}
          onRemove={chatPrompt.removeChip}
          className="pr-10 pt-1"
        />
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={chatPrompt.draft}
            onChange={(e) => chatPrompt.setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              project
                ? chatPrompt.chips.length > 0
                  ? "Add instructions..."
                  : "Start chat"
                : "Select a project to start"
            }
            className={cn(
              "field-sizing-content resize-none",
              "flex-1 min-w-0 self-center py-1.5",
              "min-h-8 max-h-40",
              "bg-transparent text-sm",
              "focus:outline-0 placeholder:text-zinc-400",
            )}
          ></textarea>
          <Tooltip>
            <TooltipTrigger asChild>
              <SendButton onClick={submit} disabled={!canSubmit} label="Send">
                <ArrowUpIcon className="size-5" />
              </SendButton>
            </TooltipTrigger>
            <TooltipContent side="top">Send</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Prompt;

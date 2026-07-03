"use client";

import IconButton from "@/components/shared/icon-button";
import CloseIcon from "@/components/shared/icons/close-icon";
import Window from "../window";
import InstructionsSection from "./instructions-section";
import ResponseLengthSection from "./response-length-section";

/** Settings that shape the AI's answers: response length + custom instructions. */
const ChatOptionsPanel = ({ onMinimize }: { onMinimize: () => void }) => (
  <Window
    title="Chat options"
    actions={
      <IconButton label="Close chat options" onClick={onMinimize}>
        <CloseIcon className="size-4.5" />
      </IconButton>
    }
  >
    <div className="flex flex-col gap-6 overflow-y-auto p-3">
      <ResponseLengthSection />
      <InstructionsSection />
    </div>
  </Window>
);

export default ChatOptionsPanel;

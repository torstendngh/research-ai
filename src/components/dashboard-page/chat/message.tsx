import { cn } from "@/lib/tailwind-utils";
import Markdown from "@/components/shared/markdown";
import type { ChatMessage } from "@/lib/actions/chats";

/** A single chat turn: user messages as a bubble, assistant replies as markdown + citations. */
const Message = ({ message }: { message: ChatMessage }) => {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[80%] whitespace-pre-wrap",
            "rounded-3xl px-4 py-2",
            "bg-zinc-100",
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Markdown>{message.content}</Markdown>
      {message.citations && message.citations.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">Sources</span>
          <ul className="flex flex-col gap-1">
            {message.citations.map((citation) => (
              <li key={citation.marker} className="text-sm text-zinc-500">
                <span className="text-zinc-400">[{citation.marker}]</span>{" "}
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                  >
                    {citation.title}
                  </a>
                ) : (
                  <span className="text-zinc-700">
                    {citation.title}
                    {citation.fileName ? ` (${citation.fileName})` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Message;

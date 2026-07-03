"use client";

import { cn } from "@/lib/tailwind-utils";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Textarea } from "@/components/shared/textarea";

interface TextFormProps {
  title: string;
  body: string;
  /** Submit button label — "Add to batch" for new text, "Save changes" when editing. */
  submitLabel?: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  className?: string;
}

/** "Write or paste text" form of the add-source dialog. */
const TextForm = ({
  title,
  body,
  submitLabel = "Add to batch",
  onTitleChange,
  onBodyChange,
  onSubmit,
  className,
}: TextFormProps) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Textarea
        placeholder="Paste or write your text here…"
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        // The shared Textarea auto-grows with content (field-sizing-content);
        // cap it so the floating panel never outgrows the dialog.
        className="min-h-32 max-h-52 resize-none overflow-y-auto"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onSubmit}
          disabled={body.trim().length === 0}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default TextForm;

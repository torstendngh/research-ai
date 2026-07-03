"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/button";
import { Textarea } from "@/components/shared/textarea";
import LoadingIcon from "@/components/shared/icons/loading-icon";
import { getInstructions, saveInstructions } from "@/lib/actions/settings";
import SectionHeader from "./section-header";

/** Account-wide custom instructions sent to the AI with every question. */
const InstructionsSection = () => {
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getInstructions()
      .then((text) => {
        if (!active) return;
        setValue(text);
        setSaved(text);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dirty = value !== saved;

  const handleSave = async () => {
    if (isSaving || !dirty) return;
    setIsSaving(true);
    try {
      await saveInstructions(value);
      setSaved(value);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Custom instructions"
        hint="Saved to your account and sent to the AI with every question."
      />
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          rows={6}
          placeholder={
            loading
              ? ""
              : "e.g. Answer concisely, prefer bullet points, and define any technical terms you use."
          }
          className="resize-none disabled:opacity-60"
        />
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <LoadingIcon className="size-5 animate-spin text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-3">
        {!loading && !dirty && <span className="text-xs text-zinc-400">Saved</span>}
        <Button size="sm" onClick={handleSave} disabled={loading || isSaving || !dirty}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default InstructionsSection;

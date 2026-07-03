"use client";

import { useRef } from "react";
import { cn } from "@/lib/tailwind-utils";
import UploadIcon from "@/components/shared/icons/upload-icon";

interface PdfDropzoneProps {
  /** Highlighted while files are dragged over the dialog. */
  isDraggingOver: boolean;
  onFiles: (files: FileList) => void;
}

/** Click-or-drop target for staging PDF files in the add-source dialog. */
const PdfDropzone = ({ isDraggingOver, onFiles }: PdfDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group flex flex-col items-center justify-center gap-2 py-6",
          "rounded-xl border border-dashed",
          "cursor-pointer select-none transition-colors",
          isDraggingOver
            ? "border-zinc-500 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50",
        )}
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            "bg-zinc-100 text-zinc-500 transition-colors",
            "group-hover:bg-zinc-200 group-hover:text-zinc-700",
            isDraggingOver && "bg-zinc-200 text-zinc-700",
          )}
        >
          <UploadIcon className="size-5" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-zinc-700">
            {isDraggingOver ? "Drop PDFs to stage them" : "Upload PDFs"}
          </span>
          <span className="text-xs text-zinc-400">
            Drag and drop or click to browse
          </span>
        </div>
      </button>
    </>
  );
};

export default PdfDropzone;

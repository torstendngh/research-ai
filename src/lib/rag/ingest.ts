"use server";

import { supabase } from "./config";
import { createChildChunks, createParentChunks } from "./chunking";
import { extractPdfSource, extractTextSource, extractUrlSource } from "./extract";
import { embedTexts, summarizeParentChunk } from "./openai";
import type { IngestSourceInput, IngestSourceResult } from "./types";

export async function ingestSource(input: IngestSourceInput): Promise<IngestSourceResult> {
    const extracted = input.type === "pdf"
        ? await extractPdfSource(input)
        : input.type === "text"
            ? extractTextSource(input)
            : await extractUrlSource(input);

    // Counted against the owner's storage cap: the raw file size for PDFs, the
    // extracted text size otherwise (the closest thing to what we actually keep).
    const byteSize = input.type === "pdf"
        ? input.fileBuffer.byteLength
        : extracted.blocks.reduce((sum, block) => sum + block.text.length, 0);

    let existingQuery = supabase
        .from("rag_sources")
        .select("id")
        .eq("content_hash", extracted.contentHash)
        .limit(1);

    existingQuery = input.ownerId
        ? existingQuery.eq("owner_id", input.ownerId)
        : existingQuery.is("owner_id", null);

    existingQuery = input.projectId
        ? existingQuery.eq("project_id", input.projectId)
        : existingQuery.is("project_id", null);

    const { data: existingSource, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) throw existingError;

    if (existingSource?.id && !input.forceReindex) {
        const { count: parentCount } = await supabase
            .from("rag_parent_chunks")
            .select("id", { count: "exact", head: true })
            .eq("source_id", existingSource.id);

        const { count: childCount } = await supabase
            .from("rag_child_chunks")
            .select("id", { count: "exact", head: true })
            .eq("source_id", existingSource.id);

        return {
            sourceId: existingSource.id,
            reusedExisting: true,
            parentChunkCount: parentCount ?? 0,
            childChunkCount: childCount ?? 0,
        };
    }

    if (existingSource?.id && input.forceReindex) {
        const { error: deleteError } = await supabase
            .from("rag_sources")
            .delete()
            .eq("id", existingSource.id);

        if (deleteError) throw deleteError;
    }

    const { data: source, error: sourceError } = await supabase
        .from("rag_sources")
        .insert({
            owner_id: input.ownerId ?? null,
            project_id: input.projectId ?? null,
            source_type: extracted.sourceType,
            title: extracted.title,
            url: extracted.url ?? null,
            canonical_url: extracted.canonicalUrl ?? null,
            file_name: extracted.fileName ?? null,
            content_hash: extracted.contentHash,
            byte_size: byteSize,
            status: "processing",
        })
        .select("id")
        .single();

    if (sourceError) throw sourceError;

    let parentChunkCount = 0;
    let childChunkCount = 0;

    try {
        const parentDrafts = createParentChunks(extracted.title, extracted.blocks);

        for (const parentDraft of parentDrafts) {
            const summary = input.generateSummaries === false
                ? null
                : await summarizeParentChunk(parentDraft);

            const { data: parent, error: parentError } = await supabase
                .from("rag_parent_chunks")
                .insert({
                    source_id: source.id,
                    title: parentDraft.title,
                    heading_path: parentDraft.headingPath,
                    content: parentDraft.content,
                    summary,
                    page_start: parentDraft.pageStart,
                    page_end: parentDraft.pageEnd,
                    token_count: parentDraft.tokenCount,
                })
                .select("id")
                .single();

            if (parentError) throw parentError;

            parentChunkCount += 1;

            const childDrafts = createChildChunks(parentDraft, summary);
            const childInsertRows = [];

            for (let i = 0; i < childDrafts.length; i += 64) {
                const batch = childDrafts.slice(i, i + 64);
                const embeddings = await embedTexts(batch.map((child) => child.searchableText));

                for (let j = 0; j < batch.length; j += 1) {
                    const child = batch[j];

                    childInsertRows.push({
                        source_id: source.id,
                        parent_id: parent.id,
                        content: child.content,
                        searchable_text: child.searchableText,
                        heading_path: child.headingPath,
                        page_start: child.pageStart,
                        page_end: child.pageEnd,
                        chunk_index: child.chunkIndex,
                        token_count: child.tokenCount,
                        embedding: embeddings[j],
                    });
                }
            }

            if (childInsertRows.length > 0) {
                const { error: childError } = await supabase
                    .from("rag_child_chunks")
                    .insert(childInsertRows);

                if (childError) throw childError;
            }

            childChunkCount += childDrafts.length;
        }

        const { error: readyError } = await supabase
            .from("rag_sources")
            .update({
                status: "ready",
                processed_at: new Date().toISOString(),
            })
            .eq("id", source.id);

        if (readyError) throw readyError;

        return {
            sourceId: source.id,
            reusedExisting: false,
            parentChunkCount,
            childChunkCount,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown ingestion error.";

        await supabase
            .from("rag_sources")
            .update({
                status: "failed",
                error_message: message,
            })
            .eq("id", source.id);

        throw error;
    }
}

-- Allow user-pasted text as a source type alongside PDFs and URLs.
alter table rag_sources
    drop constraint rag_sources_source_type_check;

alter table rag_sources
    add constraint rag_sources_source_type_check
    check (source_type in ('pdf', 'url', 'text'));

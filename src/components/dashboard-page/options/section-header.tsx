const SectionHeader = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="flex flex-col gap-0.5">
    <h3 className="text-sm font-medium text-zinc-800">{title}</h3>
    {hint && <p className="text-xs text-zinc-500">{hint}</p>}
  </div>
);

export default SectionHeader;

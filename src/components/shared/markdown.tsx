import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/tailwind-utils";

const components: Components = {
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 first:mt-0 text-xl font-medium tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 first:mt-0 text-lg font-medium tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 first:mt-0 text-base font-medium">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="my-3 first:mt-0 last:mb-0 list-disc pl-5 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 first:mt-0 last:mb-0 list-decimal pl-5 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-zinc-200 pl-3 text-zinc-500">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-zinc-200" />,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={cn("block font-mono text-sm", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-200 px-3 py-1.5 align-top">{children}</td>
  ),
};

interface MarkdownProps {
  children: string;
  className?: string;
}

const Markdown = ({ children, className }: MarkdownProps) => {
  return (
    <div className={cn("text-zinc-800", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

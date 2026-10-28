import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Terminal-themed renderers for article markdown.
const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-green font-bold text-lg mt-10 mb-3">
      <span className="text-green-dim select-none">## </span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-amber font-bold mt-8 mb-2">
      <span className="text-gray select-none">### </span>
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="text-blue underline decoration-border underline-offset-4 hover:text-green transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-4 space-y-1.5 pl-6 [&>li]:relative [&>li]:before:absolute [&>li]:before:-left-6 [&>li]:before:text-green-dim [&>li]:before:content-['->']">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 space-y-1.5 list-decimal pl-6 marker:text-green-dim">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="text-amber font-bold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-gray-light">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-green-dark pl-4 text-gray-light italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="bg-surface-light px-1.5 py-0.5 text-cyan text-[0.9em]">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto border border-border bg-background p-4 text-sm leading-relaxed text-foreground">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-green-dark px-3 py-2 text-left text-amber">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2 align-top">{children}</td>
  ),
};

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

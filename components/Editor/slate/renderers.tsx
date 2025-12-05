import React from "react";
import type { RenderElementProps, RenderLeafProps } from "slate-react";

export function renderElement(props: RenderElementProps) {
  const { attributes, children, element } = props;
  switch ((element as any).type) {
    case "paragraph":
      return <p {...attributes}>{children}</p>;
    case "heading-one":
      return (
        <h1 className="text-2xl font-bold" {...attributes}>
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 className="text-xl font-semibold" {...attributes}>
          {children}
        </h2>
      );
    case "bulleted-list":
      return (
        <ul className="list-disc space-y-1 pl-6 leading-relaxed" {...attributes}>
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol
          className="list-decimal space-y-1 pl-6 leading-relaxed"
          {...attributes}
        >
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li className="ml-0 pl-0" {...attributes}>
          {children}
        </li>
      );
    case "block-quote":
      return (
        <blockquote
          className="border-muted text-muted-foreground border-l-4 pl-3 italic"
          {...attributes}
        >
          {children}
        </blockquote>
      );
    case "code-block":
      return (
        <pre
          className="bg-muted rounded px-3 py-2 font-mono text-sm"
          {...attributes}
        >
          <code>{children}</code>
        </pre>
      );
    default:
      return <div {...attributes}>{children}</div>;
  }
}

export function renderLeaf(props: RenderLeafProps) {
  const { attributes, children, leaf } = props as any;
  let el = children;
  if (leaf.bold) el = <strong>{el}</strong>;
  if (leaf.italic) el = <em>{el}</em>;
  if (leaf.underline) el = <u>{el}</u>;
  if (leaf.code)
    el = (
      <code className="bg-muted rounded px-1 py-0.5 font-mono text-[90%]">
        {el}
      </code>
    );
  return <span {...attributes}>{el}</span>;
}

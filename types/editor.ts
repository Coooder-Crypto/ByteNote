import type { Descendant } from "slate";

import type { JsonValue } from "./json";

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

export type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

export type HeadingOneElement = {
  type: "heading-one";
  children: CustomText[];
};

export type HeadingTwoElement = {
  type: "heading-two";
  children: CustomText[];
};

export type BlockQuoteElement = {
  type: "block-quote";
  children: CustomText[];
};

export type CodeBlockElement = {
  type: "code-block";
  children: CustomText[];
};

export type ListItemElement = {
  type: "list-item";
  children: CustomText[];
};

export type BulletedListElement = {
  type: "bulleted-list";
  children: ListItemElement[];
};

export type NumberedListElement = {
  type: "numbered-list";
  children: ListItemElement[];
};

export type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BlockQuoteElement
  | CodeBlockElement
  | ListItemElement
  | BulletedListElement
  | NumberedListElement;

export type EditorContent = Descendant[];

export type AiMeta = Record<string, JsonValue>;

export type ContentJson = Descendant[];

declare module "slate" {
  interface CustomTypes {
    Editor: import("slate").BaseEditor &
      import("slate-react").ReactEditor &
      import("slate-history").HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

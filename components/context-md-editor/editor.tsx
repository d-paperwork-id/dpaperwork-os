"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, BubbleMenu, ReactRenderer } from "@tiptap/react";
import type { Editor, Range } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { Command } from "novel";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import {
  Bold, Italic, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Slash command items ────────────────────────────────────────────

interface SlashItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  searchTerms: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

const ALL_ITEMS: SlashItem[] = [
  {
    title: "Heading 1", description: "Large section heading",
    icon: <Heading1 className="size-4" />, searchTerms: ["h1", "heading"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2", description: "Medium section heading",
    icon: <Heading2 className="size-4" />, searchTerms: ["h2", "heading"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 3", description: "Small section heading",
    icon: <Heading3 className="size-4" />, searchTerms: ["h3", "heading"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Bullet List", description: "Unordered list",
    icon: <List className="size-4" />, searchTerms: ["ul", "list", "bullet"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List", description: "Ordered list",
    icon: <ListOrdered className="size-4" />, searchTerms: ["ol", "list", "ordered"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Code Block", description: "Monospace code block",
    icon: <Braces className="size-4" />, searchTerms: ["code", "pre", "codeblock"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

// ── Slash command popup component ─────────────────────────────────

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setSelected(0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="z-50 w-64 rounded-md border border-border bg-popover p-1 shadow-md">
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          onClick={() => command(item)}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent",
            i === selected && "bg-accent"
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded border border-border bg-background">
            {item.icon}
          </span>
          <span>
            <p className="font-medium leading-none">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
          </span>
        </button>
      ))}
    </div>
  );
});
SlashMenu.displayName = "SlashMenu";

// ── Slash command Tiptap extension ────────────────────────────────

const slashCommand = Command.configure({
  suggestion: {
    items: ({ query }: { query: string }) => {
      const q = query.toLowerCase();
      return ALL_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.searchTerms.some((t) => t.includes(q))
      );
    },
    render: () => {
      let renderer: ReactRenderer<SlashMenuHandle, SlashMenuProps>;
      let popup: TippyInstance[];

      return {
        onStart(props: { editor: Editor; clientRect?: (() => DOMRect | null) | null; items: SlashItem[]; command: (item: SlashItem) => void }) {
          renderer = new ReactRenderer(SlashMenu, {
            props: {
              items: props.items,
              command: (item: SlashItem) => props.command(item),
            },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: renderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate(props: { editor: Editor; clientRect?: (() => DOMRect | null) | null; items: SlashItem[]; command: (item: SlashItem) => void }) {
          renderer.updateProps({
            items: props.items,
            command: (item: SlashItem) => props.command(item),
          });
          if (props.clientRect) {
            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }
        },
        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }
          return renderer.ref?.onKeyDown(props.event) ?? false;
        },
        onExit() {
          popup?.[0]?.destroy();
          renderer.destroy();
        },
      };
    },
    command: ({
      editor,
      range,
      props,
    }: {
      editor: Editor;
      range: Range;
      props: SlashItem;
    }) => {
      props.command({ editor, range });
    },
  },
});

// ── Extensions ────────────────────────────────────────────────────

const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  Markdown.configure({ html: false, transformPastedText: true }),
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "heading"
        ? "Heading…"
        : "Type '/' for commands, or start describing your business…",
    includeChildren: true,
  }),
  slashCommand,
];

// ── Main editor component ─────────────────────────────────────────

interface ContextEditorProps {
  defaultValue: string;
  onChange: (markdown: string) => void;
  className?: string;
}

export function ContextEditor({ defaultValue, onChange, className }: ContextEditorProps) {
  const hydrated = useRef(false);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "context-prose focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      const md =
        (editor.storage.markdown as { getMarkdown?: () => string })?.getMarkdown?.() ?? "";
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor || hydrated.current) return;
    editor.commands.setContent(defaultValue ?? "");
    hydrated.current = true;
  }, [editor, defaultValue]);

  return (
    <div
      className={cn(
        "relative h-[480px] w-full overflow-y-auto rounded-md border border-input bg-background px-4 py-3 text-sm cursor-text",
        className
      )}
      onClick={() => editor?.chain().focus().run()}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ from, to }) => from !== to}
        >
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md">
            {[
              { icon: <Bold className="size-3.5" />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
              { icon: <Italic className="size-3.5" />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
              { icon: <Strikethrough className="size-3.5" />, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
              { icon: <Code className="size-3.5" />, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code") },
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={btn.action}
                className={cn("rounded p-1.5 hover:bg-accent", btn.active && "bg-accent")}
              >
                {btn.icon}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-border" />
            {[
              { icon: <Heading1 className="size-3.5" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
              { icon: <Heading2 className="size-3.5" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
              { icon: <List className="size-3.5" />, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
              { icon: <ListOrdered className="size-3.5" />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={btn.action}
                className={cn("rounded p-1.5 hover:bg-accent", btn.active && "bg-accent")}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

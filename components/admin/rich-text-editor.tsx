"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

function normalizeEditorContent(content: string) {
  if (!content.trim()) {
    return "<p>Write the next spicy classic here.</p>";
  }

  if (content.includes("<")) {
    return content;
  }

  return content
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function RichTextEditor({
  content = "<p>Write the next spicy classic here.</p>",
  name,
  label
}: {
  content?: string;
  name?: string;
  label?: string;
}) {
  const initialContent = normalizeEditorContent(content);
  const [html, setHtml] = useState(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Placeholder.configure({
        placeholder: "Draft copy, affiliate disclosure, and editorial notes..."
      })
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    }
  });

  useEffect(() => {
    const nextContent = normalizeEditorContent(content);
    setHtml(nextContent);

    if (editor && editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [content, editor]);

  return (
    <div className="panel-light p-5">
      <div className="mb-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-charcoal/50">
        <span>Rich editor</span>
        <span>Supabase uploads ready for integration</span>
      </div>
      {label ? <p className="mb-3 text-sm font-medium text-charcoal/75">{label}</p> : null}
      {name ? <input type="hidden" name={name} value={html} /> : null}
      <EditorContent
        editor={editor}
        className="prose max-w-none rounded-[1.5rem] border border-charcoal/10 px-5 py-5 prose-headings:font-display prose-p:text-charcoal/80"
      />
    </div>
  );
}

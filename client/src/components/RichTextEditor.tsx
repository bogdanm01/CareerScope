import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@heroui/react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import TurndownService from 'turndown';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const toolbarItems = [
  {
    label: 'H1',
    iconLabel: 'H1',
    action: 'heading1',
  },
  {
    label: 'H2',
    iconLabel: 'H2',
    action: 'heading2',
  },
  {
    label: 'H3',
    iconLabel: 'H3',
    action: 'heading3',
  },
  {
    label: 'Bold',
    Icon: Bold,
    action: 'bold',
  },
  {
    label: 'Italic',
    Icon: Italic,
    action: 'italic',
  },
  {
    label: 'Bullet list',
    Icon: List,
    action: 'bulletList',
  },
  {
    label: 'Ordered list',
    Icon: ListOrdered,
    action: 'orderedList',
  },
] as const;

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const inlineMarkdownToHtml = (text: string) =>
  escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

const markdownToEditorHtml = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (isHtml(trimmedValue)) {
    return trimmedValue;
  }

  const lines = trimmedValue.split(/\r?\n/);
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (!listType) {
      return;
    }

    html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      html.push(`<h${headingMatch[1].length}>${inlineMarkdownToHtml(headingMatch[2])}</h${headingMatch[1].length}>`);
      continue;
    }

    const unorderedListMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedListMatch) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inlineMarkdownToHtml(unorderedListMatch[1])}</li>`);
      continue;
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inlineMarkdownToHtml(orderedListMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  }

  closeList();
  return html.join('');
};

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const lastEmittedValueRef = useRef(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    content: markdownToEditorHtml(value),
    editorProps: {
      attributes: {
        class: 'rich-text-editor__content',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const nextValue = html === '<p></p>' ? '' : turndownService.turndown(html).trim();
      lastEmittedValueRef.current = nextValue;
      onChange(nextValue);
    },
  });

  useEffect(() => {
    if (!editor || value === lastEmittedValueRef.current) {
      return;
    }

    editor.commands.setContent(markdownToEditorHtml(value), { emitUpdate: false });
    lastEmittedValueRef.current = value;
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const runAction = (action: (typeof toolbarItems)[number]['action']) => {
    const chain = editor.chain().focus();

    if (action === 'bold') {
      chain.toggleBold().run();
      return;
    }

    if (action === 'italic') {
      chain.toggleItalic().run();
      return;
    }

    if (action === 'heading1') {
      chain.toggleHeading({ level: 1 }).run();
      return;
    }

    if (action === 'heading2') {
      chain.toggleHeading({ level: 2 }).run();
      return;
    }

    if (action === 'heading3') {
      chain.toggleHeading({ level: 3 }).run();
      return;
    }

    if (action === 'bulletList') {
      chain.toggleBulletList().run();
      return;
    }

    chain.toggleOrderedList().run();
  };

  const isActive = (action: (typeof toolbarItems)[number]['action']) => {
    if (action === 'heading1') {
      return editor.isActive('heading', { level: 1 });
    }

    if (action === 'heading2') {
      return editor.isActive('heading', { level: 2 });
    }

    if (action === 'heading3') {
      return editor.isActive('heading', { level: 3 });
    }

    if (action === 'bulletList') {
      return editor.isActive('bulletList');
    }

    if (action === 'orderedList') {
      return editor.isActive('orderedList');
    }

    return editor.isActive(action);
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar">
        {toolbarItems.map((item) => (
          <Button
            key={item.action}
            type="button"
            size="sm"
            variant={isActive(item.action) ? 'primary' : 'outline'}
            className="h-8 min-w-8 rounded-lg px-2 text-xs"
            aria-label={item.label}
            onPress={() => runAction(item.action)}
          >
            {'Icon' in item ? <item.Icon size={16} strokeWidth={2} /> : item.iconLabel}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

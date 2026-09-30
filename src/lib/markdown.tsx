import type { ReactElement } from 'react';

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderInline = (text: string): string => {
  text = escapeHtml(text);
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Links — only http(s), mailto and site-relative URLs
  text = text.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^)\s]+)\)/g,
    (_, label: string, href: string) =>
      href.startsWith('/')
        ? `<a href="${href}">${label}</a>`
        : `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  return text;
};

// Very simple markdown-ish rendering
export function renderMarkdown(body: string): ReactElement[] {
  const lines = body.split('\n');
  const elements: ReactElement[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      if (text.trim()) {
        elements.push(
          <p key={elements.length} dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <Tag key={elements.length}>
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={elements.length}>
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push(<h2 key={elements.length}>{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push(<h3 key={elements.length}>{line.slice(4)}</h3>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      elements.push(
        <blockquote key={elements.length} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
      );
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      flushParagraph();
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.replace(/^[-*] /, ''));
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      flushParagraph();
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\. /, ''));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Regular text
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();

  return elements;
}

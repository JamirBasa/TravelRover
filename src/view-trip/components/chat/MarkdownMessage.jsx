import React from 'react';

/**
 * MarkdownMessage Component
 * Renders chat messages with proper markdown formatting
 * Supports: **bold**, bullet lists, emojis, line breaks
 * 
 * Design: Clean, minimal styling that matches TripChatbot aesthetic
 */
function MarkdownMessage({ content }) {
  // Split content into lines for processing
  const lines = content.split('\n');
  const elements = [];
  let currentParagraph = [];
  let inList = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push({
        type: 'paragraph',
        content: currentParagraph.join('\n'),
        key: `p-${elements.length}`
      });
      currentParagraph = [];
    }
  };

  // Common emojis used in travel chat (check for any emoji at start of line)
  const startsWithEmoji = (text) => {
    // Check if line starts with any emoji character
    return /^[\u{1F300}-\u{1F9FF}]/u.test(text);
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    // Empty line - flush current paragraph
    if (!trimmedLine) {
      flushParagraph();
      if (inList) {
        inList = false;
      }
      return;
    }

    // Bullet point (•, -, *)
    if (/^[•\-*]\s+/.test(trimmedLine)) {
      flushParagraph();
      inList = true;
      elements.push({
        type: 'list-item',
        content: trimmedLine.replace(/^[•\-*]\s+/, ''),
        key: `li-${elements.length}`
      });
      return;
    }

    // Section header (starts with emoji or **text**)
    if (startsWithEmoji(trimmedLine) || /^\*\*[^*]+\*\*/.test(trimmedLine)) {
      flushParagraph();
      inList = false;
      elements.push({
        type: 'header',
        content: trimmedLine,
        key: `h-${elements.length}`
      });
      return;
    }

    // Regular text - add to current paragraph
    if (!inList) {
      currentParagraph.push(line);
    } else {
      // Text after list without blank line - treat as continuation
      currentParagraph.push(line);
    }
  });

  // Flush any remaining paragraph
  flushParagraph();

  /**
   * Format inline markdown: **bold**
   */
  const formatInlineMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-3">
      {elements.map((element) => {
        switch (element.type) {
          case 'header':
            return (
              <div key={element.key} className="font-semibold text-base leading-relaxed">
                {formatInlineMarkdown(element.content)}
              </div>
            );
          
          case 'list-item':
            return (
              <div key={element.key} className="flex gap-2 leading-relaxed">
                <span className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5">•</span>
                <span className="flex-1">{formatInlineMarkdown(element.content)}</span>
              </div>
            );
          
          case 'paragraph':
            return (
              <p key={element.key} className="leading-relaxed">
                {formatInlineMarkdown(element.content)}
              </p>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
}

export default MarkdownMessage;

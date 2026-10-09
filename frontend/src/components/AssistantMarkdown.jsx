import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AssistantMarkdown({ children }) {
  return <div className="assistant-markdown"><ReactMarkdown
    remarkPlugins={[remarkGfm]}
    skipHtml
    components={{
      a: ({ href, children }) => href ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
      // Replies contain guidance, not remotely loaded images.
      img: ({ alt }) => <span>{alt}</span>,
      table: ({ children }) => <div className="assistant-table"><table>{children}</table></div>,
    }}
  >{typeof children === 'string' ? children : ''}</ReactMarkdown></div>;
}

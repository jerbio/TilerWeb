import React from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';

const MarkdownContainer = styled.div`
  font-family: inherit;
  line-height: 1.5;

  // Headers
  h1, h2, h3, h4, h5, h6 {
    margin: 0.5em 0 0.3em 0;
    font-weight: 600;
    line-height: 1.3;
  }

  h1 { font-size: 1.4em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }
  h4 { font-size: 1.1em; }
  h5 { font-size: 1em; }
  h6 { font-size: 0.9em; }

  // Paragraphs
  p {
    margin: 0.5em 0;
    &:first-child { margin-top: 0; }
    &:last-child { margin-bottom: 0; }
  }

  // Lists
  ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
    &:first-child { margin-top: 0; }
    &:last-child { margin-bottom: 0; }
  }

  li {
    margin: 0.2em 0;
  }

  // Code
  code {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    padding: 0.1em 0.3em;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
    padding: 1em;
    margin: 0.5em 0;
    overflow-x: auto;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  // Blockquotes
  blockquote {
    border-left: 3px solid rgba(255, 255, 255, 0.3);
    margin: 0.5em 0;
    padding-left: 1em;
    font-style: italic;
    opacity: 0.9;
  }

  // Links
  a {
    color: #4a9eff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  // Horizontal rules
  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    margin: 1em 0;
  }

  // Tables
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5em 0;
  }

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5em;
    text-align: left;
  }

  th {
    background-color: rgba(255, 255, 255, 0.1);
    font-weight: 600;
  }

  // Strong and emphasis
  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
`;

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <MarkdownContainer>
      <ReactMarkdown>{content}</ReactMarkdown>
    </MarkdownContainer>
  );
};
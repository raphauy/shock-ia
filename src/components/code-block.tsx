'use client'

import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from 'next-themes';

SyntaxHighlighter.registerLanguage('json', json);

type CodeBlockProps = {
  code: string;
  showLineNumbers: boolean;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, showLineNumbers }) => {
  const { theme } = useTheme();
  const style = theme === 'dark' ? atomOneDark : vs;

  return (
    <SyntaxHighlighter       
      language="json" 
      style={style} 
      showLineNumbers={showLineNumbers}
      wrapLongLines={true}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;

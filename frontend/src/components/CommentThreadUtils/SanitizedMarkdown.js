// frontend/src/components/SanitizedMarkdown.js

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

function SanitizedMarkdown({ content }) {
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {sanitizedContent}
    </ReactMarkdown>
  );
}

export default SanitizedMarkdown;

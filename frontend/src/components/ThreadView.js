// frontend/src/components/ThreadView.js

import React, { useState } from "react";
import CommentThread from "./CommentThread";
import CreateCommentForm from "./CreateCommentForm";

function ThreadView({ threadId }) {
  const [comments, setComments] = useState([]);

  // Root comment to act as the parent for all top-level comments
  const rootComment = {
    id: "root",
    text: "",
    replies: comments,
  };

  const handleCommentCreated = (newComment) => {
    // Update the replies of the root comment
    setComments((prevComments) => [...prevComments, newComment]);
  };

  const handleCommentDeleted = (commentId) => {
    // Remove the comment from the root's replies
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== commentId)
    );
  };

  return (
    <div>
      {/* Pass the root comment to CommentThread */}
      <CommentThread
        comment={rootComment}
        onCommentDeleted={handleCommentDeleted}
        onCommentCreated={handleCommentCreated}
      />

      {/* Pass rootComment.id as the parent for CreateCommentForm */}
      <CreateCommentForm
        threadId={threadId}
        rootCommentId={rootComment.id}
        onCommentCreated={handleCommentCreated}
      />
    </div>
  );
}

export default ThreadView;

// RepliesContainer.js

import React from "react";
import CommentThread from "../CommentThread";

function RepliesContainer({ replies, onCommentDeleted, onCommentCreated }) {
  return (
    <div style={styles.repliesContainer}>
      {replies.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          onCommentDeleted={onCommentDeleted}
          onCommentCreated={onCommentCreated} // Ensure it's passed down
        />
      ))}
    </div>
  );
}

const styles = {
  repliesContainer: {
    marginTop: "1rem",
    marginLeft: "1rem",
  },
};

export default React.memo(RepliesContainer);

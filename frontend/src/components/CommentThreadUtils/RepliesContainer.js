// frontend/src/components/RepliesContainer.js

// frontend/src/components/RepliesContainer.js

import React from "react";
import CommentThread from "../CommentThread";

function RepliesContainer({ replies, onCommentDeleted, onCommentCreated }) {
  const styles = {
    repliesContainer: {
      marginTop: "1rem",
      marginLeft: "1rem",
    },
  };

  

  return (
    <div style={styles.repliesContainer}>
      {replies.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          onCommentDeleted={onCommentDeleted}
          onCommentCreated={onCommentCreated}
        />
      ))}
    </div>
  );
}



export default RepliesContainer;


// frontend/src/components/CommentThreadUtils/RepliesContainer.js

import React from "react";
import PropTypes from "prop-types";
import CommentThread from "../CommentThread";

function RepliesContainer({ replies, onCommentDeleted, onCommentCreated }) {
  console.log("Rendering RepliesContainer with replies:", replies);
  
  return (
    <div style={styles.container}>
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

const styles = {
  container: {
    marginLeft: "2rem",
    marginTop: "1rem",
  },
};

RepliesContainer.propTypes = {
  replies: PropTypes.array.isRequired,
  onCommentDeleted: PropTypes.func.isRequired,
  onCommentCreated: PropTypes.func.isRequired,
};

export default RepliesContainer;

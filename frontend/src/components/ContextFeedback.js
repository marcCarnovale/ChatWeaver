// frontend/src/components/ContextFeedback.js

import React from "react";
import axios from "../utils/axiosConfig";


function ContextFeedback({ context, onFlag, onApprove }) {
  return (
    <div className="context-feedback" style={styles.feedbackContainer}>
    </div>
  );
}




const handleApprove = () => {
  axios
    .post("/context-feedback", {
      context_id: comment.id,
      action: "approve",
    })
    .then(() => {
      onApprove && onApprove(comment.id);
    })
    .catch((error) => {
      console.error("Error approving comment:", error);
    });
};

const styles = {
  feedbackContainer: {
    padding: "0.5rem 0",
    borderTop: "1px solid #eee",
    marginTop: "0.5rem",
  },
  feedbackMetrics: {
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: "0.5rem",
  },
  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
  },
  flagButton: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
  },
  approveButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
  },
};

export default ContextFeedback;

// frontend/src/components/ReplyForm.js

import React from "react";

function ReplyForm({
  replyText,
  setReplyText,
  selectedModel,
  setSelectedModel,
  handleReply,
  loading,
}) {
  const styles = {
    replyForm: {
      marginTop: "0.5rem",
    },
    textarea: {
      width: "100%",
      padding: "0.5rem",
      fontSize: "1rem",
      borderRadius: "0.25rem",
      border: "1px solid #ccc",
      resize: "vertical",
    },
    modelSelector: {
      marginTop: "0.5rem",
    },
    select: {
      marginLeft: "0.5rem",
      padding: "0.25rem",
      fontSize: "1rem",
    },
    submitButton: {
      marginTop: "0.5rem",
      padding: "0.5rem 1rem",
      fontSize: "1rem",
      borderRadius: "0.25rem",
      border: "none",
      backgroundColor: "#28a745",
      color: "#fff",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.replyForm}>
      {/* Reply Textarea */}
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        rows="3"
        style={styles.textarea}
        placeholder="Enter your reply..."
      />

      {/* Model Selection Dropdown */}
      <div style={styles.modelSelector}>
        <label>
          Select Model:
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={styles.select}
          >
            <option value="None">None</option>
            <option value="OpenAI GPT-4">OpenAI GPT-4</option>
            <option value="OpenAI GPT-4o-mini">OpenAI GPT-4o Mini</option>
            <option value="Local GPT-2">Local GPT-2</option>
            {/* Add more models as needed */}
          </select>
        </label>
      </div>

      {/* Submit Reply Button */}
      <button
        onClick={handleReply}
        style={styles.submitButton}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Reply"}
      </button>
    </div>
  );
}

export default ReplyForm;

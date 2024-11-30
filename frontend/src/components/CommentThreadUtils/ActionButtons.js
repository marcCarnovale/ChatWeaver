// frontend/src/components/ActionButtons.js

import React from "react";

function ActionButtons({
  showReplyForm,
  toggleReplyForm,
  showNewResponse,
  toggleNewResponse,
  isGenerating,
  hidden,
  handleAction,
}) {
  const styles = {
    actionButtonsContainer: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "0.5rem",
    },
    leftButtons: {
      display: "flex",
      gap: "0.5rem",
    },
    rightButtons: {
      display: "flex",
      gap: "0.5rem",
    },
    button: (bgColor, fontSize) => ({
      backgroundColor: bgColor,
      color: "#fff",
      border: "none",
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      cursor: "pointer",
      fontSize: fontSize || "0.9rem",
    }),
  };

  return (
    <div style={styles.actionButtonsContainer}>
      {/* Left-aligned Buttons */}
      <div style={styles.leftButtons}>
        {/* Reply Button */}
        <button
          onClick={toggleReplyForm}
          style={styles.button("#007BFF")}
        >
          {showReplyForm ? "Cancel" : "Reply"}
        </button>

        {/* New Response Button */}
        <button
          onClick={toggleNewResponse}
          style={styles.button("#6c757d")}
          disabled={isGenerating}
        >
          Request New Response
        </button>
      </div>

      {/* Right-aligned Buttons */}
      {!hidden && (
        <div style={styles.rightButtons}>
          <button
            onClick={() => handleAction("hide")}
            style={styles.button("#ffc107", "0.8rem")}
          >
            Hide
          </button>
          <button
            onClick={() => handleAction("delete")}
            style={styles.button("#dc3545", "0.8rem")}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default ActionButtons;

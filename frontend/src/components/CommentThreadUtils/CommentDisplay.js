// frontend/src/components/CommentThreadUtils/CommentDisplay.js

import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import SanitizedMarkdown from "./SanitizedMarkdown";
import StarRating from "../StarRating";
import ContextFeedback from "../ContextFeedback";

function CommentDisplay({
  comment,
  isCollapsed,
  toggleCollapse,
  onApprove,
  onFlag,
}) {
  const styles = {
    comment: {
      display: "flex",
      alignItems: "flex-start",
      padding: "0.5rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.3s, border-left-color 0.3s",
      position: "relative",
      backgroundColor: isCollapsed ? "#f9f9f9" : "#fff",
      borderLeftColor: comment.flags > 0 ? "#28a745" : "#007bff",
      borderLeftWidth: "4px",
      borderLeftStyle: "solid",
      marginBottom: "0.5rem",
    },
    clickableOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "20px", // Only left 20px is clickable
      height: "100%",
      cursor: "pointer",
      backgroundColor: "transparent",
      zIndex: 2, // Ensure it's above other elements
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "background-color 0.3s",
    },
    clickableOverlayHover: {
      backgroundColor: "rgba(0, 123, 255, 0.1)", // Light blue on hover
    },
    chevron: {
      color: "#555",
      fontSize: "0.8rem",
    },
    commentContent: {
      flex: 1,
      marginLeft: "1rem",
    },
    modelName: {
      fontStyle: "italic",
      color: "#555",
      fontSize: "0.85rem",
      marginTop: "0.25rem",
    },
    meta: {
      marginTop: "0.25rem",
      fontSize: "0.8rem",
      color: "#555",
      display: "flex",
      justifyContent: "space-between",
    },
  };

  const markdownContent = `**${
    comment.flags > 0 ? (comment.model_name || "AI") : "User"
  }:** ${comment.text}`;

  const summaryContent = comment.summary
    ? `**${
        comment.flags > 0 ? (comment.model_name || "AI") : "User"
      }:** ${comment.summary}`
    : `**${
        comment.flags > 0 ? (comment.model_name || "AI") : "User"
      }:** ${comment.text.substring(0, 100)}...`;

  return (
    <div
      className={`comment ${comment.flags > 0 ? "ai-comment" : "user-comment"}`}
      style={styles.comment}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f1f1f1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isCollapsed ? "#f9f9f9" : "#fff";
      }}
    >
      {/* Clickable Overlay - only left 20px */}
      <div
        className="clickable-overlay"
        onClick={toggleCollapse}
        title={isCollapsed ? "Expand Comment" : "Collapse Comment"}
        aria-label={isCollapsed ? "Expand Comment" : "Collapse Comment"}
        role="button"
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggleCollapse();
          }
        }}
        style={styles.clickableOverlay}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styles.clickableOverlayHover.backgroundColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = styles.clickableOverlay.backgroundColor;
        }}
      >
        <span className="chevron" style={styles.chevron}>
          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        </span>
      </div>

      {/* Comment Content */}
      <div style={styles.commentContent}>
        {/* Conditionally render summary or full comment based on isCollapsed */}
        {comment.text === "Thinking..." ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="rotating-circle"></span>
            <p>Thinking...</p>
          </div>
        ) : (
          <SanitizedMarkdown content={isCollapsed ? summaryContent : markdownContent} />
        )}

        {/* Display AI Model Name if AI-generated and not already shown */}
        {comment.flags > 0 && comment.model_name && (
          <p style={styles.modelName}>{comment.model_name}</p>
        )}

        {/* Star Rating Component */}
        <StarRating
          initialRating={comment.approvals}
          onRate={(rating) => console.log(`Rated ${rating} stars`)}
        />

        {/* Feedback Component */}
        <ContextFeedback
          context={comment}
          onFlag={onFlag}
          onApprove={onApprove}
        />

        {/* Optional: Display flags and approvals */}
        <div style={styles.meta}>
          <span>👍 {comment.approvals}</span>
          <span>👎 {comment.flags}</span>
        </div>
      </div>
    </div>
  );
}

export default CommentDisplay;

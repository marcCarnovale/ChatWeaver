// frontend/src/components/CommentThread.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import StarRating from "./StarRating"; // Import StarRating component
import ContextFeedback from "./ContextFeedback"; // Import updated ContextFeedback component
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify"; // Import DOMPurify for sanitization
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Optional: For chevron icons

function CommentThread({ comment, onCommentDeleted, onCommentCreated }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedModel, setSelectedModel] = useState("None");
  const [replies, setReplies] = useState(comment.replies || []);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewResponse, setShowNewResponse] = useState(false);
  const [newResponseModel, setNewResponseModel] = useState("None");
  const [hidden, setHidden] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // State for collapsing
  const [isGenerating, setIsGenerating] = useState(false); // Indicates the LLM is thinking

  // Synchronize local replies state with comment.replies prop
  useEffect(() => {
    setReplies(comment.replies || []);
  }, [comment.replies]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Submit the user's reply
      const response = await axios.post(`/threads/${comment.thread_id}/comments`, {
        parent_id: comment.id, // Reply to current comment
        text: replyText,
      });

      const newReply = response.data; // Newly created reply
      console.log("New Reply Created:", newReply); // Debugging

      // Add the user reply to the replies array
      setReplies([...replies, newReply]);
      setReplyText("");
      setShowReplyForm(false);

      // Inform parent about the new user reply
      if (onCommentCreated) {
        onCommentCreated(newReply);
      }

      // If a model is selected, generate AI response
      if (selectedModel !== "None") {
        setIsGenerating(true); // Start loading indicator

        const [modelType, modelName] = selectedModel.split(" ", 2);

        if (!modelType || !modelName) {
          setError("Invalid model selection.");
          setIsGenerating(false);
          return;
        }

        try {
          const aiResponse = await axios.post(
            `/threads/${comment.thread_id}/generate-response`,
            {
              model_type: modelType.toLowerCase(),
              model_name: modelName.toLowerCase(),
            },
            {
              params: { parent_comment_id: newReply.id }, // Pass the correct parent_comment_id as a query parameter
            }
          );

          console.log("AI Response Received:", aiResponse.data); // Debugging

          // Inform parent about the new AI reply
          if (onCommentCreated) {
            onCommentCreated(aiResponse.data);
          }

          setSelectedModel("None"); // Reset the dropdown to 'None'
        } catch (aiErr) {
          console.error("Error generating AI response:", aiErr);
          if (aiErr.response && aiErr.response.data && aiErr.response.data.detail) {
            setError(aiErr.response.data.detail);
          } else {
            setError("Failed to generate AI response.");
          }
        } finally {
          setIsGenerating(false); // Stop loading indicator
        }
      }
    } catch (err) {
      console.error("Error creating reply:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create reply.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewResponse = async () => {
    if (newResponseModel === "None") {
      setError("Please select a model.");
      return;
    }

    setLoading(true);
    setError(null);
    setShowNewResponse(false); // Close the popup immediately

    try {
      setIsGenerating(true); // Start loading indicator
      const [modelType, modelName] = newResponseModel.split(" ", 2);

      if (!modelType || !modelName) {
        setError("Invalid model selection.");
        setIsGenerating(false);
        return;
      }

      const generateResponsePayload = {
        model_type: modelType.toLowerCase(),
        model_name: modelName.toLowerCase(),
      };

      const aiResponse = await axios.post(
        `/threads/${comment.thread_id}/generate-response`,
        generateResponsePayload,
        {
          params: { parent_comment_id: comment.id }, // Generate response for this comment
        }
      );

      console.log("New AI Response Generated:", aiResponse.data); // Debugging

      // Inform parent about the new AI reply
      if (onCommentCreated) {
        onCommentCreated(aiResponse.data);
      }

      setNewResponseModel("None"); // Reset the dropdown
    } catch (err) {
      console.error("Error generating new AI response:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to generate AI response.");
      }
    } finally {
      setLoading(false);
      setIsGenerating(false); // Stop loading indicator
    }
  };

  const handleAction = async (action) => {
    try {
      await axios.post(`/comments/${comment.id}/action`, { action });

      if (action === "hide") {
        setHidden(true);
      } else if (action === "delete") {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      console.error(`Error performing ${action} on comment:`, err);
      setError(`Failed to ${action} the comment.`);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (hidden) return null; // Do not render hidden comments

  // Sanitize comment text to prevent XSS attacks
  const sanitizedText = DOMPurify.sanitize(comment.text);

  // Utility function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  // Construct markdown content for full comment
  const markdownContent = `**${
    comment.flags > 0 ? comment.model_name || "AI" : "User"
  }:** ${sanitizedText}`;

  // Construct markdown content for summary (if available)
  const summaryContent = comment.summary
    ? `**${
        comment.flags > 0 ? comment.model_name || "AI" : "User"
      }:** ${comment.summary}`
    : `**${
        comment.flags > 0 ? comment.model_name || "AI" : "User"
      }:** ${truncateText(comment.text, 100)}`;

  // Check if the comment is temporary
  if (comment.isTemporary) {
    return (
      <div style={styles.commentContainer}>
        <div style={styles.thinkingPlaceholder}>
          <div style={styles.spinner}></div>
          <span>Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.commentContainer}>
      {/* Comment Display */}
      <div
        className={`comment ${comment.flags > 0 ? "ai-comment" : "user-comment"}`}
        style={{
          ...styles.comment,
          backgroundColor: isCollapsed ? "#f9f9f9" : "#fff",
          borderLeftColor: comment.flags > 0 ? "#28a745" : "#007bff",
          borderLeftWidth: "4px",
          borderLeftStyle: "solid",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f1f1f1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isCollapsed
            ? "#f9f9f9"
            : "#fff";
        }}
      >
        {/* Invisible Clickable Overlay */}
        <div
          className="clickable-overlay"
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand Comment" : "Collapse Comment"}
          aria-label={isCollapsed ? "Expand Comment" : "Collapse Comment"}
          role="button"
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleCollapse();
            }
          }}
          style={styles.clickableOverlay}
        >
          <span className="chevron">
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </span>
        </div>

        {/* Comment Content */}
        <div style={styles.commentContent}>
          {/* Conditionally render summary or full comment based on isCollapsed */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {isCollapsed ? summaryContent : markdownContent}
          </ReactMarkdown>

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
            onFlag={() => handleAction("hide")} // Assuming flagging hides the comment
            onApprove={() => handleAction("approve")} // Implement approve action as needed
          />

          {/* Optional: Display flags and approvals */}
          <div style={styles.meta}>
            <span>👍 {comment.approvals}</span>
            <span>👎 {comment.flags}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtonsContainer}>
        {/* Left-aligned Buttons */}
        <div style={styles.leftButtons}>
          {/* Reply Button */}
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={styles.replyButton}
          >
            {showReplyForm ? "Cancel" : "Reply"}
          </button>

          {/* New Response Button */}
          <button
            onClick={() => setShowNewResponse(true)}
            style={styles.newResponseButton}
            disabled={isGenerating} // Disable while generating to prevent multiple requests
          >
            Request New Response
          </button>
        </div>

        {/* Right-aligned Buttons */}
        {!comment.hidden && (
          <div style={styles.rightButtons}>
            <button
              onClick={() => handleAction("hide")}
              style={styles.hideButton}
            >
              Hide
            </button>
            <button
              onClick={() => handleAction("delete")}
              style={styles.deleteButton}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p style={styles.error}>{error}</p>}

      {/* Reply Form */}
      {showReplyForm && (
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
      )}

      {/* New Response Modal */}
      {showNewResponse && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4>Select Model for New Response</h4>
            <div style={styles.formGroup}>
              <label>
                Select Model:
                <select
                  value={newResponseModel}
                  onChange={(e) => setNewResponseModel(e.target.value)}
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
            <div style={styles.buttonGroup}>
              <button
                onClick={handleNewResponse}
                style={styles.confirmButton}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={() => setShowNewResponse(false)}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator Placeholder */}
      {isGenerating && (
        <div style={styles.thinkingPlaceholder}>
          <div style={styles.spinner}></div>
          <span>Thinking...</span>
        </div>
      )}

      {/* Nested Replies */}
      {replies.length > 0 && !isCollapsed && (
        <div style={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onCommentDeleted={onCommentDeleted}
              onCommentCreated={onCommentCreated} // Pass the handler down
            />
          ))}
        </div>
      )}
    </div>
  ); // End of return statement
} // End of CommentThread component

// Styles Object (Moved outside the component)
const styles = {
  commentContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1rem",
  },
  comment: {
    display: "flex",
    alignItems: "flex-start",
    padding: "0.5rem",
    borderRadius: "0.25rem",
    transition: "background-color 0.3s, border-left-color 0.3s",
    position: "relative", // Ensure positioning for the overlay
  },
  clickableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
    zIndex: 1,
  },
  commentContent: {
    flex: 1,
    marginLeft: "1rem", // Space between border-left and content
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
  replyButton: {
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  newResponseButton: {
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  hideButton: {
    backgroundColor: "#ffc107",
    color: "#fff",
    border: "none",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
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
  repliesContainer: {
    marginTop: "1rem",
    marginLeft: "1rem",
  },
  error: {
    color: "red",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "0.25rem",
    width: "300px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  confirmButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
  },
  chevron: {
    pointerEvents: "none", // So that click is handled by the parent div
    color: "#555", // Adjust color as needed
    fontSize: "0.8rem", // Adjust size as needed
  },
  thinkingPlaceholder: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem",
    marginLeft: "1rem",
    backgroundColor: "#f0f0f0",
    borderLeft: "2px dashed #ccc",
    borderRadius: "4px",
    color: "#555",
    fontStyle: "italic",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #555",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    animation: "spin 2s linear infinite",
    marginRight: "0.5rem",
  },
};

export default CommentThread;

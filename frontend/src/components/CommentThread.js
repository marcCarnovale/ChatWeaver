import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import CommentDisplay from "./CommentThreadUtils/CommentDisplay";
import ActionButtons from "./CommentThreadUtils/ActionButtons";
import ReplyForm from "./CommentThreadUtils/ReplyForm";
import NewResponseModal from "./CommentThreadUtils/NewResponseModal";
import LoadingIndicator from "./CommentThreadUtils/LoadingIndicator";
import { handleNewResponse } from "../utils/handleNewResponse";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Synchronize local replies state with comment.replies prop
  useEffect(() => {
    setReplies(comment.replies || []);
  }, [comment.replies]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Handle error timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/threads/${comment.thread_id}/comments`, {
        parent_id: comment.id,
        text: replyText,
      });

      const newReply = response.data;

      setReplies((prevReplies) => [...prevReplies, newReply]);
      setReplyText("");
      setShowReplyForm(false);

      if (onCommentCreated) {
        onCommentCreated(newReply);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError(err.response?.data?.detail || "Failed to submit comment.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewResponseWrapper = async () => {
    // Close the modal immediately
    setShowNewResponse(false);
    
    setLoading(true);
    setError(null);
  
    try {
      await handleNewResponse({
        threadId: comment.thread_id,
        parentId: comment.id,
        newResponseModel,
        onCommentCreated,
        setReplies,
        setLoading,
        setError,
      });
    } catch (err) {
      console.error("Error handling new response:", err);
    } finally {
      setLoading(false);
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

  if (hidden) return null;

  if (comment.text === "Thinking...") {
    return (
      <div style={styles.commentContainer}>
        <LoadingIndicator message="Thinking..." />
      </div>
    );
  }

  return (
    <div style={styles.commentContainer}>
      <CommentDisplay
        comment={comment}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        onApprove={() => handleAction("approve")}
        onFlag={() => handleAction("hide")}
      />

      {isCollapsed && replies.length > 0 && (
        <div style={styles.replyCount} onClick={toggleCollapse}>
          {`(${replies.length} ${replies.length === 1 ? "child" : "children"})`}
        </div>
      )}

      <ActionButtons
        showReplyForm={showReplyForm}
        toggleReplyForm={() => setShowReplyForm(!showReplyForm)}
        showNewResponse={showNewResponse}
        toggleNewResponse={() => setShowNewResponse(true)}
        hidden={hidden}
        handleAction={handleAction}
      />

      {error && <p style={styles.error}>{error}</p>}

      {showReplyForm && (
        <ReplyForm
          replyText={replyText}
          setReplyText={setReplyText}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleReply={handleReply}
          loading={loading}
        />
      )}

      {showNewResponse && (
        <NewResponseModal
          newResponseModel={newResponseModel}
          setNewResponseModel={setNewResponseModel}
          handleNewResponse={handleNewResponseWrapper}
          closeModal={() => setShowNewResponse(false)}
          loading={loading}
        />
      )}

      {replies.length > 0 && !isCollapsed && (
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
      )}
    </div>
  );
}

const styles = {
  commentContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1rem",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  repliesContainer: {
    marginLeft: "2rem",
    marginTop: "1rem",
    borderLeft: "2px solid #ccc",
    paddingLeft: "1rem",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
  replyCount: {
    marginLeft: "1rem",
    marginTop: "0.5rem",
    fontSize: "0.9rem",
    color: "#555",
    cursor: "pointer",
    borderLeft: "2px solid #ccc",
    paddingLeft: "0.5rem",
  },
};

export default CommentThread;

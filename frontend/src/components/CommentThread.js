// frontend/src/components/CommentThread.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import CommentDisplay from "./CommentThreadUtils/CommentDisplay";
import ActionButtons from "./CommentThreadUtils/ActionButtons";
import ReplyForm from "./CommentThreadUtils/ReplyForm";
import NewResponseModal from "./CommentThreadUtils/NewResponseModal";
import LoadingIndicator from "./CommentThreadUtils/LoadingIndicator";
import RepliesContainer from "./CommentThreadUtils/RepliesContainer";

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Synchronize local replies state with comment.replies prop
  useEffect(() => {
    setReplies(comment.replies || []);
  }, [comment.replies]);

  
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
        const newState = !prev;
        if (!newState) {
            console.log("Expanding comment:", comment.id, "with replies:", replies);
        }
        return newState;
    });
};


  // Handle error timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle Reply Submission
  const handleReply = async () => {
    if (!replyText.trim()) return;

    setLoading(true); // Start loading
    setError(null);

    try {
      // Submit the comment as a reply to this comment
      const response = await axios.post(`/threads/${comment.thread_id}/comments`, {
        parent_id: comment.id,
        text: replyText,
      });

      const newReply = response.data;

      // Update replies and UI
      setReplies((prevReplies) => [...prevReplies, newReply]);
      setReplyText("");
      setShowReplyForm(false);

      // Notify parent if applicable
      if (onCommentCreated) {
        onCommentCreated(newReply);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError(err.response?.data?.detail || "Failed to submit comment.");
    } finally {
      setLoading(false); // Stop loading, regardless of success or failure
    }
  };

  // Handle Generating New Response
  const handleNewResponseWrapper = async () => {
    await handleNewResponse({
      threadId: comment.thread_id,
      parentId: comment.id,
      newResponseModel,
      onCommentCreated,
      setReplies,
      setLoading,
      setError,
    });
  };

  // Handle Actions (hide, delete, approve)
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

  // Check if the comment is a placeholder
  if (comment.text === "Thinking...") {
    return (
      <div style={styles.commentContainer}>
        <LoadingIndicator message="Thinking..." />
      </div>
    );
  }

  return (
    <div style={styles.commentContainer}>
      {/* Comment Display */}
      <CommentDisplay
        comment={comment}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        onApprove={() => handleAction("approve")}
        onFlag={() => handleAction("hide")}
      />

      {/* Action Buttons */}
      <ActionButtons
        showReplyForm={showReplyForm}
        toggleReplyForm={() => setShowReplyForm(!showReplyForm)}
        showNewResponse={showNewResponse}
        toggleNewResponse={() => setShowNewResponse(true)}
        isGenerating={isGenerating}
        hidden={hidden}
        handleAction={handleAction}
      />

      {/* Error Message */}
      {error && <p style={styles.error}>{error}</p>}

      {/* Reply Form */}
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

      {/* New Response Modal */}
      {showNewResponse && (
        <NewResponseModal
          newResponseModel={newResponseModel}
          setNewResponseModel={setNewResponseModel}
          handleNewResponse={handleNewResponseWrapper}
          closeModal={() => setShowNewResponse(false)}
          loading={loading}
        />
      )}

      {/* Loading Indicator */}
      {isGenerating && <LoadingIndicator message="Generating AI response..." />}

      {/* Nested Replies */}
      {replies.length > 0 && !isCollapsed && (
        <RepliesContainer
          replies={replies}
          onCommentDeleted={onCommentDeleted}
          onCommentCreated={onCommentCreated}
        />
      )}
    </div>
  );
}

// Styles Object
const styles = {
  commentContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1rem",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
};

export default CommentThread;
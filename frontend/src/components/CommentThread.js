// frontend/src/components/CommentThread.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import CommentDisplay from "./CommentThreadUtils/CommentDisplay";
import ActionButtons from "./CommentThreadUtils/ActionButtons";
import ReplyForm from "./CommentThreadUtils/ReplyForm";
import NewResponseModal from "./CommentThreadUtils/NewResponseModal";
import LoadingIndicator from "./CommentThreadUtils/LoadingIndicator";
import RepliesContainer from "./CommentThreadUtils/RepliesContainer";

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
    setReplies((prevReplies) => {
      const mergedReplies = [...(comment.replies || [])];
  
      prevReplies.forEach((reply) => {
        if (!reply.isTemporary && !mergedReplies.some((r) => r.id === reply.id)) {
          mergedReplies.push(reply);
        }
      });
  
      console.log("Merged replies on useEffect:", mergedReplies);
      return mergedReplies;
    });
  }, [comment.replies]);
  
  
  
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
      // Submit the top-level comment
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
  const handleNewResponse = async () => {
    if (newResponseModel === "None") {
      setError("Please select a model.");
      return;
    }
  
    setLoading(true);
    setError(null);
    setShowNewResponse(false);
  
    try {
      setIsGenerating(true);
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
  
      // Add a temporary "Thinking..." comment
      const tempComment = {
        id: `temp-${Date.now()}`,
        text: "Thinking...",
        isTemporary: true,
      };
      setReplies((prevReplies) => [...prevReplies, tempComment]);
  
      const aiResponse = await axios.post(
        `/threads/${comment.thread_id}/generate-response`,
        generateResponsePayload,
        {
          params: { parent_comment_id: comment.id },
        }
      );
  
      // Replace the temporary comment with the actual AI response
      setReplies((prevReplies) =>
        prevReplies.map((reply) =>
          reply.id === tempComment.id ? aiResponse.data : reply
        )
      );
  
      if (onCommentCreated) {
        onCommentCreated(aiResponse.data);
      }
  
      setNewResponseModel("None");
    } catch (err) {
      console.error("Error generating new AI response:", err);
      setError(err.response?.data?.detail || "Failed to generate AI response.");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
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

  // Toggle Collapse
  const toggleCollapse = () => {
    if (!isCollapsed) {
      console.log("Collapsing comment:", comment.id);
    } else {
      console.log("Expanding comment:", comment.id);
    }
    setIsCollapsed((prev) => !prev);
  };
  

  if (hidden) return null;

  // Check if the comment is temporary
  if (comment.isTemporary) {
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
          handleNewResponse={handleNewResponse}
          closeModal={() => setShowNewResponse(false)}
          loading={loading}
        />
      )}

      {/* Loading Indicator */}
      {isGenerating && <LoadingIndicator />}

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

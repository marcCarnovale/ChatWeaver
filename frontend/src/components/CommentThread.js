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
        setReplies(comment.replies || []); // Replace state directly
    }, [comment.replies]);

    
    const toggleCollapse = () => {
      setIsCollapsed((prev) => {
          const newState = !prev;
          if (!newState) {
              console.log("Expanding comment:", comment.id);
              console.log("Replies tree:", replies);
          } else {
              console.log("Collapsing comment:", comment.id);
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
        const [modelType, modelName] = newResponseModel.split(" ", 2);
    
        if (!modelType || !modelName) {
          setError("Invalid model selection.");
          return;
        }
    
        const generateResponsePayload = {
          model_type: modelType.toLowerCase(),
          model_name: modelName.toLowerCase(),
        };
    
        // Create a placeholder comment
        const placeholderResponse = await axios.post(`/threads/${comment.thread_id}/comments`, {
          parent_id: comment.id,
          text: "Thinking...",
        });
    
        const placeholderComment = { ...placeholderResponse.data, replies: [] };
        setReplies((prevReplies) => [...prevReplies, placeholderComment]);
    
        // Generate response and overwrite the placeholder
        const aiResponse = await axios.post(
          `/threads/${comment.thread_id}/generate-response`,
          generateResponsePayload,
          { params: { parent_comment_id: placeholderComment.id } }
        );
    
        // Update placeholder with AI response data
        setReplies((prevReplies) =>
          prevReplies.map((reply) =>
            reply.id === placeholderComment.id
              ? { ...reply, text: aiResponse.data.text, flags: aiResponse.data.flags }
              : reply
          )
        );
      } catch (err) {
        console.error("Error generating new AI response:", err);
        setError(err.response?.data?.detail || "Failed to generate AI response.");
      } finally {
        setLoading(false);
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

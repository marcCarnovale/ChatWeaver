// frontend/src/components/ThreadView.jsx

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import CommentThread from "../components/CommentThread"; // Ensure correct implementation
import CreateCommentForm from "../components/CreateCommentForm";

function ThreadView({ threadId }) {
  const [rootComment, setRootComment] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for model selection
  const [selectedLLM, setSelectedLLM] = useState("openai"); // Default LLM
  const [selectedModel, setSelectedModel] = useState("gpt-4"); // Default model

  // State for generating AI response
  const [generateAIResponse, setGenerateAIResponse] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const fetchThreadDetails = async () => {
      try {
        // Fetch thread details to get root_comment_id
        const threadResponse = await axios.get(`/threads/${threadId}`);
        const threadData = threadResponse.data;

        if (!threadData.root_comment_id) {
          throw new Error("Thread data missing root_comment_id");
        }

        console.log("Fetched Thread Data:", JSON.stringify(threadData, null, 2)); // Debugging

        // Fetch root comment details
        const rootCommentResponse = await axios.get(`/comments/${threadData.root_comment_id}`);
        setRootComment(rootCommentResponse.data);

        // Fetch other comments
        const commentsResponse = await axios.get(`/threads/${threadId}/comments`);
        setComments(commentsResponse.data);
      } catch (err) {
        console.error("Error fetching thread details or comments:", err);
        setError("Failed to load thread details.");
      } finally {
        setLoading(false);
      }
    };

    if (threadId) {
      fetchThreadDetails();
    }
  }, [threadId]);

  const handleCommentCreated = (newComment) => {
    console.log("New Comment Created:", newComment); // Debugging
    setComments((prevComments) => [...prevComments, newComment]);
  };

  const handleCommentDeleted = (deletedCommentId) => {
    setComments((prevComments) => prevComments.filter((c) => c.id !== deletedCommentId));
  };

  if (loading) return <p>Loading thread and comments...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div>
      {/* Pass the root comment to CommentThread */}
      {rootComment && (
        <CommentThread
          comment={rootComment}
          onCommentDeleted={handleCommentDeleted}
          onCommentCreated={handleCommentCreated}
        />
      )}

      {/* Pass rootComment.id as the parent for CreateCommentForm */}
      {rootComment && (
        <CreateCommentForm
          threadId={threadId}
          rootCommentId={rootComment.id} // Ensure rootComment.id exists
          onCommentCreated={handleCommentCreated}
        />
      )}

      {/* Render other comments */}
      <div className="comments-section" style={styles.commentsSection}>
        <h3>Comments</h3>
        {comments.length === 0 ? (
          <p>No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  commentsSection: {
    marginTop: "2rem",
  },
  error: {
    color: "red",
  },
};

export default ThreadView;
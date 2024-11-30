// frontend/src/components/ThreadView.jsx

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import CommentThread from "../components/CommentThread"; // Ensure this component is correctly implemented

function ThreadView({ threadId }) {
  const [inputText, setInputText] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
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
    if (threadId) {
      fetchComments(threadId);
    } else {
      setComments([]);
    }
  }, [threadId]);

  const fetchComments = async (threadId) => {
    try {
      const response = await axios.get(`/threads/${threadId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments.");
    }
  };

  const handleSubmitComment = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Submit the user's comment
      const createCommentResponse = await axios.post(`/threads/${threadId}/comments`, {
        parent_id: null, // Adjust if you're implementing nested replies
        text: inputText,
      });

      console.log("Create Comment Response:", createCommentResponse.data);

      // Optionally generate AI response
      if (generateAIResponse) {
        const generateResponsePayload = {
          thread_id: threadId,
          model_type: selectedLLM,
          model_name: selectedModel,
          summarize: true, // Adjust based on your backend's capabilities
        };

        const aiResponse = await axios.post(`/threads/${threadId}/generate-response`, generateResponsePayload);
        console.log("AI Generated Response:", aiResponse.data);
      }

      // Refresh comments
      await fetchComments(threadId);
      setInputText("");
      setGenerateAIResponse(false);
    } catch (error) {
      console.error("Error submitting comment:", error);
      setError("Failed to create comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thread-view" style={styles.container}>
      <div className="main-content" style={styles.mainContent}>
        <h2>Thread View</h2>
        {!threadId && <p>Please select a thread from the sidebar to view comments.</p>}
        {threadId && (
          <>
            {/* Model Selection */}
            <div style={styles.modelSelector}>
              <label>
                Select LLM:
                <select
                  value={selectedLLM}
                  onChange={(e) => setSelectedLLM(e.target.value)}
                  style={styles.select}
                >
                  <option value="openai">OpenAI GPT</option>
                  <option value="local">Local LLM</option>
                </select>
              </label>
              {selectedLLM === "openai" && (
                <label style={{ marginLeft: "1rem" }}>
                  Select Model:
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={styles.select}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </label>
              )}
            </div>

            {/* AI Response Toggle */}
            <div style={styles.aiToggle}>
              <label>
                <input
                  type="checkbox"
                  checked={generateAIResponse}
                  onChange={(e) => setGenerateAIResponse(e.target.checked)}
                />
                Generate AI Response
              </label>
            </div>

            {/* Comment Input */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your message here..."
              rows="4"
              style={styles.textarea}
            />
            <button
              onClick={handleSubmitComment}
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Comment"}
            </button>
            {error && <p style={styles.error}>{error}</p>}

            {/* Comments Section */}
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
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
  },
  mainContent: {
    flex: 1,
    padding: "1rem",
  },
  modelSelector: {
    marginBottom: "1rem",
  },
  select: {
    marginLeft: "0.5rem",
    padding: "0.25rem",
    fontSize: "1rem",
  },
  aiToggle: {
    marginBottom: "1rem",
  },
  textarea: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "1px solid #ccc",
    resize: "vertical",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "none",
    backgroundColor: "#28a745",
    color: "#fff",
    cursor: "pointer",
  },
  commentsSection: {
    marginTop: "2rem",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
};

export default ThreadView;

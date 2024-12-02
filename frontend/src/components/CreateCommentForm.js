import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { handleNewResponse } from "../utils/handleNewResponse";

function CreateCommentForm({ threadId, rootCommentId, onCommentCreated }) {
  const [commentText, setCommentText] = useState("");
  const [selectedModel, setSelectedModel] = useState("None");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError("Comment text is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/threads/${threadId}/comments`, {
        parent_id: rootCommentId,
        text: commentText,
      });

      const newComment = { ...response.data, replies: [] };
      onCommentCreated(newComment);

      setCommentText("");
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to create comment.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async () => {
    if (selectedModel === "None") {
      setError("Please select a model to request a response.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await handleNewResponse({
        threadId,
        parentId: rootCommentId,
        newResponseModel: selectedModel,
        onCommentCreated,
        setReplies: null, // Not needed here
        setLoading,
        setError,
      });

      setSelectedModel("None");
    } catch (err) {
      console.error("Error requesting response:", err);
      setError("Failed to request response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={styles.form}>
      {error && <p style={styles.error}>{error}</p>}

      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows="3"
        style={styles.textarea}
        placeholder="Enter your comment..."
      />


      <div style={styles.buttonGroup}>
        <button
          type="submit"
          onClick={handleSubmit}
          style={{ ...styles.button, backgroundColor: "#28a745" }}
          disabled={loading}
        >
          {loading && selectedModel === "None" ? "Submitting..." : "Submit Comment"}
        </button>
        <button
          type="button"
          onClick={handleRequestResponse}
          style={{ ...styles.button, backgroundColor: "#007BFF" }}
          disabled={loading}
        >
          {loading && selectedModel !== "None" ? "Requesting..." : "Request Response"}
        </button>
      </div>


      <div style={styles.modelSelectorTopComment}>
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
    </form>
  );
}

const styles = {
  form: {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
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
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  modelSelectorTopComment: {
    marginTop: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    justifyContent: "flex-end", // This right-aligns the content
    padding: "5px",
  },
  select: {
    marginLeft: "0.5rem",
    padding: "0.25rem",
    fontSize: "1rem",
  },
  buttonGroup: {
    marginTop: "0.5rem",
    display: "flex",
    gap: "0.5rem",
  },
  button: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "0.5rem",
  },
};

export default CreateCommentForm;

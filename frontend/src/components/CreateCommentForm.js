import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { handleNewResponse } from "../utils/handleNewResponse";

function CreateCommentForm({ threadId, rootCommentId, onCommentCreated }) {
  const modelOptions = [
    { label: "None", value: null },
    { label: "OpenAI GPT-4", value: { model_type: "openai", model_name: "gpt-4" } },
    { label: "OpenAI GPT-3.5 Turbo", value: { model_type: "openai", model_name: "gpt-3.5-turbo" } },
    { label: "Local GPT-2", value: { model_type: "local", model_name: "gpt-2" } },
    // Add more models as needed
  ];

  const [commentText, setCommentText] = useState("");
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]); // Default to "None"
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
      let errorMessage = "Failed to create comment.";
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.map(item => item.msg).join(", ");
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async () => {
    if (!selectedModel.value) {
      setError("Please select a model to request a response.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await handleNewResponse({
        threadId,
        parentId: rootCommentId,
        modelType: selectedModel.value.model_type,
        modelName: selectedModel.value.model_name,
        onCommentCreated,
        setReplies: null, // Not needed here
        setLoading,
        setError,
      });

      setSelectedModel(modelOptions[0]); // Reset to "None"
    } catch (err) {
      console.error("Error requesting response:", err);
      let errorMessage = "Failed to request response.";
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.map(item => item.msg).join(", ");
        }
      }
      setError(errorMessage);
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
          {loading && !selectedModel.value ? "Submitting..." : "Submit Comment"}
        </button>
        <button
          type="button"
          onClick={handleRequestResponse}
          style={{ ...styles.button, backgroundColor: "#007BFF" }}
          disabled={loading}
        >
          {loading && selectedModel.value ? "Requesting..." : "Request Response"}
        </button>
      </div>

      <div style={styles.modelSelectorTopComment}>
        <label>
          Select Model:
          <select
            value={selectedModel.label}
            onChange={(e) => {
              const selected = modelOptions.find(option => option.label === e.target.value);
              setSelectedModel(selected);
            }}
            style={styles.select}
          >
            {modelOptions.map(option => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
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
  modelSelectorTopComment: {
    marginTop: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    justifyContent: "flex-end",
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

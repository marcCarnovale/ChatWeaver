// frontend/src/components/CommentForm.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { v4 as uuidv4 } from "uuid";
import { handleApiError, autoClearError } from "../utils/helpers";

function CommentForm({ threadId, parentId = null, onCommentCreated }) {
  const [commentText, setCommentText] = useState("");
  const [selectedModel, setSelectedModel] = useState("None");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => autoClearError(error, setError), [error]);

  const submitComment = async () => {
    const response = await axios.post(`/threads/${threadId}/comments`, {
      parent_id: parentId,
      text: commentText,
    });
    return response.data;
  };

  const generateAIResponse = async (newComment) => {
    const [modelType, modelName] = selectedModel.split(" ");
    const tempId = uuidv4();
    const tempComment = {
      id: tempId,
      thread_id: threadId,
      parent_id: newComment.id,
      text: "Thinking...",
      model_name: modelName,
      isTemporary: true,
      replies: [],
    };

    // Append the temporary comment
    onCommentCreated(tempComment);

    try {
      const payload = {
        model_type: modelType.toLowerCase(),
        model_name: modelName.toLowerCase(),
      };

      const response = await axios.post(
        `/threads/${threadId}/generate-response`,
        payload,
        { params: { parent_comment_id: newComment.id } }
      );

      // Replace the temporary comment with the AI response
      onCommentCreated({
        ...response.data,
        isTemporary: false,
        tempId, // Link to the temporary comment for replacement
      });
    } catch (err) {
      handleApiError(err, setError, "Failed to generate AI response.");
      // Remove the temporary comment if AI generation fails
      onCommentCreated({ id: tempId, remove: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      setError("Comment text is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newComment = await submitComment();
      onCommentCreated(newComment);
      setCommentText("");

      if (selectedModel !== "None") {
        await generateAIResponse(newComment);
        setSelectedModel("None");
      }
    } catch (err) {
      handleApiError(err, setError, "Failed to create comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <p style={styles.error}>{error}</p>}
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows="3"
        style={styles.textarea}
        placeholder={parentId ? "Enter your reply..." : "Enter your comment..."}
      />
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
          </select>
        </label>
      </div>
      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? "Submitting..." : parentId ? "Submit Reply" : "Submit Comment"}
      </button>
    </form>
  );
}

const styles = {
  form: { marginTop: "1rem", display: "flex", flexDirection: "column" },
  textarea: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "1px solid #ccc",
    resize: "vertical",
  },
  modelSelector: { marginTop: "0.5rem" },
  select: {
    marginLeft: "0.5rem",
    padding: "0.25rem",
    fontSize: "1rem",
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
  error: { color: "red" },
};

export default CommentForm;

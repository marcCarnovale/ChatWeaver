// frontend/src/components/CreateCommentForm.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";

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
  
    if (!commentText.trim() && selectedModel === "None") {
      setError("Comment text is required or select a model to generate a response.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Create the top-level comment (as a reply to the root comment)
      const response = await axios.post(`/threads/${threadId}/comments`, {
        parent_id: rootCommentId, // Hidden root comment
        text: commentText,
      });
  
      const newComment = { ...response.data, replies: [] };
      onCommentCreated(newComment);
  
      setCommentText("");
  
      // Handle AI response if a model is selected
      if (selectedModel !== "None") {
        const [modelType, modelName] = selectedModel.split(" ", 2);
  
        if (!modelType || !modelName) {
          throw new Error("Invalid model selection.");
        }
  
        const generateResponsePayload = {
          model_type: modelType.toLowerCase(),
          model_name: modelName.toLowerCase(),
        };
  
        // Create a placeholder child comment with "Thinking..."
        const placeholderResponse = await axios.post(`/threads/${threadId}/comments`, {
          parent_id: newComment.id,
          text: "Thinking...",
        });
  
        const placeholderComment = { ...placeholderResponse.data, replies: [] };
        onCommentCreated(placeholderComment);
  
        try {
          // Generate the LLM response
          const aiResponse = await axios.post(
            `/threads/${threadId}/generate-response`,
            generateResponsePayload,
            { params: { parent_comment_id: newComment.id } }
          );
  
          // Update the placeholder with the LLM response
          onCommentCreated({
            ...placeholderComment,
            text: aiResponse.data.text,
            flags: aiResponse.data.flags || 0,
            approvals: aiResponse.data.approvals || 0,
          });
        } catch (aiErr) {
          console.error("Error generating AI response:", aiErr);
          setError("Failed to generate AI response.");
        }
      }
  
      setSelectedModel("None");
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to create comment.");
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
        placeholder="Enter your comment..."
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
        {loading ? "Submitting..." : "Submit Comment"}
      </button>
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
  },
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
  error: {
    color: "red",
  },
};

export default CreateCommentForm;

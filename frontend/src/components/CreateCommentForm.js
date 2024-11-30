// frontend/src/components/CreateCommentForm.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique IDs

function CreateCommentForm({ threadId, onCommentCreated }) {
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState(null);

  // State for model selection
  const [selectedModel, setSelectedModel] = useState("None"); // Default to 'None'
  const [loading, setLoading] = useState(false); // To handle loading state

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!commentText.trim()) {
      setError("Comment text is required.");
      return;
    }
  
    setLoading(true); // Start loading
    setError(null);   // Clear previous errors
  
    try {
      // Submit the top-level comment
      const response = await axios.post(`/threads/${threadId}/comments`, {
        parent_id: null, // Top-level comment
        text: commentText,
      });
  
      const newComment = response.data;
      console.log("New Comment Created:", newComment); // Debugging
  
      // Notify the parent about the new comment
      onCommentCreated(newComment);
  
      // Clear the input field
      setCommentText("");
  
      // Handle AI response if a model is selected
      if (selectedModel !== "None") {
        try {
          // Create a temporary placeholder comment
          const tempId = uuidv4(); // Generate a unique temporary ID
          const tempComment = {
            id: tempId,
            thread_id: threadId,
            parent_id: newComment.id,
            text: "Thinking...",
            flags: 0,
            approvals: 0,
            model_name: selectedModel.split(" ", 2)[1] || "AI",
            isTemporary: true,
            replies: [],
          };
  
          onCommentCreated(tempComment); // Append temporary comment
  
          const [modelType, ...modelNameParts] = selectedModel.split(" ");
          const modelName = modelNameParts.join(" ");
  
          if (!modelType || !modelName) {
            throw new Error("Invalid model selection.");
          }
  
          const generateResponsePayload = {
            model_type: modelType.toLowerCase(),
            model_name: modelName.toLowerCase(),
          };
  
          const aiResponse = await axios.post(
            `/threads/${threadId}/generate-response`,
            generateResponsePayload,
            { params: { parent_comment_id: newComment.id } }
          );
  
          console.log("AI Response Received:", aiResponse.data); // Debugging
  
          // Replace the temporary comment with the final AI response
          onCommentCreated({
            ...aiResponse.data,
            isTemporary: false, // Mark as a finalized comment
            tempId, // Reference to the temporary comment
          });
  
          setSelectedModel("None"); // Reset the model selection
        } catch (aiErr) {
          console.error("Error generating AI response:", aiErr);
          setError(
            aiErr.response?.data?.detail || "Failed to generate AI response."
          );
        }
      }
    } catch (err) {
      console.error("Error creating comment:", err);
      setError(err.response?.data?.detail || "Failed to create comment.");
    } finally {
      setLoading(false); // Ensure loading stops regardless of success or failure
    }
  };
  
  

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <p style={styles.error}>{error}</p>}

      {/* Comment Textarea */}
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows="3"
        style={styles.textarea}
        placeholder="Enter your comment..."
      />

      {/* Model Selection Dropdown */}
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
            {/* Add more models as needed */}
          </select>
        </label>
      </div>

      {/* Submit Button */}
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

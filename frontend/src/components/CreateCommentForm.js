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

    setLoading(true);
    setError(null);

    try {
      // Submit the user's comment
      const response = await axios.post(`/threads/${threadId}/comments`, {
        parent_id: null, // Top-level comment
        text: commentText,
      });

      const newComment = response.data;
      console.log("New Comment Created:", newComment); // Debugging
      onCommentCreated(newComment);
      setCommentText("");

      // If a model is selected (not 'None'), generate AI response
      if (selectedModel !== "None") {
        // Create a temporary placeholder comment
        const tempId = uuidv4(); // Generate a unique temporary ID
        const tempComment = {
          id: tempId,
          thread_id: threadId,
          parent_id: newComment.id,
          text: "Thinking...",
          flags: 0,
          approvals: 0,
          model_name: selectedModel.split(" ", 2)[1] || "AI", // Extract model name or default to 'AI'
          isTemporary: true, // Flag to identify placeholder
          replies: [],
        };

        // Append the temporary comment
        onCommentCreated(tempComment);

        // Correctly split the selectedModel into type and name
        const [modelType, ...modelNameParts] = selectedModel.split(" ");
        const modelName = modelNameParts.join(" ");

        if (!modelType || !modelName) {
          setError("Invalid model selection.");
          // Optionally remove the temporary comment if selection is invalid
          // Implement this if desired
          setLoading(false);
          return;
        }

        const generateResponsePayload = {
          model_type: modelType.toLowerCase(), // 'openai' or 'local'
          model_name: modelName.toLowerCase(), // e.g., 'gpt-4' or 'gpt2'
        };

        try {
          const aiResponse = await axios.post(
            `/threads/${threadId}/generate-response`,
            generateResponsePayload,
            {
              params: { parent_comment_id: newComment.id }, // Pass the correct parent_comment_id
            }
          );

          console.log("AI Response Received:", aiResponse.data); // Debugging

          // Replace the temporary comment with the actual AI response
          onCommentCreated({
            ...aiResponse.data,
            isTemporary: false, // Remove the temporary flag
            tempId, // Reference to the temporary comment
          });

          setSelectedModel("None"); // Reset the dropdown to 'None'
        } catch (aiErr) {
          console.error("Error generating AI response:", aiErr);
          if (aiErr.response && aiErr.response.data && aiErr.response.data.detail) {
            setError(aiErr.response.data.detail);
          } else {
            setError("Failed to generate AI response.");
          }

          // Optionally remove the temporary comment if AI generation fails
          // Implement this if desired
        } finally {
          setLoading(false); // Stop loading indicator
        }
      }
    } catch (err) {
      console.error("Error creating comment:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create comment.");
      }
      setLoading(false);
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

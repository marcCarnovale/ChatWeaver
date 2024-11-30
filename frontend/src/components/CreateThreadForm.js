// frontend/src/components/CreateThreadForm.js

import React, { useState, useEffect} from "react";
import axios from "../utils/axiosConfig";

function CreateThreadForm({ categoryId, onThreadCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

const handleCreateThread = async (e) => {
  e.preventDefault();
  if (!name.trim()) return;

  setCreating(true);
  setError(null);

  try {
    // Step 1: Create the thread
    const threadResponse = await axios.post("/threads", {
      name,
      category_id: categoryId,
      description,
    });
    const threadData = threadResponse.data;

    console.log("Create Thread Response:", threadData);

    // Step 2: Create the root-level (invisible) comment with retry logic
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    let rootCommentResponse;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        rootCommentResponse = await axios.post(`/threads/${threadData.id}/comments`, {
          parent_id: null,
          text: "Root Comment",
        });
        break; // Success, exit loop
      } catch (rootErr) {
        if (attempt === MAX_RETRIES) {
          console.error("Error creating root comment after retries:", rootErr);
          throw new Error("Failed to create the root comment after multiple attempts.");
        }
        console.warn(`Retrying root comment creation (attempt ${attempt})...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    const rootComment = rootCommentResponse.data;

    // Step 3: Combine thread data with root comment ID
    const threadWithRootComment = {
      ...threadData,
      rootCommentId: rootComment.id,
    };

    // Notify parent with thread data including root comment ID
    onThreadCreated(threadWithRootComment);

    // Clear form fields
    setName("");
    setDescription("");
  } catch (err) {
    console.error("Error creating thread or root comment:", err);
    setError(
      err.message.includes("root comment")
        ? "Failed to create the root comment for the thread."
        : "Failed to create thread. Ensure the category exists."
    );
  } finally {
    setCreating(false);
  }
};

  

  return (
    <div style={styles.container}>
      <h3>Create a New Thread</h3>
      <form onSubmit={handleCreateThread} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Thread Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            style={styles.textarea}
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={creating}>
          {creating ? "Creating..." : "Create Thread"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "0.25rem",
    backgroundColor: "#f1f1f1",
    marginTop: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "1px solid #ccc",
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
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    borderRadius: "0.25rem",
    border: "none",
    backgroundColor: "#17a2b8",
    color: "#fff",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};

export default CreateThreadForm;


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
    if (!name.trim()) {
      setError("Thread name is required.");
      return;
    }
  
    setCreating(true);
    setError(null);
  

    try {
      // Step 1: Create the thread (backend handles root comment creation)
      const threadResponse = await axios.post("/threads", {
        name,
        category_id: categoryId,
        description,
      });

      const threadData = threadResponse.data;

      if (!threadData.root_comment_id) {
        throw new Error("Thread creation failed: Missing root comment ID.");
      }
      if (!threadData.thread_id) {
        throw new Error("Thread creation failed: Missing thread ID.");
      }

      console.log("Thread Created with Root Comment ID:", threadData.root_comment_id);

      // Step 2: Notify parent with thread data
      onThreadCreated(threadData);
      
      // Step 3: Clear form fields
      setName("");
      setDescription("");
    } catch (err) {
      console.error("Error creating thread:", err);
      setError(
        err.response?.data?.detail || "Failed to create thread. Ensure the category exists."
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
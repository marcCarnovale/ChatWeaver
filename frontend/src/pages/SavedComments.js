// frontend/src/pages/SavedComments.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";

function SavedComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  useEffect(() => {
    axios
      .get("/saved-comments") // Ensure this endpoint exists and is correctly implemented in the backend
      .then((response) => {
        setComments(response.data.comments);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching saved comments:", error);
        setError("Failed to load comments.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading saved comments...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="saved-comments" style={styles.container}>
      <h2>Saved Comments</h2>
      {comments.length === 0 ? (
        <p>No saved comments available.</p>
      ) : (
        <ul style={styles.commentList}>
          {comments.map((comment) => (
            <li key={comment.id} style={styles.commentItem}>
              <p>
                <strong>{comment.author}</strong>: {comment.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
  },
  commentList: {
    listStyle: "none",
    padding: 0,
  },
  commentItem: {
    padding: "0.5rem",
    borderBottom: "1px solid #eee",
  },
};

export default SavedComments;

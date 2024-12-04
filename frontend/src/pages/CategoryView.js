// frontend/src/pages/CategoryView.js

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import CreateThreadForm from "../components/CreateThreadForm";

function CategoryView() {
  const { categoryId } = useParams();
  const [threads, setThreads] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const fetchCategoryAndThreads = async () => {
      try {
        // Fetch category details
        const categoriesResponse = await axios.get("/categories");
        const selectedCategory = categoriesResponse.data.find(cat => cat.id === parseInt(categoryId));

        if (!selectedCategory) {
          throw new Error("Category not found.");
        }

        setCategory(selectedCategory);

        // Fetch threads within the category
        const threadsResponse = await axios.get(`/categories/${categoryId}/threads`);
        setThreads(threadsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching category or threads:", err);
        // Display the actual error message from backend if available
        let message = "Failed to load category or threads.";
        if (err.response && err.response.data) {
          if (err.response.data.detail) {
            message = err.response.data.detail;
          } else if (Array.isArray(err.response.data)) {
            message = err.response.data.map(item => item.msg).join(", ");
          }
        }
        setError(message);
        setLoading(false);
      }
    };

    fetchCategoryAndThreads();
  }, [categoryId]);

  const handleThreadCreated = (newThread) => {
    setThreads([...threads, newThread]);
  };

  if (loading) return <p>Loading category and threads...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2>Category: {category.name}</h2>
      <p>{category.description}</p>
      <h3>Threads</h3>
      <ul style={styles.threadList}>
        {threads.length === 0 ? (
          <p>No threads in this category. Create one!</p>
        ) : (
          threads.map((thread) => (
            <li key={thread.id} style={styles.threadItem}> {/* Changed 'thread_id' to 'id' */}
              <Link to={`/threads/${thread.id}`} style={styles.threadLink}> {/* Changed 'thread_id' to 'id' */}
                {thread.title} {/* Changed 'name' to 'title' */}
              </Link>
            </li>
          ))
        )}
      </ul>
      <CreateThreadForm categoryId={categoryId} onThreadCreated={handleThreadCreated} />
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
  },
  threadList: {
    listStyle: "none",
    padding: 0,
  },
  threadItem: {
    marginBottom: "0.5rem",
  },
  threadLink: {
    textDecoration: "none",
    color: "#007BFF",
    fontSize: "1.1rem",
  },
  error: {
    color: "red",
  },
};

export default CategoryView;

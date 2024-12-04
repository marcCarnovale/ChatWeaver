// frontend/src/components/Retrievedthreadsidebar.js

import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { Link } from "react-router-dom";
import CreateCategoryForm from "./CreateCategoryForm"; // Correct Import

function Retrievedthreadsidebar() {
  const [categories, setCategories] = useState([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories.");
    }
  };

  const handleCategoryCreated = (newCategory) => {
    setCategories([...categories, newCategory]);
    setCreatingCategory(false);
  };

  return (
    <div className="retrieved-context-sidebar" style={styles.sidebar}>
      <h3>Categories</h3>
      {error && <p style={styles.error}>{error}</p>}
      <ul style={styles.categoryList}>
        {categories.map((category) => (
          <li key={category.id} style={styles.categoryItem}>
            <Link to={`/categories/${category.id}`} style={styles.link}>
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setCreatingCategory(!creatingCategory)}
        style={styles.toggleButton}
      >
        {creatingCategory ? "Cancel" : "Create New Category"}
      </button>
      {creatingCategory && <CreateCategoryForm onCategoryCreated={handleCategoryCreated} />}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "25%",
    padding: "1rem",
    borderRight: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  categoryList: {
    listStyle: "none",
    padding: 0,
    marginBottom: "1rem",
  },
  categoryItem: {
    marginBottom: "0.5rem",
  },
  link: {
    textDecoration: "none",
    color: "#007BFF",
    fontSize: "1rem",
  },
  toggleButton: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.25rem",
    backgroundColor: "#6c757d",
    color: "#fff",
    cursor: "pointer",
    width: "100%",
  },
  error: {
    color: "red",
  },
};

export default Retrievedthreadsidebar;

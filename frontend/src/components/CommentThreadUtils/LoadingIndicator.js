// frontend/src/components/LoadingIndicator.js

import React from "react";
import { FaSpinner } from "react-icons/fa";

function LoadingIndicator({ message = "Thinking..." }) {
  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      padding: "0.5rem",
      marginLeft: "1rem",
      backgroundColor: "#f0f0f0",
      borderLeft: "2px dashed #ccc",
      borderRadius: "4px",
      color: "#555",
      fontStyle: "italic",
    },
    spinner: {
      animation: "spin 2s linear infinite",
      marginRight: "0.5rem",
    },
  };

  return (
    <div style={styles.container}>
      <FaSpinner style={styles.spinner} />
      <span>{message}</span>
    </div>
  );
}

export default LoadingIndicator;

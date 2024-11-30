// frontend/src/components/NewResponseModal.js

import React from "react";

function NewResponseModal({
  newResponseModel,
  setNewResponseModel,
  handleNewResponse,
  closeModal,
  loading,
}) {
  const styles = {
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "1rem",
      borderRadius: "0.25rem",
      width: "300px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    formGroup: {
      marginBottom: "1rem",
    },
    select: {
      marginLeft: "0.5rem",
      padding: "0.25rem",
      fontSize: "1rem",
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
    },
    button: (bgColor) => ({
      padding: "0.5rem 1rem",
      backgroundColor: bgColor,
      color: "#fff",
      border: "none",
      borderRadius: "0.25rem",
      cursor: "pointer",
    }),
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h4>Select Model for New Response</h4>
        <div style={styles.formGroup}>
          <label>
            Select Model:
            <select
              value={newResponseModel}
              onChange={(e) => setNewResponseModel(e.target.value)}
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
        <div style={styles.buttonGroup}>
          <button
            onClick={handleNewResponse}
            style={styles.button("#007BFF")}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          <button
            onClick={closeModal}
            style={styles.button("#6c757d")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewResponseModal;

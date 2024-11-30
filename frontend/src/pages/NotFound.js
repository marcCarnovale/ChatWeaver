// frontend/src/pages/NotFound.js

import React from "react";

function NotFound() {
  return (
    <div style={styles.container}>
      <h2>404: Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    textAlign: "center",
  },
};

export default NotFound;

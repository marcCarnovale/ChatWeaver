// frontend/src/components/StarRating.js

import React, { useState, useEffect} from "react";

function StarRating({ initialRating = 2, onRate }) {
  const [rating, setRating] = useState(initialRating);
  const[error, setError] = useState(null);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handleRating = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  };

  return (
    <div className="star-rating" style={styles.starRating}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={i < rating ? styles.activeStar : styles.inactiveStar}
          onClick={() => handleRating(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const styles = {
  starRating: {
    display: "flex",
    gap: "0.25rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  activeStar: {
    color: "#f39c12",
    fontSize: "1.2rem",
  },
  inactiveStar: {
    color: "#ccc",
    fontSize: "1.2rem",
  },
};

export default StarRating;

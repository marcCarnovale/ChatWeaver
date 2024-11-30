// frontend/src/components/Breadcrumbs.js

import React from "react";
import { useLocation, Link, useParams } from "react-router-dom";

function Breadcrumbs() {
  const location = useLocation();
  const { categoryId, threadId } = useParams();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav style={styles.breadcrumbs}>
      <ul style={styles.breadcrumbList}>
        <li>
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          let displayName = decodeURIComponent(value);

          // Replace IDs with meaningful names if possible
          if (value === "categories" && pathnames[index + 1]) {
            displayName = "Category";
          } else if (value === "threads" && pathnames[index + 1]) {
            displayName = "Thread";
          }

          return (
            <li key={to}>
              <span style={styles.separator}>/</span>
              {isLast ? (
                <span>{displayName}</span>
              ) : (
                <Link to={to}>{displayName}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const styles = {
  breadcrumbs: {
    padding: "0.5rem 1rem",
    backgroundColor: "#e9ecef",
  },
  breadcrumbList: {
    listStyle: "none",
    display: "flex",
    gap: "0.5rem",
    margin: 0,
    padding: 0,
    fontSize: "0.9rem",
  },
  separator: {
    margin: "0 0.5rem",
  },
};

export default Breadcrumbs;

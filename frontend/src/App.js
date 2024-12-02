// frontend/src/App.js

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import ThreadView from "./pages/ThreadView";
import SavedComments from "./pages/SavedComments";
import NotFound from "./pages/NotFound";
import CategoryView from "./pages/CategoryView";
import ThreadDetailView from "./pages/ThreadDetailView"; // New Import

import { Link } from "react-router-dom";
import Breadcrumbs from "./components/Breadcrumbs";
import RetrievedContextSidebar from "./components/RetrievedContextSidebar"; // Import the sidebar

function App() {
  return (
    <Router>
      <div style={styles.appContainer}>
        <RetrievedContextSidebar /> {/* Render the sidebar */}
        <div style={styles.mainContent}>
          <nav style={styles.nav}>
            <ul style={styles.navList}>
              <li style={styles.navItem}><Link to="/">Home</Link></li>
              <li style={styles.navItem}><Link to="/saved-comments">Saved Comments</Link></li>
            </ul>
          </nav>
          <Breadcrumbs />
          <Routes>
            {/* <Route path="/" element={<ThreadView />} /> */}
            <Route path="/categories/:categoryId" element={<CategoryView />} />
            <Route path="/threads/:threadId" element={<ThreadDetailView />} /> {/* New Route */}
            <Route path="/saved-comments" element={<SavedComments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: "25%",
    padding: "1rem",
    borderRight: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    boxSizing: "border-box",
  },
  mainContent: {
    flex: 1,
    padding: "1rem",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  nav: {
    backgroundColor: "#f8f8f8",
    padding: "1rem",
    borderBottom: "1px solid #ddd",
    marginBottom: "1rem",
  },
  navList: {
    listStyle: "none",
    display: "flex",
    gap: "1rem",
    margin: 0,
    padding: 0,
  },
  navItem: {
    fontSize: "1.1rem",
  },
};

export default App;

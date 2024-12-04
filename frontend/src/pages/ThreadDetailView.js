// frontend/src/pages/ThreadDetailView.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CommentThread from "../components/CommentThread";
import CreateCommentForm from "../components/CreateCommentForm";
import axios from "../utils/axiosConfig";

function ThreadDetailView() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [rootCommentId, setRootCommentId] = useState(null);
  const [rootComment, setRootComment] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Function to build a tree from a flat comments list
  const buildCommentsTree = (comments) => {
    const commentMap = {};
    const roots = [];

    // Initialize the map with comments and empty replies
    comments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Populate the replies based on parent_id
    comments.forEach((comment) => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
      } else {
        roots.push(commentMap[comment.id]); // No parent means it's a root-level comment
      }
    });

    return roots;
  };

  // Fetch thread details and comments, then build the tree
  useEffect(() => {
    const fetchThreadAndComments = async () => {
      setLoading(true);
      try {
        // Fetch thread details
        const threadResponse = await axios.get(`/threads/${threadId}`);
        setThread(threadResponse.data);

        // Extract rootCommentId from thread data
        const rootId = threadResponse.data.root_comment_id;
        setRootCommentId(rootId);

        // Fetch all comments for the thread (including nested replies)
        const commentsResponse = await axios.get(`/threads/${threadId}/comments`);
        const commentsList = commentsResponse.data;

        // Build the comments tree
        const commentsTree = buildCommentsTree(commentsList);

        // Find the root comment in the tree
        const root = commentsTree.find((comment) => comment.id === rootId);
        if (root) {
          setRootComment(root);
          setComments(root.replies || []); // Set comments to root's replies
        } else {
          // If no root comment found, treat all top-level comments as roots
          setRootComment(null);
          setComments(commentsTree);
        }
      } catch (err) {
        console.error("Error fetching thread or comments:", err);
        // Extract error message correctly
        let errorMessage = "Failed to load thread or comments.";
        if (err.response && err.response.data) {
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (Array.isArray(err.response.data)) {
            // Handle validation errors
            errorMessage = err.response.data.map(item => item.msg).join(", ");
          }
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchThreadAndComments();
  }, [threadId]);

  // Handle adding new comments or AI responses
  // Helper function to find and update a comment in the tree
  const updateCommentInTree = (commentsList, newComment) => {
    return commentsList.map((comment) => {
      if (comment.id === newComment.id) {
        // Update the existing comment
        return {
          ...comment,
          ...newComment,
        };
      } else if (comment.replies?.length) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, newComment),
        };
      }
      return comment;
    });
  };

  // Helper function to check if a comment exists in the tree
  const commentExistsInTree = (commentsList, commentId) => {
    for (let comment of commentsList) {
      if (comment.id === commentId) return true;
      if (comment.replies?.length) {
        if (commentExistsInTree(comment.replies, commentId)) return true;
      }
    }
    return false;
  };

  const handleCommentCreated = (newComment) => {
    setComments((prevComments) => {
      const exists = commentExistsInTree(prevComments, newComment.id);

      if (exists) {
        // Update the existing comment
        return updateCommentInTree(prevComments, newComment);
      } else {
        // Add new comment
        if (newComment.parent_id === rootCommentId) {
          // If the new comment is a direct reply to the root, add it to top-level comments
          return [...prevComments, newComment];
        } else {
          // Otherwise, find the parent comment and add the reply recursively
          const addReply = (commentsList) =>
            commentsList.map((comment) => {
              if (comment.id === newComment.parent_id) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                };
              } else if (comment.replies?.length) {
                return {
                  ...comment,
                  replies: addReply(comment.replies),
                };
              }
              return comment;
            });

          return addReply(prevComments);
        }
      }
    });
  };

  // Handle comment deletion
  const handleCommentDeleted = (deletedCommentId) => {
    const removeComment = (commentsList) =>
      commentsList
        .filter((comment) => comment.id !== deletedCommentId)
        .map((comment) => ({
          ...comment,
          replies: removeComment(comment.replies || []),
        }));

    setComments((prevComments) => removeComment(prevComments));
  };

  if (loading) return <p>Loading thread and comments...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>
      {/* Root Comment as Main Post */}
      {rootComment && (
        <div style={styles.rootCommentContainer}>
          <h1>{thread.title}</h1> {/* Changed from 'thread.name' to 'thread.title' */}
          <p>{thread.description}</p>
          <p>{rootComment.text}</p>
        </div>
      )}

      {/* Comments Section */}
      <div style={styles.commentsSection}>
        <h3>Comments</h3>
        <CreateCommentForm
          threadId={threadId}
          rootCommentId={rootCommentId}
          onCommentCreated={handleCommentCreated}
        />
        {comments.length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onCommentDeleted={handleCommentDeleted}
              onCommentCreated={handleCommentCreated}
            />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
  },
  rootCommentContainer: {
    marginBottom: "2rem",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  commentsSection: {
    marginTop: "2rem",
  },
  error: {
    color: "red",
  },
};

export default ThreadDetailView;

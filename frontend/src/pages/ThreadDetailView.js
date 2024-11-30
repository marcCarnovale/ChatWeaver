// frontend/src/pages/ThreadDetailView.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CommentThread from "../components/CommentThread";
import CreateCommentForm from "../components/CreateCommentForm";
import axios from "../utils/axiosConfig";

function ThreadDetailView() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch thread details and comments on mount or when threadId changes
  useEffect(() => {
    const fetchThreadAndComments = async () => {
      setLoading(true);
      try {
        // Fetch thread details
        const threadsResponse = await axios.get(`/threads/${threadId}`);
        setThread(threadsResponse.data);

        // Fetch nested comments
        const commentsResponse = await axios.get(`/get-comments/${threadId}`);
        setComments(commentsResponse.data);
      } catch (err) {
        console.error("Error fetching thread or comments:", err);
        const message =
          err.response && err.response.data && err.response.data.detail
            ? err.response.data.detail
            : "Failed to load thread or comments.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (threadId) {
      fetchThreadAndComments();
    }
  }, [threadId]);

  // Function to handle adding new comments or AI responses
  const handleCommentCreated = (newComment) => {
    setComments((prevComments) => {
      if (newComment.isTemporary) {
        // Add the temporary comment at the appropriate place (top-level or nested)
        return prevComments.map((comment) => {
          // If this is the parent, add the temporary comment to its replies
          if (comment.id === newComment.parent_id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment; // Return unchanged comments
        });
      } else if (newComment.tempId) {
        // Replace the temporary comment with the actual AI response
        return prevComments.map((comment) => {
          // Check if the temporary comment is in top-level comments
          if (comment.id === newComment.tempId) {
            return {
              ...newComment, // Replace with the AI response
              isTemporary: false, // Ensure it's no longer marked as temporary
            };
          }
          // Check if the temporary comment is inside replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === newComment.tempId
                  ? {
                      ...newComment, // Replace with the AI response
                      isTemporary: false,
                    }
                  : reply
              ),
            };
          }
          return comment;
        });
      } else if (newComment.parent_id) {
        // Add the new comment as a reply to its parent
        return prevComments.map((comment) =>
          comment.id === newComment.parent_id
            ? {
                ...comment,
                replies: [...(comment.replies || []), newComment],
              }
            : comment
        );
      } else {
        // Add a regular top-level comment
        return [...prevComments, newComment];
      }
    });
  };
  
  
  
  const replaceTemporaryComment = (commentsList, tempId, actualComment) =>
    commentsList.map((comment) => {
      if (comment.id === tempId) {
        return { ...actualComment, replies: comment.replies || [] };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: replaceTemporaryComment(
            comment.replies,
            tempId,
            actualComment
          ),
        };
      }
      return comment;
    });
  
  const addReplyToComments = (commentsList, newReply) =>
    commentsList.map((comment) => {
      if (comment.id === newReply.parent_id) {
        return {
          ...comment,
          replies: [...(comment.replies || []), { ...newReply, replies: [] }],
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComments(comment.replies, newReply),
        };
      }
      return comment;
    });
  

  // Function to handle deletion of comments
  const handleCommentDeleted = (deletedCommentId) => {
    console.log("Deleting comment with ID:", deletedCommentId); // Debugging
    // Recursively remove the deleted comment from the comments tree
    const removeComment = (commentsList) => {
      return commentsList.filter((comment) => {
        if (comment.id === deletedCommentId) {
          return false;
        }
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = removeComment(comment.replies);
        }
        return true;
      });
    };

    setComments(removeComment(comments));
  };

  if (loading) return <p>Loading thread and comments...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2>Thread: {thread.name}</h2>
      <p>{thread.description}</p>
      <div style={styles.commentsSection}>
        <h3>Comments</h3>
        {comments.length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onCommentDeleted={handleCommentDeleted}
            />
          ))
        )}
      </div>
      <CreateCommentForm threadId={threadId} onCommentCreated={handleCommentCreated} />
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
  },
  commentsSection: {
    marginTop: "2rem",
  },
  error: {
    color: "red",
  },
};

export default ThreadDetailView;

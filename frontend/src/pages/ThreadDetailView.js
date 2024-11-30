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
    if (newComment.remove) {
      // Remove the temporary comment in case of an error
      setComments((prevComments) =>
        removeTemporaryComment(prevComments, newComment.id)
      );
      return;
    }
  
    if (newComment.isTemporary) {
      setComments((prevComments) => [...prevComments, newComment]);
    } else if (newComment.tempId) {
      setComments((prevComments) =>
        replaceTemporaryComment(prevComments, newComment.tempId, newComment)
      );
    } else {
      // Regular comment or AI response without tempId
      if (!newComment.parent_id) {
        // Top-level comment
        setComments((prevComments) => [
          ...prevComments,
          { ...newComment, replies: [] },
        ]);
      } else {
        // Reply to an existing comment
        setComments((prevComments) =>
          addReplyToComments(prevComments, newComment)
        );
      }
    }
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

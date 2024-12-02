import axios from "./axiosConfig";

// Helper function to update the comment tree
function replaceCommentInTree(comments, commentId, updatedComment) {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      // Replace the comment
      return { ...comment, ...updatedComment };
    }
    if (comment.replies?.length) {
      // Recursively update replies
      return {
        ...comment,
        replies: replaceCommentInTree(comment.replies, commentId, updatedComment),
      };
    }
    return comment;
  });
}

export const handleNewResponse = async ({
  threadId,
  parentId,
  newResponseModel,
  onCommentCreated,
  setReplies,
  setLoading,
  setError,
}) => {
  if (newResponseModel === "None") {
    setError("Please select a model.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const [modelType, modelName] = newResponseModel.split(" ", 2);

    if (!modelType || !modelName) {
      setError("Invalid model selection.");
      return;
    }

    const generateResponsePayload = {
      model_type: modelType.toLowerCase(),
      model_name: modelName.toLowerCase(),
    };

    console.log("Payload for /generate-response:", generateResponsePayload);

    // Create a placeholder comment
    const placeholderResponse = await axios.post(`/threads/${threadId}/comments`, {
      parent_id: parentId,
      text: "Thinking...",
    });

    // Convert to camelCase if necessary
    const placeholderComment = { ...placeholderResponse.data, replies: [] };
    console.log("Placeholder Comment:", placeholderComment);

    // Add the placeholder comment to the replies
    if (setReplies) {
      setReplies((prevReplies) => {
        const alreadyExists = prevReplies.some((c) => c.id === placeholderComment.id);
        return alreadyExists ? prevReplies : [...prevReplies, placeholderComment];
      });
    }

    if (onCommentCreated) {
      onCommentCreated(placeholderComment);
    }

    // Generate response and overwrite the placeholder
    console.log("Sending request with placeholderComment.id", placeholderComment.id);

    const aiResponse = await axios.post(
      `/threads/${threadId}/generate-response`,
      generateResponsePayload,
      { params: { request_comment_id: placeholderComment.id, parent_comment_id: placeholderComment.parent_id } } // Fixed field name
    );

    const updatedComment = {
      ...placeholderComment,
      text: aiResponse.data.text,
      model_name: modelName,
      flags: aiResponse.data.flags,
      approvals: aiResponse.data.approvals,
    };

    // Update the placeholder comment in the replies
    if (setReplies) {
      setReplies((prevReplies) => replaceCommentInTree(prevReplies, placeholderComment.id, updatedComment));
    }

    if (onCommentCreated) {
      onCommentCreated(updatedComment);
    }
  } catch (err) {
    console.error("Error generating new AI response:", err);

    if (err.response?.data) {
      console.error("API Error Response:", err.response.data);
    }

    let errorMessage = "Failed to generate AI response.";
    if (err.response?.data?.detail) {
      if (typeof err.response.data.detail === "string") {
        errorMessage = err.response.data.detail;
      } else if (Array.isArray(err.response.data.detail)) {
        errorMessage = err.response.data.detail.map((d) => d.msg || d).join(", ");
      } else if (typeof err.response.data.detail === "object") {
        errorMessage = JSON.stringify(err.response.data.detail);
      }
    }

    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

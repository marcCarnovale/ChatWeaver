import axios from "./axiosConfig";

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

    // Create a placeholder comment
    const placeholderResponse = await axios.post(`/threads/${threadId}/comments`, {
      parent_id: parentId,
      text: "Thinking...",
    });

    const placeholderComment = { ...placeholderResponse.data, replies: [] };

    if (setReplies) {
      setReplies((prevReplies) => [...prevReplies, placeholderComment]);
    }

    if (onCommentCreated) {
      onCommentCreated(placeholderComment);
    }

    // Generate response and overwrite the placeholder
    const aiResponse = await axios.post(
      `/threads/${threadId}/generate-response`,
      generateResponsePayload,
      { params: { parent_comment_id: placeholderComment.id } }
    );

    const updatedComment = {
      ...aiResponse.data,
      replies: placeholderComment.replies,
      model_name: modelName,
    };

    if (setReplies) {
      setReplies((prevReplies) =>
        prevReplies.map((reply) =>
          reply.id === placeholderComment.id ? updatedComment : reply
        )
      );
    }

    if (onCommentCreated) {
      onCommentCreated(updatedComment);
    }
  } catch (err) {
    console.error("Error generating new AI response:", err);
    setError(err.response?.data?.detail || "Failed to generate AI response.");
  } finally {
    setLoading(false);
  }
};

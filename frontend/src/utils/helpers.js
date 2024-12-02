// frontend/src/utils/helpers.js

export const handleApiError = (err, setError, defaultMessage) => {
    console.error(err);
    const message =
      err.response?.data?.detail || defaultMessage || "An error occurred.";
    setError(message);
  };
  
  export const autoClearError = (error, setError, timeout = 5000) => {
    if (error) {
      const timer = setTimeout(() => setError(null), timeout);
      return () => clearTimeout(timer);
    }
  };
  

  
  /**
 * Recursively builds a hierarchical structure from a dictionary of comments.
 * @param {Object} commentMap - A dictionary of comments keyed by their IDs.
 * @param {number|null} rootId - The ID of the root comment (null for top-level comments).
 * @returns {Array} A nested array of comments with replies.
 */
export function buildCommentHierarchy(commentMap, rootId = null) {
  const result = [];
  Object.values(commentMap).forEach((comment) => {
    if (comment.parent_id === rootId) {
      result.push({
        ...comment,
        replies: buildCommentHierarchy(commentMap, comment.id),
      });
    }
  });
  return result;
}

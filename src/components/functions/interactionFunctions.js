// Fetch listing comments
export const handleFetchComments = async (listingId, setItems) => {
  const api =
    process.env.NODE_ENV === "production"
      ? `https://cristaosbackend.onrender.com/api/comments/listings/${listingId}/comments`
      : `http://localhost:5001/api/comments/listings/${listingId}/comments`; // Use local API in development

  try {
    const response = await fetch(api, {
      method: "GET",
      credentials: "include", // Include credentials if needed
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("Comments fetched:", data);

    // Update the items array with the fetched comments, including replies
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === listingId ? { ...item, comments: data.comments } : item
      )
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};

// Handle top-level comment submission
// function to handle comment submission
export const handleCommentSubmit = async (
  listingId,
  commentText,
  currentUser,
  setItems = null // Optional parameter for updating items in Listings.js
) => {
  console.log("submiting new comment, IMPORTANT FOR SETTING COMMENT ID FOR LIKING")
  if (!currentUser) {
    alert("You must be logged in to comment.");
    return;
  }

  try {
    const api =
      process.env.NODE_ENV === "production"
        ? `https://cristaosbackend.onrender.com/api/comments/listings/${listingId}/comment`
        : `http://localhost:5001/api/comments/listings/${listingId}/comment`;

    const requestBody = {
      userId: currentUser._id,
      commentText,
    };

    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit comment: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Comment added successfully:", data);
    console.log("Comment added successfully with ID:", data.comment._id);


    // Conditionally update items or return the new comment
    if (setItems) {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId
            ? { ...item, comments: [...item.comments, data.comment] }
            : item
        )
      );
      // Return the new comment regardless
      return data.comment
    } else {
      return data.comment; // Return the new comment to handle it in single listing view
    }
  } catch (error) {
    console.error("Error submitting comment:", error);
    alert("Failed to submit comment. Please try again.");
  }
};


// Handle reply submission
export const handleReplySubmit = async (
  listingId,
  parentCommentId,
  replyText,
  currentUser,
  updateState
) => {
  console.log("Received in handleReplySubmit:", {
    listingId,
    parentCommentId,
    replyText,
  });
  console.log("REPLY TEXT:", replyText); // Should match the text from handleReplySubmitClick

  if (!currentUser) {
    alert("You need to be logged in to reply to a comment.");
    return;
  }

  const api =
    process.env.NODE_ENV === "production"
      ? `https://cristaosbackend.onrender.com/api/comments/listings/${parentCommentId}/reply`
      : `http://localhost:5001/api/comments/listings/${parentCommentId}/reply`;

  try {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id, listingId, replyText }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit reply: ${response.statusText}`);
    }

    const { reply } = await response.json();
    console.log("Reply from API:", reply);

    // Update state
    updateState((prevState) => {
      if (Array.isArray(prevState)) {
        console.log("Updating multiple listings...");
        return prevState.map((listing) => ({
          ...listing,
          comments: listing.comments.map((comment) =>
            comment._id === parentCommentId
              ? { ...comment, replies: [...comment.replies, reply] }
              : comment
          ),
        }));
      } else {
        console.log("Updating single listing...");
        return {
          ...prevState,
          comments: prevState.comments.map((comment) =>
            comment._id === parentCommentId
              ? { ...comment, replies: [...comment.replies, reply] }
              : comment
          ),
        };
      }
    });
  } catch (error) {
    console.error("Error submitting reply:", error);
    alert("Failed to submit reply. Please try again.");
  }
};




// handle delete comments
export const handleDeleteComment = async (
  listingId,
  commentId,
  parentCommentId = null,
  items,
  setItems
) => {
  if (!window.confirm("Are you sure you want to delete this comment?")) {
    return;
  }

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? parentCommentId
        ? `https://cristaosbackend.onrender.com/api/comments/${commentId}/${parentCommentId}`
        : `https://cristaosbackend.onrender.com/api/comments/${commentId}`
      : parentCommentId
      ? `http://localhost:5001/api/comments/${commentId}/${parentCommentId}`
      : `http://localhost:5001/api/comments/${commentId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "DELETE",
    });

    if (response.ok) {
      console.log("Comment deleted successfully.");

      // Ensure items is an array before proceeding
      if (!Array.isArray(items)) {
        console.error("Error: items is not an array");
        return;
      }

      // Update the comments state after deletion
      const newItems = items.map((item) => {
        if (item._id === listingId) {
          if (parentCommentId) {
            // Handle reply deletion
            return {
              ...item,
              comments: item.comments.map((comment) => {
                if (comment._id === parentCommentId) {
                  return {
                    ...comment,
                    replies: comment.replies.filter(
                      (reply) => reply._id !== commentId
                    ),
                  };
                }
                return comment;
              }),
            };
          } else {
            // Handle parent comment deletion
            return {
              ...item,
              comments: item.comments.filter(
                (comment) => comment._id !== commentId
              ),
            };
          }
        }
        return item;
      });

      setItems(newItems); // Update the state with the new comments structure
      alert("Comment deleted successfully.");
    } else {
      throw new Error("Failed to delete comment.");
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("Error deleting comment.");
  }
};

export const handleLike = async (listingId, currentUser, items = [], setItems) => {
  console.log("Liking listing");

  if (!currentUser) {
    alert("You must be logged in to like a listing.");
    return;
  }

  const api =
    process.env.NODE_ENV === "production"
      ? `https://cristaosbackend.onrender.com/api/listings/listingLike/${listingId}`
      : `http://localhost:5001/api/listings/listingLike/${listingId}`; // Local development URL

  try {
    const response = await fetch(api, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id }),
    });

    if (!response.ok) {
      throw new Error("Failed to update like status");
    }

    const data = await response.json();
    console.log("Like updated successfully:", data);

    if (setItems) {
      // Update the items state for Listings.js
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, likes: data.likes } : item
        )
      );
    }

    return data; // Return the updated data for further handling in Listing.js
  } catch (error) {
    console.error("Error in liking route:", error);
    throw error; // Optional: Re-throw to handle errors in the calling function
  }
};


export const handleShare = async (listingId, currentUser) => {
  if (!currentUser) {
    alert("You must be logged in to share a listing.");
    return;
  }

  const userId = currentUser._id;
  console.log("Sharing from the landing page");
  console.log("Listing ID:", listingId);
  console.log("Current User ID:", userId);

  const api =
    process.env.NODE_ENV === "production"
      ? `https://cristaosbackend.onrender.com/api/listings/share/${listingId}`
      : `http://localhost:5001/api/listings/share/${listingId}`; // Local development URL

  try {
    const response = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }), // Send the logged-in user's ID
    });

    if (!response.ok) {
      throw new Error(`Failed to share listing: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Listing shared successfully:", data);
  } catch (error) {
    console.error("Error sharing the listing:", error);
    alert("An error occurred while sharing the listing. Please try again.");
  }
};

// function to like comment
// function to like comment or reply
export const handleCommentLike = async (
  commentId,
  isReply = false,
  parentCommentId = null,
  currentUser,
  updateFunction, // State update function (setItems or setListing)
  updateCommentsFunction = null // Optional: updates only comments state
) => {
  console.log("handleCommentLike called with arguments:", {
    commentId,
    isReply,
    parentCommentId,
    currentUser,
  });

  if (!updateFunction || typeof updateFunction !== "function") {
    throw new Error("updateFunction must be a valid function.");
  }

  if (!currentUser) {
    alert("You must be logged in to like a comment or reply.");
    return;
  }

  const api =
    process.env.NODE_ENV === "production"
      ? isReply
        ? `https://cristaosbackend.onrender.com/api/comments/comment/like/${parentCommentId}/${commentId}`
        : `https://cristaosbackend.onrender.com/api/comments/comment/like/${commentId}`
      : isReply
      ? `http://localhost:5001/api/comments/comment/like/${parentCommentId}/${commentId}`
      : `http://localhost:5001/api/comments/comment/like/${commentId}`;

  console.log("Constructed API endpoint:", api);

  try {
    // Optimistic update before API call
    updateFunction((prevState) => {
      const updateReplies = (replies) =>
        (replies || []).map((reply) =>
          reply._id === commentId
            ? {
                ...reply,
                likes: reply.likes.includes(currentUser._id)
                  ? reply.likes.filter((id) => id !== currentUser._id)
                  : [...reply.likes, currentUser._id],
              }
            : reply
        );

      const updateComments = (comments) =>
        (comments || []).map((comment) => {
          if (comment._id === (isReply ? parentCommentId : commentId)) {
            return isReply
              ? { ...comment, replies: updateReplies(comment.replies) }
              : {
                  ...comment,
                  likes: comment.likes.includes(currentUser._id)
                    ? comment.likes.filter((id) => id !== currentUser._id)
                    : [...comment.likes, currentUser._id],
                };
          }
          return comment;
        });

      if (Array.isArray(prevState)) {
        // Case: Listings.js (list of items)
        return prevState.map((item) =>
          item.comments
            ? { ...item, comments: updateComments(item.comments) }
            : item
        );
      }

      if (prevState && prevState.comments) {
        // Case: listing.js (single listing)
        return {
          ...prevState,
          comments: updateComments(prevState.comments),
        };
      }

      console.warn("Unexpected state structure during optimistic update:", prevState);
      return prevState;
    });

    // Call the API to synchronize the like/unlike action
    const response = await fetch(api, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error("Failed to like/unlike comment or reply.");
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.likes)) {
      throw new Error("API response does not contain a valid likes array.");
    }

    console.log("Parsed response data:", data);

    // Synchronize state with API response
    updateFunction((prevState) => {
      const updateReplies = (replies) =>
        (replies || []).map((reply) =>
          reply._id === commentId ? { ...reply, likes: data.likes } : reply
        );

      const updateComments = (comments) =>
        (comments || []).map((comment) => {
          if (comment._id === (isReply ? parentCommentId : commentId)) {
            return isReply
              ? { ...comment, replies: updateReplies(comment.replies) }
              : { ...comment, likes: data.likes };
          }
          return comment;
        });

      if (Array.isArray(prevState)) {
        // Case: Listings.js (list of items)
        return prevState.map((item) =>
          item.comments
            ? { ...item, comments: updateComments(item.comments) }
            : item
        );
      }

      if (prevState && prevState.comments) {
        // Case: listing.js (single listing)
        return {
          ...prevState,
          comments: updateComments(prevState.comments),
        };
      }

      console.warn("Unexpected state structure during API sync:", prevState);
      return prevState;
    });

    console.log("State successfully updated after API call.");
    return data.likes;
  } catch (error) {
    alert("An error occurred while processing your request. Please try again.");
    console.error("Error in liking comment or reply:", error);
    throw error;
  }
};

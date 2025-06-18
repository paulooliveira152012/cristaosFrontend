const baseUrl = process.env.REACT_APP_API_BASE_URL

export const fetchComments = async (listingId) => {
  console.log("function to fetch comments for listing page reached");
  console.log("listingId is:", listingId);
  try {
    const response = await fetch(`${baseUrl}/api/comments/listings/${listingId}/comments`);

    if (!response.ok) {
      throw new Error(`Failed to fetch comments for listing: ${listingId}`);
    }

    const comments = await response.json();
    console.log(`Fetched comments for listing ${listingId}:`, comments);

    return comments.comments || []; // Return the comments so they can be used
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const handleLike = (listingId) => {
  console.log("handleLike pressed for listing:", listingId);
};

export const toggleShowComments = (listingId) => {
  console.log("toggle show comments for listing:", listingId);
};

export const handleShare = (listingId) => {
  console.log("handleShare pressed for listing:", listingId);
};

export const handleComment = () => {
  console.log("handleComment pressed");
};

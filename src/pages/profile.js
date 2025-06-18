import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ListingInteractionBox from "../components/ListingInteractionBox";
import "../styles/profile.css";
const imagePlaceholder = require("../assets/images/profileplaceholder.png");

const baseUrl = process.env.REACT_APP_API_BASE_URL

const Profile = () => {
  const { currentUser } = useUser();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComments] = useState([]);
  const navigate = useNavigate();

  console.log(currentUser);

  // Fetch user data and listings
  // Fetch user data and listings
  useEffect(() => {
    console.log("in profile page");

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/listings/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setUser(data.user);
          setUserListings(data.listings);
        } else {
          throw new Error("Response is not valid JSON");
        }
      } catch (error) {
        console.error(error);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // rota para buscar os comentarios
  // Fetch listing comments
  // Fetch listing comments
  const handleFetchComments = async (listingId) => {
    try {
      const response = await fetch(`${baseUrl}/api/comments/listings/${listingId}/comments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      console.log("Comments fetched:", data);

      // Update the user listings array with the fetched comments, including replies
      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, comments: data.comments } : item
        )
      );
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  console.log("User Listings: ", userListings);

  // Handle deleting a listing
  // Handle deleting a listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/listings/delete/${listingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json", // Ensure proper content type
        },
      });

      if (response.ok) {
        setUserListings((prevListings) =>
          prevListings.filter((listing) => listing._id !== listingId)
        );
        alert("Listing deleted successfully.");
      } else {
        throw new Error("Failed to delete listing.");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Error deleting listing.");
    }
  };

  // Handle top-level comment submission
  const handleCommentSubmit = async (listingId, commentText) => {
    if (!currentUser) {
      alert("You must be logged in to comment.");
      return;
    }

    const requestBody = {
      userId: currentUser._id,
      commentText,
    };

    try {
      const response = await fetch(`${baseUrl}/api/comments/listings/${listingId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      const data = await response.json();
      console.log("Comment added successfully!:", data);

      // Update comments in the listing
      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId
            ? { ...item, comments: [...item.comments, data.comment] }
            : item
        )
      );
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error submitting comment. Please try again.");
    }
  };

  // Handle like functionality in Profile
  const handleLike = async (listingId) => {
    if (!currentUser) {
      alert("You must be logged in to like a listing.");
      return;
    }

    const userId = currentUser._id;

    // Optimistically update the UI before the backend response
    const originalListings = [...userListings];
    setUserListings((prevListings) =>
      prevListings.map((listing) => {
        if (listing._id === listingId) {
          const isLiked = listing.likes.includes(userId);
          const updatedLikes = isLiked
            ? listing.likes.filter((id) => id !== userId) // Dislike
            : [...listing.likes, userId]; // Like
          return { ...listing, likes: updatedLikes };
        }
        return listing;
      })
    );

    try {
      const response = await fetch(`${baseUrl}/api/listings/listingLike/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }

      const data = await response.json();
      console.log("Like updated successfully:", data);

      // Sync backend response with the UI
      setUserListings((prevListings) =>
        prevListings.map((listing) =>
          listing._id === listingId
            ? { ...listing, likes: data.likes }
            : listing
        )
      );
    } catch (error) {
      console.error("Error in liking route:", error);
      setUserListings(originalListings); // Revert to original listings on error
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (
    listingId,
    commentId,
    parentCommentId = null
  ) => {
    console.log("delete function called");
    console.log("listingId:", listingId);
    console.log("commentId:", commentId);
    console.log("parentCommentId:", parentCommentId);

    if (parentCommentId) {
      console.log("It is a reply with parentCommentId:", parentCommentId);
    } else {
      console.log("It is a top-level comment");
    }

    const apiUrl =
      process.env.NODE_ENV === "production"
        ? parentCommentId
          ? `${baseUrl}/api/comments/${commentId}/${parentCommentId}` // Delete reply
          : `${baseUrl}/api/comments/${commentId}` // Delete parent comment
        : parentCommentId
        ? `${baseUrl}/comments/${commentId}/${parentCommentId}` // Delete reply (local dev)
        : `${baseUrl}/api/comments/${commentId}`; // Delete parent comment (local dev)

    try {
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment.");
      }

      const data = await response.json();
      console.log("Comment deleted:", data);

      // Update the comments state after deletion
      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId
            ? {
                ...item,
                comments: item.comments.filter(
                  (comment) =>
                    comment._id !== commentId &&
                    (!parentCommentId ||
                      comment.replies.every((reply) => reply._id !== commentId))
                ),
              }
            : item
        )
      );

      alert("Comment deleted successfully.");
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error deleting comment.");
    }
  };

  if (loading) return <p className="profile-loading">Loading profile...</p>;
  if (error) return <p className="profile-error">{error}</p>;

  // Helper function to limit to 300 words and preserve paragraphs
  const getExcerptWithParagraphs = (content) => {
    const words = content.split(" ");
    let truncatedContent = content;

    // If the blog content has more than 300 words, truncate it
    if (words.length > 300) {
      truncatedContent = words.slice(0, 50).join(" ");
    }

    // Split by newlines and wrap each paragraph with <p> tags
    return truncatedContent.split("\n").map((paragraph, index) => (
      <p key={index} className="blogContent">
        {paragraph}
      </p>
    ));
  };

  // Handle reply submission
  // Handle reply submission
  const handleReplySubmit = async (parentCommentId, replyText) => {
    if (!currentUser) {
      alert("You need to be logged in to reply to a comment.");
      return;
    }

    console.log("trying to submit a reply");

    const requestBody = {
      userId: currentUser._id,
      replyText,
    };

    try {
      const response = await fetch(`${baseUrl}/api/comments/listings/${parentCommentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to submit reply.");
      }

      const data = await response.json();
      console.log("Reply added successfully:", data);

      // Update the comments state to include the new reply
      setUserListings((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          comments: item.comments.map((comment) =>
            comment._id === parentCommentId
              ? { ...comment, replies: [...comment.replies, data.reply] }
              : comment
          ),
        }))
      );
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Error submitting reply. Please try again.");
    }
  };

  // Inside Listings.js (or parent component)
  // Inside Listings.js (or parent component)
  const handleCommentLike = async (
    commentId,
    isReply = false,
    parentCommentId = null
  ) => {
    console.log("Liking/unliking a comment or reply");

    if (!currentUser) {
      alert("You must be logged in to like a comment or reply.");
      return;
    }

    console.log("Attempting to like/unlike comment");
    console.log("isReply:", isReply);
    console.log("commentId:", commentId);
    console.log("parentCommentId:", parentCommentId);

    const api =
      process.env.NODE_ENV === "production"
        ? isReply
          ? `${baseUrl}/api/comments/comment/like/${parentCommentId}/${commentId}`
          : `${baseUrl}/api/comments/comment/like/${commentId}`
        : isReply
        ? `${baseUrl}/api/comments/comment/like/${parentCommentId}/${commentId}`
        : `${baseUrl}/api/comments/comment/like/${commentId}`; // Local development URL

    try {
      const response = await fetch(api, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to like/unlike comment or reply");
      }

      const data = await response.json();
      console.log("Comment or reply like status updated:", data);

      // Update the likes for comments or replies
      setUserListings((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          comments: item.comments.map((comment) => {
            if (comment._id === (isReply ? parentCommentId : commentId)) {
              if (isReply) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply._id === commentId
                      ? { ...reply, likes: data.likes }
                      : reply
                  ),
                };
              } else {
                return { ...comment, likes: data.likes };
              }
            }
            return comment;
          }),
        }))
      );
    } catch (error) {
      console.error("Error in liking comment or reply:", error);
    }
  };

  // handle share
  // handle share
  const handleShare = async (listingId) => {
    const userId = currentUser._id; // Logged-in user's ID
    console.log("Sharing from landing page");
    console.log("Listing ID:", listingId);
    console.log("Current User ID:", userId);

    try {
      const response = await fetch(`${baseUrl}/api/listings/share/${listingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }), // Send the logged-in user's ID
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Listing shared successfully:", data);
      } else {
        console.error("Error sharing the listing:", data.message);
      }
    } catch (error) {
      console.error("Error sharing the listing:", error);
    }
  };

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div className="profile-container">
        <div
          className="ProfileProfileImage"
          style={{
            backgroundImage: `url(${user?.profileImage || imagePlaceholder})`,
            backgroundPosition: "center",
          }}
        ></div>

        <div className="profile-header">
          <h2 className="profile-username">{user.username}</h2>
        </div>
        <div className="profile-listings">
          {userListings.length > 0 ? (
            userListings.map((listing) => (
              <div key={listing._id} className="profile-listing-item">
                {/* check listing type and render appropriately */}

                {/* if listing is an image */}
                {listing.type === "image" && listing.imageUrl && (
                  <Link
                    to={`/openListing/${listing._id}`}
                    className="profile-listing-link"
                  >
                    {listing.imageUrl && (
                      <img
                        src={listing.imageUrl}
                        alt="Listing"
                        className="profile-listing-image"
                      />
                    )}
                  </Link>
                )}

                {/* if listing is a blog */}
                {listing.type === "blog" && (
                  <Link
                    to={`/openListing/${listing._id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="listing-content">
                      <h2>{listing.blogTitle || "Untitled Blog"}</h2>
                      <p
                        style={{ textDecoration: "none", textAlign: "justify" }}
                      >
                        {listing.blogContent
                          ? listing.blogContent.split(" ").length > 100
                            ? listing.blogContent
                                .split(" ")
                                .slice(0, 100)
                                .join(" ") + "..."
                            : listing.blogContent
                          : "No content available."}
                      </p>
                      {/*  */}

                      <img
                        src={listing.imageUrl}
                        alt={`Listing image ${listing._id}`}
                        className="listingImage"
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          height: "auto",
                          backgroundColor: "red",
                        }}
                      />
                    </div>
                  </Link>
                )}

                {/* if listing is a poll */}
                {listing.type === "poll" && listing.poll && (
                  <div className="poll-container">
                    <h2>{listing.poll.question}</h2>
                    <ul>
                      {listing.poll.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="listing-link">
                  <a
                    href={listing.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {listing.link}
                  </a>
                </div>

                <ListingInteractionBox
                  listingId={listing._id}
                  handleLike={() => handleLike(listing._id)}
                  likesCount={listing.likes.length}
                  comments={listing.comments || []}
                  commentsCount={listing.comments ? listing.comments.length : 0}
                  isLiked={
                    currentUser
                      ? listing.likes.includes(currentUser._id)
                      : false
                  }
                  handleCommentSubmit={handleCommentSubmit}
                  handleReplySubmit={handleReplySubmit}
                  handleDeleteComment={handleDeleteComment}
                  handleDeleteListing={handleDeleteListing}
                  currentUser={currentUser}
                  commentLikesCount={(comment) =>
                    comment.likes ? comment.likes.length : 0
                  }
                  isCommentLiked={(comment) =>
                    comment.likes && Array.isArray(comment.likes)
                      ? comment.likes.includes(currentUser._id)
                      : false
                  }
                  commentCommentsCount={(comment) =>
                    comment.replies ? comment.replies.length : 0
                  }
                  handleFetchComments={handleFetchComments}
                  setItems={setUserListings} //Use userListings
                  handleCommentLike={handleCommentLike}
                  showDeleteButton={true}
                  handleShare={handleShare}
                  userId={userId}
                />
              </div>
            ))
          ) : (
            <p className="profile-no-listings">
              No listings available for {user.username}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

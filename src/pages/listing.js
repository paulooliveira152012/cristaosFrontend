import "../styles/listing.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ListingInteractionBox from "../components/ListingInteractionBox";
import { useUser } from "../context/UserContext";

import {
  handleFetchComments,
  handleCommentSubmit,
  handleReplySubmit,
  handleDeleteComment,
  handleLike,
  handleShare,
  handleCommentLike,
} from "../components/functions/interactionFunctions";

const ListingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { id: listingId } = useParams();

  const [items, setItems] = useState([]); // Use items array with one listing for consistency
  const [loading, setLoading] = useState(true);
  const [newCommentId, setNewCommentId] = useState("");

  // Fetch the single listing as the first item in the items array
  useEffect(() => {
    const fetchListingData = async () => {
      try {
        const api =
          process.env.NODE_ENV === "production"
            ? `https://cristaosweb-e5a94083e783.herokuapp.com/api/listings/listings/${listingId}`
            : `http://localhost:5001/api/listings/listings/${listingId}`;

        const response = await fetch(api);
        if (!response.ok) {
          const errorText = await response.text(); // Capture error details
          console.error("API Error Details:", errorText); // Log for more insight
          throw new Error(`Failed to fetch listing with id: ${listingId}`);
        }

        const data = await response.json();
        setItems([data.listing]); // Wrap the single listing in an array
      } catch (error) {
        console.error("Error fetching listing details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [listingId]);

  // Helper function to update the single listing
  const updateListing = (updatedListing) => {
    setItems([updatedListing]);
  };

  const fetchCommentsForListing = (listingId) => {
    handleFetchComments(listingId, setItems);
  };

  const submitCommentForListing = async (listingId, commentText) => {
    try {
      // Submit the comment and wait for backend response
      const newComment = await handleCommentSubmit(
        listingId,
        commentText,
        currentUser
      );
  
      if (newComment) {
        setNewCommentId(newComment._id);
  
        // Fetch the updated listing from the backend
        const api =
          process.env.NODE_ENV === "production"
            ? `https://cristaosweb-e5a94083e783.herokuapp.com/api/listings/listings/${listingId}`
            : `http://localhost:5001/api/listings/listings/${listingId}`;
  
        const response = await fetch(api);
  
        if (!response.ok) {
          throw new Error(`Failed to fetch updated listing: ${response.statusText}`);
        }
  
        const data = await response.json();
        setItems([data.listing]); // Update the items array with the latest backend state
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    }
  };
  

  const submitReplyForComment = (listingId, parentCommentId, replyText) => {
    if (!currentUser) {
      alert("You must be logged in to reply.");
      return;
    }

    handleReplySubmit(listingId, parentCommentId, replyText, currentUser, setItems);
  };

  const deleteCommentForListing = (listingId, commentId, parentCommentId) => {
    handleDeleteComment(listingId, commentId, parentCommentId, items, setItems);
  };

  const likeListing = (listingId) => {
    handleLike(listingId, currentUser, items, setItems);
  };

  const shareListing = (listingId) => {
    handleShare(listingId, currentUser);
  };

  const likeCommentOrReply = async (
    commentId,
    isReply = false,
    parentCommentId = null
  ) => {
    const targetCommentId = commentId || newCommentId;

    if (!targetCommentId) {
      console.error("Comment ID is undefined, cannot like the comment.");
      return;
    }

    try {
      await handleCommentLike(
        targetCommentId,
        isReply,
        parentCommentId,
        currentUser,
        setItems
      );
    } catch (error) {
      console.error("Error in liking comment or reply:", error);
    }
  };

  if (loading) return <p>Loading listing details...</p>;
  if (items.length === 0) return <p>Listing not found.</p>;

  const listing = items[0];

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div style={{ paddingBottom: "70px" }}>
        <div className="listing-page-container">
          <div className="listing-header">
            <h1>{listing.blogTitle || ""}</h1>
          </div>

          {listing.type === "blog" && (
            <div className="listing-content">
              {listing.blogContent
                ? listing.blogContent.split("\n").map((paragraph, index) => (
                    <p key={index} className="blogContent">
                      {paragraph}
                    </p>
                  ))
                : "No content available for this blog."}
              {listing.imageUrl && (
                <img
                  src={listing.imageUrl}
                  alt={`Listing image ${listing._id}`}
                  className="listingImage"
                  style={{ width: "100%", maxWidth: "100%", height: "auto" }}
                />
              )}
            </div>
          )}

          {listing.type === "image" && listing.imageUrl && (
            <div className="listing-image-container">
              <img
                src={listing.imageUrl}
                alt={`Listing image ${listing._id}`}
                className="listingImage"
                style={{ width: "100%", maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}

          <ListingInteractionBox
            listingId={listing._id}
            currentCommentId={newCommentId}
            likesCount={listing.likes.length}
            comments={listing.comments || []}
            commentsCount={listing.comments ? listing.comments.length : 0}
            isLiked={
              currentUser ? listing.likes.includes(currentUser._id) : false
            }
            currentUser={currentUser}
            isSingleListing={true}
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
            handleFetchComments={fetchCommentsForListing}
            handleCommentSubmit={submitCommentForListing}
            handleReplySubmit={submitReplyForComment}
            handleDeleteComment={deleteCommentForListing}
            handleLike={likeListing}
            handleShare={shareListing}
            handleCommentLike={likeCommentOrReply}
            setItems={setItems}
            updateListing={updateListing}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ListingPage;

import {
  handleFetchComments,
  handleCommentSubmit,
  handleReplySubmit,
  handleDeleteComment,
  handleLike,
  handleShare,
  handleCommentLike,
} from "./functions/interactionFunctions";
import "../styles/listings.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import profileplaceholder from "../assets/images/profileplaceholder.png";
// importando o componente de interação
import ListingInteractionBox from "./ListingInteractionBox";
import { useUser } from "../context/UserContext";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const Listings = () => {
  const { currentUser } = useUser(); // Access the current user
  const [items, setItems] = useState([]); // Store the listings
  const [loading, setLoading] = useState(true); // Track loading state
  const [comment, setComments] = useState([]);
  // listingId when creating new comment to be available when liking new comments
  const [newCommentId, setNewCommentId] = useState("");
  const [openLeaderMenuId, setOpenLeaderMenuId] = useState(null);
  const [sharedListings, setSharedListings] = useState([]);

  // Logging whenever newCommentId changes
  useEffect(() => {
    console.log("trying to fetch the newCommentId");

    if (newCommentId) {
      console.log("New Comment ID set in state:", newCommentId);
    }
  }, [newCommentId]); // This will log the newCommentId each time it changes.

  // Fetch all listed items from the backend
  useEffect(() => {
    console.log("✅ BUSCANDO ITENS");
    const fetchListings = async () => {
      const api = `${baseURL}/api/listings/alllistings`;

      console.log("✅✅ api usada:", api);
      try {
        setLoading(true); // Start loading before fetch
        const response = await fetch(api, {
          method: "GET",
          credentials: "include", // Include credentials (cookies, etc.)
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("✅");

        if (!response.ok) {
          console.log("✅ erro aqui => :", response.statusText);
          throw new Error(`Error fetching listings: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Items received:", data);

        // Sort listings by creation date
        const sortedListings = (data.listings || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setItems(sortedListings);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false); // Stop loading when the fetch is complete
      }
    };

    fetchListings();
  }, []); // Empty dependency array to run only once after the component mounts

  // Use handleFetchComments, passing in setItems to manage comments
  const fetchCommentsForListing = (listingId) => {
    handleFetchComments(listingId, setItems);
  };

  // Use `handleCommentSubmit`, passing required parameters
  const submitCommentForListing = async (listingId, commentText) => {
    console.log("submiting new comment");

    try {
      /* 
        create new variable storing value from function call handleCommentSubmit
        handleCommentSubmit is defined on interactionFunctions.js
      */
      const newComment = await handleCommentSubmit(
        listingId,
        commentText,
        currentUser,
        setItems
      );

      console.log("newComment:", newComment);
      // console.log("New Comment id is:", newComment._id)

      if (newComment && newComment._id) {
        console.log("Setting New Comment ID:", newComment._id);
        // Set the latest comment's ID for liking
        setNewCommentId(newComment._id);
        console.log("newCommentId:", newCommentId);

        console.log(listingId);

        // Optimistically update the comments array
        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item._id === listingId) {
              const alreadyExists = item.comments.some(
                (comment) => comment._id === newComment._id
              );

              return alreadyExists
                ? item
                : { ...item, comments: [...item.comments, newComment] };
            }
            return item;
          })
        );
      } else {
        console.log("no newCommentId");
      }

      console.log("New comment Id:", listingId);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  // Wrapper function to call `handleReplySubmit` with required parameters
  const submitReplyForComment = (listingId, parentCommentId, replyText) => {
    if (!currentUser) {
      alert("You must be logged in to reply.");
      return;
    }

    handleReplySubmit(
      listingId,
      parentCommentId,
      replyText,
      currentUser,
      setItems
    );
  };

  // use deleteComment
  const deleteCommentForListing = (listingId, commentId, parentCommentId) => {
    handleDeleteComment(listingId, commentId, parentCommentId, items, setItems);
  };

  const likeListing = (listingId) => {
    handleLike(listingId, currentUser, items, setItems);
  };

  const shareListing = async (listingId) => {
    if (!currentUser) {
      alert("Você precisa estar logado para compartilhar.");
      return;
    }

    try {
      await handleShare(listingId, currentUser);

      // Marca como compartilhado para o usuário atual (somente localmente)
      setSharedListings((prev) =>
        prev.includes(listingId) ? prev : [...prev, listingId]
      );
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      alert("Erro ao compartilhar.");
    }
  };

  const likeCommentOrReply = async (
    commentId,
    isReply = false,
    parentCommentId = null
  ) => {
    console.log("Attempting to like a comment...");

    console.log("comment Id to like:", newCommentId);

    const targetCommentId = commentId || newCommentId;
    console.log(targetCommentId);

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
      console.log("Successfully liked comment:", targetCommentId);
    } catch (error) {
      console.error("Error in liking comment or reply:", error);
    }
  };

  const toggleLeaderMenu = (listingId) => {
    setOpenLeaderMenuId((prevId) => (prevId === listingId ? null : listingId));
  };

  // console.log("currentUser in Listings:", currentUser); // Ensure it shows correct data

  const handleDeleteListing = async (listingId) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja deletar esta postagem?"
    );
    if (!confirmDelete) return;

    try {
      const api = `${baseURL}/api/adm/admDeleteListing/${listingId}`;
      console.log("calling api:", api, "with listingId of:", listingId);

      const response = await fetch(api, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // se o backend exigir autenticação por cookie
      });

      if (!response.ok) {
        console.log("Erro ao tentar deletar listagem ");
        throw new Error(`Erro ao deletar postagem: ${response.statusText}`);
      }

      // Atualizar o estado removendo o item da lista
      setItems((prevItems) =>
        prevItems.filter((item) => item._id !== listingId)
      );

      alert("Postagem deletada com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar a postagem:", error);
      alert("Erro ao deletar a postagem.");
    }
  };

  return (
    <div className="landingListingsContainer">
      {loading ? (
        <p>Loading listings...</p>
      ) : items.length > 0 ? (
        items.map((listing) => (
          <div key={listing._id} className="landingListingContainer">
            {/* container para userInfo e adm */}
            <div className="listing header">
              {/* 1 / 2 */}
              <div className="userInfo">
                {listing.userId && (
                  <>
                    <Link to={`/profile/${listing.userId._id}`}>
                      <div
                        style={{
                          height: "45px",
                          width: "45px",
                          borderRadius: "50%",
                          backgroundImage: `url(${
                            listing.userId.profileImage || profileplaceholder
                          })`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      ></div>
                    </Link>
                    <p className="userName">{listing.userId.username}</p>
                  </>
                )}
              </div>

              {/* 2/2 */}

              {currentUser?.leader == true && (
                <div>
                  <button
                    style={{ backgroundColor: "red" }}
                    onClick={(index) => toggleLeaderMenu(listing._id)}
                  >
                    {" "}
                    <p>...</p>
                  </button>
                </div>
              )}
            </div>

            {openLeaderMenuId === listing._id && (
              <div className="adminListingMenu">
                <ul>
                  <li>
                    <button onClick={() => handleDeleteListing(listing._id)}>
                      delete
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {listing.type === "blog" && (
              <Link
                to={`openListing/${listing._id}`}
                style={{
                  textDecoration: "none",
                  margin: "0px",
                  backgroundColor: "green",
                }}
              >
                <div className="listing-content">
                  <div className="heading">
                    <h2>{listing.blogTitle || "Untitled Blog"}</h2>

                    <p style={{ textDecoration: "none", textAlign: "justify" }}>
                      {listing.blogContent
                        ? listing.blogContent.split(" ").length > 100
                          ? listing.blogContent
                              .split(" ")
                              .slice(0, 100)
                              .join(" ") + "..."
                          : listing.blogContent
                        : "No content available."}
                    </p>
                  </div>
                  {/*  */}

                  {listing.imageUrl && (
                    <img
                      src={listing.imageUrl}
                      alt={`Listing image ${listing._id}`}
                      className="listingImage"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        // backgroundColor: "red",
                      }}
                    />
                  )}
                </div>
              </Link>
            )}

            {listing.type === "image" && listing.imageUrl && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Link
                  to={`openListing/${listing._id}`}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <img
                    src={listing.imageUrl}
                    alt={`Listing image ${listing._id}`}
                    className="listingImage"
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        // backgroundColor: "red",
                      }}
                  />
                </Link>
              </div>
            )}

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

            {listing.type === "link" && (
              <div className="listing-link">
                <a
                  href={listing.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {listing.link}
                </a>
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
              isSingleListing={false}
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
              // Using imported functions for reply box
              // Using function to fetch comments
              handleFetchComments={fetchCommentsForListing} // Pass function as prop
              // Using function to submit a comment
              handleCommentSubmit={submitCommentForListing}
              // Using function to submit a reply to a comment
              handleReplySubmit={submitReplyForComment}
              // Using function to delete a comment
              handleDeleteComment={deleteCommentForListing}
              // using funtion to like listing
              handleLike={likeListing}
              // using function to share listing
              handleShare={shareListing}
              // pass sharedListings
              sharedListings={sharedListings}
              // using function to like comments or replies
              handleCommentLike={likeCommentOrReply}
              // setItems
              setItems={setItems}
            />
          </div>
        ))
      ) : (
        <p>No listings available</p>
      )}
    </div>
  );
};

export default Listings;

// `https://cristaosbackend.onrender.com/api/alllistings`
// `https://cristaosbackend.onrender.com/api/listingLike/${listingId}`
// `https://cristaosbackend.onrender.com/api/listings/${listingId}/comment`
// `https://cristaosbackend.onrender.com/api/listings/${listingId}/comments/${commentId}`

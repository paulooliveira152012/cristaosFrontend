import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import LikeIcon from "../assets/icons/likeIcon";
import LikedIcon from "../assets/icons/likedIcon";
import CommentIcon from "../assets/icons/commentIcon";
import ShareIcon from "../assets/icons/shareIcon";
import TrashIcon from "../assets/icons/trashcan";
import "../styles/commentingsection.css";

const ListingInteractionBox = ({
  listingId,
  handleLike,
  likesCount,
  comments = [], // Comments array directly passed from listing
  commentsCount,
  isLiked,
  handleCommentSubmit,
  handleReplySubmit,
  handleDeleteComment,
  currentUser,
  commentLikesCount,
  isCommentLiked,
  commentCommentsCount,
  handleCommentLike,
  handleShare,
  handleDeleteListing,
  showDeleteButton = false,
  showShareButton = true,
  userId,
  setItems = { setItems },
  sharedListings = [],
  updateListing, // Function to update the single listing (Listing.js)
  isSingleListing = false, // Indicates whether this is for a single listing
  listing,
}) => {
  const [showComments, setShowComments] = useState(false); // Toggle for showing/hiding comments
  const [replyTextMap, setReplyTextMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState({});
  const location = useLocation();
  const [pendingHighlightId, setPendingHighlightId] = useState(null);

  // console.log("currentUser in ListingInteractionBox:", currentUser); // Ensure it is passed correctly

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const commentId = queryParams.get("commentId");
    const replyId = queryParams.get("replyId");

    if (replyId) {
      setShowComments(true);
      setPendingHighlightId(`reply-${replyId}`);
    } else if (commentId) {
      setShowComments(true);
      setPendingHighlightId(`comment-${commentId}`);
    }
  }, [location.search]);

  // Esse segundo useEffect espera os elementos renderizarem
  useEffect(() => {
    if (pendingHighlightId && showComments) {
      const el = document.getElementById(pendingHighlightId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 2000);
        setPendingHighlightId(null);
      }
    }
  }, [pendingHighlightId, showComments]);

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  const handleReplyChange = (commentId, text) => {
    setReplyTextMap((prev) => {
      console.log("Updating replyTextMap:", { ...prev, [commentId]: text });
      return { ...prev, [commentId]: text };
    });
  };

  const handleCommentSubmitClick = () => {
    if (commentText.trim()) {
      handleCommentSubmit(listingId, commentText);
      setCommentText("");
    }
  };

  // console.log("currentUser:", currentUser);

  const handleReplySubmitClick = async (parentCommentId) => {
    const replyText = replyTextMap[parentCommentId];
    console.log("Reply Text Retrieved in handleReplySubmitClick:", replyText);
    if (replyText && replyText.trim()) {
      if (!replyTextMap[parentCommentId]) {
        console.error(
          "No reply text found for this parentCommentId:",
          parentCommentId
        );
        return;
      }
      await handleReplySubmit(
        listingId,
        parentCommentId,
        replyText,
        currentUser,
        setItems
      );
      setReplyTextMap((prev) => ({ ...prev, [parentCommentId]: "" }));
    }
  };

  const toggleReplyBox = (commentId) => {
    setShowReplyBox((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const toggleShowComments = () => {
    setShowComments((prevShowComments) => !prevShowComments);
  };

  const renderTrashIcon = () => {
    if (currentUser && currentUser._id === userId) {
      return (
        <TrashIcon
          onClick={() => handleDeleteListing(listingId)}
          style={{ alignSelf: "center" }}
          className="listingTrashCan"
        />
      );
    }
    return null;
  };

  // console.log("comments:", comments);

  return (
    <div className="interactionBoxContainer">
      <div className="interactionIcons">
        {/* like listing icon */}
        <div className="iconsContainer" onClick={() => handleLike(listingId)}>
          {isLiked ? <LikedIcon alt="Liked" /> : <LikeIcon alt="Like" />}
          <span style={{ marginLeft: "5px" }}>{likesCount}</span>
        </div>

        <div className="iconsContainer">
          <CommentIcon
            onClick={toggleShowComments}
            style={{ cursor: "pointer" }}
            alt="Comment"
          />
          <span style={{ marginLeft: "5px" }}>{commentsCount}</span>
        </div>

        {showShareButton && (
          <div>
            <ShareIcon
              onClick={() => handleShare(listingId)}
              style={{
                cursor: "pointer",
                color: sharedListings?.includes(listingId)
                  ? "green"
                  : "inherit", // ou uma classe CSS
              }}
              alt="Share"
            />
          </div>
        )}

        {renderTrashIcon()}
      </div>

      <div className="commentBox">
        <input
          type="text"
          value={commentText}
          onChange={handleCommentChange}
          placeholder="Type your comment"
          className="commentInput"
        />
        <button className="submitCommentBtn" onClick={handleCommentSubmitClick}>
          Submit
        </button>
      </div>

      {showComments && comments.length > 0 && (
        <div className="commentSectionContainer">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="commentsSection"
              id={`comment-${comment._id}`}
            >
              <div className="commentSection">
                <div className="left">
                  <Link to={`/profile/${comment.user}`}>
                    <div
                      className="commentProfileImage"
                      style={{
                        backgroundImage: `url(${comment.profileImage || ""})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                      }}
                    ></div>
                  </Link>

                  <div className="commentContainer">
                    {/* username on comment */}
                    <p>
                      <strong>{comment.username || "Unknown User"}:</strong>{" "}
                      {comment.text}
                    </p>
                    <div className="commentsInteractionContainer">
                      {/* comments */}
                      <div className="left">
                        <div
                          onClick={() => handleCommentLike(comment._id, false)}
                          style={{ cursor: "pointer" }}
                        >
                          {/* comment like Icon */}
                          {isCommentLiked(comment) ? (
                            <LikedIcon />
                          ) : (
                            <LikeIcon />
                          )}
                          <span
                            style={{ marginLeft: "0px", alignSelf: "center" }}
                          >
                            {commentLikesCount(comment)}
                          </span>
                        </div>
                        <div onClick={() => toggleReplyBox(comment._id)}>
                          <CommentIcon style={{ cursor: "pointer" }} />
                          <span
                            style={{ marginLeft: "0px", alignSelf: "center" }}
                          >
                            {commentCommentsCount(comment)}
                          </span>
                        </div>
                        {/* clising right tag */}
                      </div>

                      {/* delete icon here */}
                      <div className="right">
                        <TrashIcon
                          onClick={() =>
                            handleDeleteComment(listingId, comment._id)
                          }
                          style={{ cursor: "pointer" }}
                          alt="Delete Reply"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {currentUser && currentUser._id === comment.user?._id && (
                  <div className="right">
                    <TrashIcon
                      onClick={() =>
                        handleDeleteComment(listingId, comment._id)
                      }
                      style={{ cursor: "pointer" }}
                      alt="Delete Comment"
                    />
                  </div>
                )}
              </div>

              {showReplyBox[comment._id] && (
                <div className="replyBox">
                  <input
                    type="text"
                    value={replyTextMap[comment._id] || ""}
                    onChange={(e) =>
                      handleReplyChange(comment._id, e.target.value)
                    }
                    placeholder="Type your reply"
                    className="commentInput"
                    style={{ padding: "10px" }}
                  />
                  <button
                    className="submitCommentBtn"
                    onClick={() => handleReplySubmitClick(comment._id)}
                  >
                    Submit Reply
                  </button>
                </div>
              )}

              {/* reply section */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="replySectionContainer">
                  <div className="repliesSection">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="replySection"
                        id={`reply-${reply._id}`}
                        style={{ marginBottom: "10px" }}
                      >
                        <div className="replyContent">
                          <div style={{ display: "flex" }}>
                            <Link to={`/profile/${reply.user}`}>
                              <div
                                className="commentProfileImage"
                                style={{
                                  backgroundImage: `url(${
                                    reply.profileImage || ""
                                  })`,
                                  backgroundPosition: "center",
                                  backgroundSize: "cover",
                                  backgroundRepeat: "no-repeat",
                                }}
                              ></div>
                            </Link>
                            <p>
                              <strong>
                                {reply.username || "Unknown User"}:
                              </strong>{" "}
                              {reply.text}
                            </p>
                          </div>

                          <div className="replyInteractionContainer">
                            <div
                              onClick={() =>
                                handleCommentLike(reply._id, true, comment._id)
                              }
                              style={{ cursor: "pointer", display: "flex" }}
                            >
                              {isCommentLiked(reply) ? (
                                <LikedIcon />
                              ) : (
                                <LikeIcon />
                              )}

                              <span
                                style={{
                                  marginLeft: "0px",
                                  alignSelf: "center",
                                }}
                              >
                                {commentLikesCount(reply)}
                              </span>
                            </div>
                            {/* reply trash icon */}
                            <div className="right">
                              <TrashIcon
                                onClick={() =>
                                  handleDeleteComment(
                                    listingId,
                                    reply._id,
                                    comment._id
                                  )
                                }
                                style={{ cursor: "pointer" }}
                                alt="Delete Reply"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingInteractionBox;

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import LikeIcon from "../assets/icons/likeIcon";
import LikedIcon from "../assets/icons/likedIcon";
import CommentIcon from "../assets/icons/commentIcon";
import ShareIcon from "../assets/icons/shareIcon";
import SharedIcon from "../assets/icons/sharedIcon";
import TrashIcon from "../assets/icons/trashcan";
import "../styles/commentingsection.css";
import { ArrowRight } from "lucide-react";

const ListingInteractionBox = ({
  listingId,
  handleLike,
  likes,
  likesCount,
  comments = [],
  commentsCount,
  sharesCount,
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
  updateListing,
  isSingleListing = false,
  listing,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState({});
  const location = useLocation();
  const [pendingHighlightId, setPendingHighlightId] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);

  console.log("✅✅likes:", likes)

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
    setReplyTextMap((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleCommentSubmitClick = () => {
    if (commentText.trim()) {
      handleCommentSubmit(listingId, commentText);
      setCommentText("");
    }
  };

  const handleReplySubmitClick = async (parentCommentId) => {
    const replyText = replyTextMap[parentCommentId];
    if (replyText && replyText.trim()) {
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
    if (!currentUser) {
      window.alert("Fazer login para interagir");
      return;
    }

    setShowComments((prevShowComments) => !prevShowComments);
    setShowCommentBox((prevShowCommentBox) => !prevShowCommentBox);
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

  return (
    <div className="interactionBoxContainer">
      <div>
            
            {likes.map((u) => (
              <Link key={u._id} to={`/profile/${u._id}`}>
                <span>{[u.username, " "]}</span>
              </Link>
              
            ))}
            <span>{ likesCount}</span>
          </div>
      <div className="interactionIcons">
        
        <div className="iconsContainer" onClick={() => handleLike(listingId)}>
          {isLiked ? (
            <LikedIcon alt="Liked" className="shared-feedback" />
          ) : (
            <LikeIcon alt="Like" />
          )}
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
          <div className="iconsContainer">
            {sharedListings?.includes(listingId) ? (
              <SharedIcon
                onClick={() => handleShare(listingId)}
                className="shared-feedback"
                style={{ cursor: "pointer" }}
              />
            ) : (
              <ShareIcon
                onClick={() => handleShare(listingId)}
                style={{ cursor: "pointer" }}
                alt="Share"
              />
            )}
            <span style={{ marginLeft: "5px" }}>{sharesCount}</span>
          </div>
        )}

        {renderTrashIcon()}
      </div>

      {showCommentBox && (
        <div className="commentBox">
          <div className="commentInputWrapper">
            <input
              type="text"
              value={commentText}
              onChange={handleCommentChange}
              placeholder="Type your comment"
              className="commentInput"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCommentSubmitClick();
                }
              }}
            />

            {commentText.trim() && (
              <button
                className="submitCommentBtn"
                onClick={handleCommentSubmitClick}
                aria-label="Enviar comentário"
                title="Enviar comentário"
              >
                <ArrowRight size={18} color="white" />
              </button>
            )}
          </div>
        </div>
      )}

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
                    <p>
                      <strong>{comment.username || "Unknown User"}:</strong>{" "}
                      {comment.text}
                    </p>
                    <div className="commentsInteractionContainer">
                      <div className="left">
                        <div
                          onClick={() => handleCommentLike(comment._id, false)}
                          style={{ cursor: "pointer" }}
                        >
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
                      </div>

                      {/* fazer so com que o ususario que fez o comentario veja o TrashIcon */}
                      {currentUser &&
                        String(currentUser._id) ===
                          String(comment?.user?._id || comment?.user) && (
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
                    onkeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleReplySubmitClick(comment._id);
                      }
                    }}
                    aria-label="Enviar resposta"
                  >
                    Submit Reply
                  </button>
                </div>
              )}

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
                                className="commentProfileImageReply"
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
                            {currentUser &&
                              String(currentUser._id) ===
                                String(reply?.user?._id || reply?.user) && (
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
                              )}
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

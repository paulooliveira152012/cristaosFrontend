import React, { useState, useEffect, Fragment } from "react";
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
  const [showAllLikes, setShowAllLikes] = useState(false);
  console.log("✅✅likes:", likes);

  // helper para garantir estrutura { _id, username, profileImage } mesmo se vier id puro
  const normLikes = Array.isArray(likes)
    ? likes.map((u) =>
        typeof u === "string" || typeof u === "number"
          ? { _id: String(u), username: null, profileImage: "" }
          : u || {}
      )
    : [];

  const totalLikes =
    typeof likesCount === "number" ? likesCount : normLikes.length;
  const firstTwo = normLikes.slice(0, 2);
  const hasMore = totalLikes > firstTwo.length;

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

  console.log("likes testing on openListing page:", likes)

  return (
    <div className="interactionBoxContainer">
      {/* Linha de curtidas (apenas prévia com 2 nomes + "+N") */}
      <div 
        className="likesListContainer"
        style={{ marginBottom: 8 }}
      >
        {totalLikes === 0 ? (
          <span className="muted">ninguém curtiu ainda</span>
        ) : (
          <div className="likes">
            {/* até 2 nomes (se disponíveis) */}
            {firstTwo.map((u, i) => {
              const label = u.username || null; // se não tiver username, não mostra nome
              return (
                <Fragment key={u._id || i}>
                  {label ? (
                    <Link to={`/profile/${u._id}`}>
                      <div 
                        style={{
                          backgroundImage: `url(${u.profileImage || "/placeholder-avatar.png"})`,
                          height: "25px",
                          width: "25px",
                          borderRadius: "30%",
                          backgroundSize: "cover",
                          // backgroundColor: "red",
                          backgroundPositionY: "center"
                        }}
                      />
                      {/* {label} */}
                    </Link>
                  ) : null}
                  {i < firstTwo.length - 1 && <span style={{marginRight: "5px"}}> </span>}
                </Fragment>
              );
            })}

            {/* +N se houver mais curtidas */}
            {hasMore && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAllLikes(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "start",
                    width: "auto",
                    backgroundColor: "rgb(42, 104, 216)",
                    padding: "0px 5px",
                    marginLeft: "5px"

                  }}
                >
                  +{totalLikes - firstTwo.length}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal: lista completa de curtidores */}
      {showAllLikes && (
        <div
          onClick={() => setShowAllLikes(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 95vw)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0 }}>Quem curtiu</h3>
              <button onClick={() => setShowAllLikes(false)}>Fechar</button>
            </div>

            {normLikes.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {normLikes.map((u, idx) => (
                  <li
                    key={u._id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <img
                      src={u.profileImage || "/placeholder-avatar.png"}
                      alt={u.username || "usuário"}
                      width={32}
                      height={32}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                    {u._id ? (
                      <Link to={`/profile/${u._id}`}>
                        {u.username || u._id}
                      </Link>
                    ) : (
                      <span>@{u.username || "usuário"}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ninguém curtiu ainda.</p>
            )}
          </div>
        </div>
      )}

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

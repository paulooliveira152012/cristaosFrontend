import { useState } from "react";
import { Link } from "react-router-dom";
import {
  handleLike,
  toggleShowComments,
  handleShare,
} from "./functions/interactionBoxFunctions";
import LikeIcon from "../assets/icons/likeIcon";
import LikedIcon from "../assets/icons/likedIcon";
import CommentIcon from "../assets/icons/commentIcon";
import ShareIcon from "../assets/icons/shareIcon";
import TrashIcon from "../assets/icons/trashcan";
import "../styles/commentingsection.css";

const InteractionContainer = ({
  listingId,
  isLiked: initialIsLiked,
  likesCount: initialLikesCount = 0,
  commentsCount: initialCommentsCount = 0,
  comments = [],
  showShareButton = true,
  renderTrashIcon,
  handleCommentSubmit,
  // pass functions for comment's interaction which is comming from (?)
  handleCommentLike,
  isCommentLiked,
  commentLikesCount,
  handleDeleteComment,
  // handleCommentSubmit, // Ensure this is destructured
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState(""); // New comment input state

  console.log("post comments are: ", comments);
  console.log("comments count:", comments.length);

  // Handle the like button click
  const handleLikeClick = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prevLikesCount) =>
      newIsLiked ? prevLikesCount + 1 : prevLikesCount - 1
    );
    handleLike(listingId);
  };

  // Handle the toggle comments click
  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
    // toggleShowComments(listingId);
    console.log("Toggled comments:", showComments);
  };

  // Handle new comment submission
  const handleNewCommentSubmit = () => {
    if (newComment.trim()) {
      handleCommentSubmit(newComment, listingId);
      setNewComment(""); // Clear the input field
      setCommentsCount((prev) => prev + 1); // update comments count
    }
  };

  return (
    <div className="interactionBoxContainer" style={{ backgroundColor: "pink"}}>
      <div className="interactionIcons">
        {/* Handle Like Interaction */}
        <div className="iconsContainer" onClick={handleLikeClick}>
          {isLiked ? <LikedIcon alt="Liked" /> : <LikeIcon alt="Like" />}
          <span style={{ marginLeft: "5px" }}>{likesCount}</span>
        </div>

        {/* Handle Show Comments Interaction */}
        <div className="iconsContainer" onClick={handleToggleComments}>
          <CommentIcon style={{ cursor: "pointer" }} alt="Comment" />
          <span style={{ marginLeft: "5px" }}>{comments.length}</span>
        </div>

        {/* Handle Share Interaction (if enabled) */}
        {showShareButton && (
          <div>
            <ShareIcon
              onClick={() => handleShare(listingId)}
              style={{ cursor: "pointer" }}
              alt="Share"
            />
          </div>
        )}

        {/* Optionally render the trash icon */}
        {renderTrashIcon && renderTrashIcon()}
      </div>

      {/* New Comment Input Box */}
      <div className="newCommentInput">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentario"
          className="commentInput"
          style={{ padding: "20px", width: "100%" }}
        />
        <button
          className="submitCommentBtn"
          onClick={handleNewCommentSubmit}
          disabled={!newComment.trim()} // Disable if no comment is entered
        >
          Submit Comment
        </button>
      </div>

  {/* Conditionally render comments if showComments is true */}
{showComments && comments.length > 0 && (
  <div className="commentsSection">
    {comments
      .filter(comment => comment && comment._id) // Ensure each comment exists and has an _id
      .map((comment) => (
            <div key={comment._id || comment.id} className="comment" >
              <div className="commentHeader">
                {/* User Profile Image */}
                <Link to={`/profile/${comment.user._id}`}>
                  <div
                    className="commentProfileImage"
                    style={{
                      backgroundImage: `url(${
                        comment.user.profileImage || ""
                      })`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }}
                  ></div>
                </Link>
                {/* Comment Text */}
                <div className="commentText">
                  <p>
                    <strong>{comment.user.username}:</strong> {comment.text}
                  </p>
                  {/* interaction section for each comment */}
                  <InteractionContainer />
                </div>
              </div>

              {/* Replies Section */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="replySectionContainer">
                  {comment.replies.map((reply) => (
                    <div key={reply._id || reply.id} className="replySection">
                      {/* Reply User Profile Image */}
                      <Link to={`/profile/${reply.user._id}`}>
                        <div
                          className="replyProfileImage"
                          style={{
                            backgroundImage: `url(${
                              reply.user.profileImage || ""
                            })`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            backgroundRepeat: "no-repeat",
                          }}
                        ></div>
                      </Link>
                      {/* user name */}
                      <div className="replyText">
                        <p>
                          <strong>{reply.user.username}:</strong> {reply.text}
                        </p>
                        
                      </div>
                      {/* comment interaction section */}
                      <div className="replyInteractionContainer">
                        <div
                          onClick={() =>
                            handleCommentLike(reply._id, true, comment._id)
                          }
                          style={{ cursor: "pointer", display: "flex", backgroundColor: "blue" }}
                        >
                          {isCommentLiked(reply) ? <LikedIcon /> : <LikeIcon />}
                          <span
                            style={{ marginLeft: "0px", alignSelf: "center" }}
                          >
                            {commentLikesCount(reply)}
                          </span>
                        </div>
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
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractionContainer;

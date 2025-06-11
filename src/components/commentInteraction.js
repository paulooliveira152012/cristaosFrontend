// CommentInteraction.js
import LikeIcon from "../assets/icons/likeIcon";
import LikedIcon from "../assets/icons/likedIcon";
import TrashIcon from "../assets/icons/trashcan";

const CommentInteraction = ({
  commentId,
  isLiked,
  likesCount,
  handleCommentLike,
  handleDeleteComment,
  isReply = false,
  parentCommentId = null,
}) => (
  <div className="commentInteractionContainer">
    <div onClick={() => handleCommentLike(commentId, isReply, parentCommentId)}>
      {isLiked ? <LikedIcon /> : <LikeIcon />}
      <span>{likesCount}</span>
    </div>
    <div className="right">
      <TrashIcon
        onClick={() => handleDeleteComment(commentId, isReply, parentCommentId)}
        style={{ cursor: "pointer" }}
        alt="Delete Comment"
      />
    </div>
  </div>
);

export default CommentInteraction;

// CommentInteraction.js
import LikeIcon from "../assets/icons/likeIcon";
import LikedIcon from "../assets/icons/likedIcon";
import TrashIcon from "../assets/icons/trashcan";

const ICON_PX = 10; // tamanho apenas para comentários/replies

export default function CommentInteraction({
  isLiked,
  likesCount,
  onLike,
  onDelete,
}) {
  return (
    <div
      className="commentInteractionContainer"
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      <button
        onClick={onLike}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {isLiked ? <LikedIcon size={ICON_PX} /> : <LikeIcon size={ICON_PX} />}
        <span style={{ fontSize: 12, lineHeight: 1 }}>{likesCount}</span>
      </button>

      <button
        onClick={onDelete}
        style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
        aria-label="Delete comment"
        title="Delete comment"
      >
        <TrashIcon size={ICON_PX} />
      </button>
    </div>
  );
}


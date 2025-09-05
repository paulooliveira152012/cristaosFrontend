// components/profile/ListingCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FiMoreHorizontal } from "react-icons/fi";
import ListingInteractionBox from "../../ListingInteractionBox";
import { ManagingModal } from "../../ManagingModal";

const profileplaceholder = require("../../../assets/images/profileplaceholder.png");

export default function ListingCard({
  listing,
  profileUser,                // usuário dono do perfil
  currentUser,
  isOwner,
  isLeader,
  isOwnerMenuOpen,            // boolean
  onToggleOwnerMenu,          // () => void
  onOpenEdit,                 // (listing) => void
  onDelete,                   // () => Promise|void
  isManageOpen,               // boolean (modal líder)
  onOpenManage,               // () => void
  onCloseManage,              // () => void
  onStrike,                   // (reason) => Promise|void
  // interação
  handleLike,
  handleCommentSubmit,
  handleReplySubmit,
  handleDeleteComment,
  handleCommentLike,
  fetchListingComments,
  setUserListings,
  sharedListings,
  userId,                     // profileId
}) {
  const author = listing.userId;           // populate esperado
  const reposter = profileUser;
  const isRepostHere =
    listing.__sharedByProfile === true ||
    (String(author?._id || author) !== String(profileUser?._id) &&
      Array.isArray(listing.shares) &&
      listing.shares.some((u) => String(u) === String(profileUser?._id)));

  return (
    <div key={listing._id}>
      {/* menu de edição do dono */}
      {isOwner && (
        <div className="listingUpdateBox">
          <button
            className="listingMenuTrigger"
            onClick={onToggleOwnerMenu}
            aria-label="Abrir menu da listagem"
          >
            {isOwnerMenuOpen ? "×" : <FiMoreHorizontal size={18} />}
          </button>
        </div>
      )}

      {isOwner && isOwnerMenuOpen && (
        <div className="listingEditMenu">
          <ul>
            <li onClick={() => onOpenEdit(listing)}>✏️ Editar</li>
            <li onClick={onDelete}>🗑️ Excluir</li>
          </ul>
        </div>
      )}

      <div className="listing header">
        {/* avatar + nomes */}
        <div className="userInfo">
          {author && (
            <>
              <div className="avatarGroup">
                <Link
                  to={`/profile/${author._id}`}
                  className="avatar author"
                  aria-label={`Ver perfil de ${author.username}`}
                  style={{
                    backgroundImage: `url(${author.profileImage || profileplaceholder})`,
                  }}
                />
                {isRepostHere && (
                  <Link
                    to={`/profile/${reposter._id}`}
                    className="avatar reposter"
                    aria-label={`Repostado por ${reposter.username}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundImage: `url(${reposter.profileImage || profileplaceholder})`,
                    }}
                    title={`Repostado por ${reposter.username}`}
                  />
                )}
              </div>

              <div className="nameBlock">
                <p className="userName">{author.username}</p>
                {isRepostHere && (
                  <span className="repostTag">
                    repostado por @{reposter.username}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* botão de líder */}
        {isLeader && (
          <div>
            <button
              aria-label="Mais opções"
              onClick={onOpenManage}
              style={{
                backgroundColor: "#2a68d8",
                color: "white",
                height: 30,
                width: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: 6,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              …
            </button>
          </div>
        )}
      </div>

      {/* modal de moderação do líder */}
      {isManageOpen && (
        <ManagingModal
          setManagingModal={() => onCloseManage()}
          setLeaderMenuLevel={() => {}}
          leaderMenuLevel={"1"}
          userId={profileUser._id}
          listingId={listing._id}
          onDelete={onDelete}
          onStrike={onStrike}
        />
      )}

      {/* conteúdo da listagem */}
      {listing.type === "image" && listing.imageUrl && (
        <Link to={`/openListing/${listing._id}`}>
          <img
            src={listing.imageUrl}
            alt="Listing"
            className="profile-listing-image"
          />
        </Link>
      )}

      {listing.type === "blog" && (
        <Link to={`/openListing/${listing._id}`}>
          <div className="listing-content">
            <h2>{listing.blogTitle || ""}</h2>
            <p>{listing.blogContent?.slice(0, 150) || "No content."}</p>
            {listing.imageUrl && (
              <img
                src={listing.imageUrl}
                alt={`Listing image ${listing._id}`}
                className="listingImage"
                style={{ width: "100%", maxWidth: "100%", height: "auto" }}
              />
            )}
          </div>
        </Link>
      )}

      {listing.type === "poll" && listing.poll && (
        <Link to={`/openListing/${listing._id}`}>
          <div className="poll-container">
            <h3>{listing.poll.question}</h3>
            <ul>
              {listing.poll.options.map((option, i) => (
                <li key={i}>{option}</li>
              ))}
            </ul>
          </div>
        </Link>
      )}

      {/* caixa de interação */}
      <ListingInteractionBox
        listingId={listing._id}
        handleLike={() => handleLike(listing._id)}
        likesCount={listing.likes.length}
        comments={listing.comments || []}
        commentsCount={listing.comments ? listing.comments.length : 0}
        sharesCount={listing.shares ? listing.shares.length : 0}
        isLiked={
          currentUser ? listing.likes.includes(currentUser._id) : false
        }
        handleCommentSubmit={handleCommentSubmit}
        handleReplySubmit={handleReplySubmit}
        handleDeleteComment={handleDeleteComment}
        currentUser={currentUser}
        commentLikesCount={(comment) => (comment.likes ? comment.likes.length : 0)}
        isCommentLiked={(comment) =>
          comment.likes && Array.isArray(comment.likes)
            ? comment.likes.includes(currentUser._id)
            : false
        }
        commentCommentsCount={(comment) => (comment.replies ? comment.replies.length : 0)}
        handleFetchComments={fetchListingComments}
        setItems={setUserListings}
        handleCommentLike={handleCommentLike}
        showDeleteButton={true}
        handleShare={() => { /* já é feito fora se quiser */ }}
        sharedListings={sharedListings}
        userId={userId}
      />
    </div>
  );
}

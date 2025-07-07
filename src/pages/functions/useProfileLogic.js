
import {
  submitComment,
  submitReply,
  toggleListingLike,
  toggleCommentLike,
  deleteListing,
  deleteComment,
  shareListing,
} from "./profilePageFunctions"; // ajuste o caminho se necessário

export const useProfileLogic = ({
  currentUser,
  userListings,
  setUserListings,
  setSharedListings,
}) => {
  // Handle top-level comment submission
  const handleCommentSubmit = async (listingId, commentText) => {
    if (!currentUser) {
      alert("You must be logged in to comment.");
      return;
    }

    try {
      const newComment = await submitComment(
        listingId,
        currentUser._id,
        commentText
      );

      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId
            ? { ...item, comments: [...item.comments, newComment] }
            : item
        )
      );
    } catch (error) {
      alert("Error submitting comment. Please try again.");
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (parentCommentId, replyText) => {
    if (!currentUser) {
      alert("You need to be logged in to reply to a comment.");
      return;
    }

    try {
      const newReply = await submitReply(
        parentCommentId,
        currentUser._id,
        replyText
      );

      setUserListings((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          comments: item.comments.map((comment) =>
            comment._id === parentCommentId
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          ),
        }))
      );
    } catch (error) {
      alert("Erro ao enviar resposta. Tente novamente.");
    }
  };
  // Handle like functionality in Profile
  const handleLike = async (listingId) => {
    if (!currentUser) {
      alert("You must be logged in to like a listing.");
      return;
    }

    const userId = currentUser._id;

    // Optimistically update UI
    const originalListings = [...userListings];
    setUserListings((prevListings) =>
      prevListings.map((listing) => {
        if (listing._id === listingId) {
          const isLiked = listing.likes.includes(userId);
          const updatedLikes = isLiked
            ? listing.likes.filter((id) => id !== userId)
            : [...listing.likes, userId];
          return { ...listing, likes: updatedLikes };
        }
        return listing;
      })
    );

    try {
      const updatedLikes = await toggleListingLike(listingId, userId);

      setUserListings((prevListings) =>
        prevListings.map((listing) =>
          listing._id === listingId
            ? { ...listing, likes: updatedLikes }
            : listing
        )
      );
    } catch (error) {
      // Revert UI on failure
      setUserListings(originalListings);
      alert("Erro ao atualizar curtida.");
    }
  };
  // Inside Listings.js (or parent component)
  const handleCommentLike = async (
    commentId,
    isReply = false,
    parentCommentId = null
  ) => {
    if (!currentUser) {
      alert("You must be logged in to like a comment or reply.");
      return;
    }

    try {
      const updatedLikes = await toggleCommentLike({
        commentId,
        userId: currentUser._id,
        isReply,
        parentCommentId,
      });

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
                      ? { ...reply, likes: updatedLikes }
                      : reply
                  ),
                };
              } else {
                return { ...comment, likes: updatedLikes };
              }
            }
            return comment;
          }),
        }))
      );
    } catch (error) {
      console.error("Erro ao curtir comentário/resposta:", error);
    }
  };
  // Handle deleting a listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      await deleteListing(listingId);

      setUserListings((prevListings) =>
        prevListings.filter((listing) => listing._id !== listingId)
      );
      alert("Listing deleted successfully.");
    } catch (error) {
      alert("Error deleting listing.");
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (
    listingId,
    commentId,
    parentCommentId = null
  ) => {
    try {
      await deleteComment(commentId, parentCommentId);

      // Atualizar o estado local removendo o comentário ou a resposta
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

      alert("Comentário deletado com sucesso.");
    } catch (error) {
      alert("Erro ao deletar comentário.");
    }
  };
  // handle share
  const handleShare = async (listingId) => {
    const userId = currentUser._id;

    try {
      const result = await shareListing(listingId, userId);
      console.log("Listing shared successfully:", result);

      // Adiciona o ID à lista de compartilhados
      setSharedListings((prev) => [...prev, listingId]);

      // (Opcional) Remover o highlight após alguns segundos:
      setTimeout(() => {
        setSharedListings((prev) => prev.filter((id) => id !== listingId));
      }, 5000); // 5s de destaque
    } catch (error) {
      alert("Erro ao compartilhar listagem.");
    }
  };

  return {
    handleCommentSubmit,
    handleReplySubmit,
    handleLike,
    handleCommentLike,
    handleDeleteListing,
    handleDeleteComment,
    handleShare,
  };
};

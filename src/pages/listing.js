import "../styles/listing.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ListingInteractionBox from "../components/ListingInteractionBox";
import { useUser } from "../context/UserContext";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

import {
  handleFetchComments,
  handleCommentSubmit,
  handleReplySubmit,
  handleDeleteComment,
  handleLike,
  handleShare,
  handleCommentLike,
} from "../components/functions/interactionFunctions";

import { handleVote } from "./functions/listingInteractions";

import { Link } from "react-router-dom";
import profileplaceholder from "../assets/images/profileplaceholder.png";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const ListingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { id: listingId } = useParams();

  const [items, setItems] = useState([]); // Use items array with one listing for consistency
  const [loading, setLoading] = useState(true);
  const [newCommentId, setNewCommentId] = useState("");

  const [searchParams] = useSearchParams();
  const commentId = searchParams.get("commentId");

  const [votedPolls, setVotedPolls] = useState({});

  const listing = items[0]; // <= declare antes de qualquer uso

  const myVoteIndex = useMemo(() => {
    if (!currentUser?._id) return undefined;
    const votes = listing?.poll?.votes || [];
    const mine = votes.find((v) => {
      const uid =
        typeof v.userId === "object" && v.userId ? v.userId._id : v.userId;
      return String(uid) === String(currentUser._id);
    });
    return typeof mine?.optionIndex === "number" ? mine.optionIndex : undefined;
  }, [listing?.poll?.votes, currentUser?._id]);

  const voteOnListing = async (id, optionIndex) => {
    if (!currentUser) {
      alert("Você precisa estar logado para votar.");
      return;
    }

    // (opcional) otimista: adiciona meu voto já na UI
    setItems((prev) =>
      prev.map((it) =>
        it._id === id
          ? {
              ...it,
              poll: {
                ...it.poll,
                votes: [
                  // remove voto anterior do mesmo usuário, se existir
                  ...(it.poll?.votes || []).filter(
                    (v) =>
                      String(v.userId?._id || v.userId) !==
                      String(currentUser._id)
                  ),
                  {
                    userId: {
                      _id: currentUser._id,
                      username: currentUser.username || null,
                      profileImage: currentUser.profileImage || "",
                    },
                    optionIndex,
                  },
                ],
              },
            }
          : it
      )
    );

    try {
      const res = await fetch(`${baseUrl}/api/listings/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: currentUser._id, optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao votar.");

      // ✅ garante consistência com o backend
      // ✅ garante consistência com o backend + mantém avatar do meu voto
if (data.updatedPoll) {
  const hydrated = {
    ...data.updatedPoll,
    votes: (data.updatedPoll.votes || []).map((v) => {
      const uid = typeof v.userId === "object" ? v.userId._id : v.userId;
      // se é o meu voto e veio sem populate, injeta meus dados
      if (String(uid) === String(currentUser._id) && typeof v.userId !== "object") {
        return {
          ...v,
          userId: {
            _id: currentUser._id,
            username: currentUser.username || null,
            profileImage: currentUser.profileImage || "",
          },
        };
      }
      return v;
    }),
  };

  setItems((prev) =>
    prev.map((it) => (it._id === id ? { ...it, poll: hydrated } : it))
  );
}

    } catch (e) {
      // rollback do otimista (remove meu voto)
      setItems((prev) =>
        prev.map((it) =>
          it._id === id
            ? {
                ...it,
                poll: {
                  ...it.poll,
                  votes: (it.poll?.votes || []).filter(
                    (v) =>
                      String(v.userId?._id || v.userId) !==
                      String(currentUser._id)
                  ),
                },
              }
            : it
        )
      );
      console.error(e);
      alert("Erro ao votar");
    }
  };

  useEffect(() => {
    if (commentId) {
      const el = document.getElementById(commentId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [commentId]);

  // Fetch the single listing as the first item in the items array
  useEffect(() => {
    const fetchListingData = async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/listings/listings/${listingId}`
        );
        if (!response.ok) {
          const errorText = await response.text(); // Capture error details
          console.error("API Error Details:", errorText); // Log for more insight
          throw new Error(`Failed to fetch listing with id: ${listingId}`);
        }

        const data = await response.json();
        console.log("🚨✅ data:", data);
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
        const response = await fetch(
          `${baseUrl}/api/listings/listings/${listingId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch updated listing: ${response.statusText}`
          );
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

    handleReplySubmit(
      listingId,
      parentCommentId,
      replyText,
      currentUser,
      setItems
    );
  };

  const deleteCommentForListing = (listingId, commentId, parentCommentId) => {
    handleDeleteComment(listingId, commentId, parentCommentId, items, setItems);
  };

  // Extrai um id "comparável" de qualquer formato de like
  const getLikeId = (u) => {
    if (!u) return null;
    if (typeof u === "string" || typeof u === "number") return String(u);
    if (typeof u === "object") return String(u._id || u.user || u.id || "");
    return null;
  };

  // Like a ser adicionado de forma otimista (com avatar/nome p/ já aparecer)
  const makeOptimisticLike = (meId, currentUser) => ({
    _id: String(meId),
    username: currentUser?.username || null,
    profileImage: currentUser?.profileImage || "",
  });

  // Verifica se o usuário já curtiu
  const hasLiked = (likes, meId) => {
    const me = String(meId || "");
    return Array.isArray(likes) && likes.some((u) => getLikeId(u) === me);
  };

  // Retorna um novo array de likes com toggle otimista
  const toggleLikesArray = (likes, meId, currentUser) => {
    const me = String(meId || "");
    const safeLikes = Array.isArray(likes) ? likes : [];
    const already = hasLiked(safeLikes, me);
    if (already) {
      // remove meu like, independentemente do formato
      return safeLikes.filter((u) => getLikeId(u) !== me);
    }
    // adiciona meu like com dados p/ avatar surgir já na hora
    return [...safeLikes, makeOptimisticLike(me, currentUser)];
  };

  const likeListing = async (listingId) => {
    if (!currentUser?._id) {
      alert("Você precisa estar logado para curtir.");
      return;
    }

    // 1) Toggle otimista no estado
    let previous; // para rollback
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item._id !== listingId) return item;
        previous = item; // captura snapshot para possível rollback
        return {
          ...item,
          likes: toggleLikesArray(item.likes, currentUser._id, currentUser),
        };
      });
      return next;
    });

    // 2) Chama backend
    try {
      await handleLike(listingId, currentUser, items, setItems);
    } catch (err) {
      console.error("Falha no like, revertendo:", err);
      // 3) Rollback se der erro
      if (previous) {
        setItems((prev) =>
          prev.map((it) => (it._id === listingId ? previous : it))
        );
      }
    }
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

  const isYouTubeLink = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  const getYouTubeVideoId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) return <p>Loading listing details...</p>;
  if (items.length === 0) return <p>Listing not found.</p>;

  console.log(listing.type);

  const isLikedByMe = (likes, meId) => {
    if (!meId) return false;
    const me = String(meId);
    return (Array.isArray(likes) ? likes : []).some((u) => {
      if (!u) return false;
      if (typeof u === "string" || typeof u === "number")
        return String(u) === me;
      if (typeof u === "object") {
        // cobre { _id }, { user }, { id }
        return [u._id, u.user, u.id].some((v) => v && String(v) === me);
      }
      return false;
    });
  };

  console.log("Listing no listing.js:", listing);

  return (
    <div className="screenWrapper">
      <div className="scrollable">
        <Header showProfileImage={false} navigate={navigate} />
        <div>
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

            {listing.type === "link" && listing.link && (
              <div className="listing-content">
                <div className="listing-link">
                  {isYouTubeLink(listing.link) ? (
                    <div>
                      <iframe
                        width="100%"
                        // height="520px"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                          listing.link
                        )}`}
                        title="YouTube preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          width: "100%",
                          aspectRatio: "1.8",
                          border: 0,
                          borderRadius: 8,
                          marginBottom: 10,
                        }}
                      />
                      <div>
                        <p>{listing.linkDescription}</p>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={listing.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2A68D8", textDecoration: "underline" }}
                    >
                      {listing.link}
                    </a>
                  )}
                </div>
              </div>
            )}

            {listing.type === "poll" && listing.poll && (
              <div className="poll-container">
                <h2>{listing.poll.question}</h2>
                <ul>
                  {listing.poll.options.map((option, index) => {
                    const totalVotes = listing.poll.votes?.length || 0;
                    const optionVotes =
                      listing.poll.votes?.filter((v) => {
                        return v.optionIndex === index;
                      }).length || 0;

                    const votedOption = myVoteIndex; // em vez de votedPolls[listing._id]

                    const percentage =
                      totalVotes > 0
                        ? ((optionVotes / totalVotes) * 100).toFixed(1)
                        : 0;

                    const voters =
                      listing.poll.votes?.filter(
                        (v) => v.optionIndex === index
                      ) || [];

                    console.log("voters:", voters);

                    return (
                      <div key={index} style={{ marginBottom: "20px" }}>
                        {/* Bloco de votação */}
                        <li
                          onClick={() =>
                            myVoteIndex === undefined &&
                            voteOnListing(listing._id, index)
                          }
                          style={{
                            cursor:
                              myVoteIndex === undefined ? "pointer" : "default",
                            background:
                              myVoteIndex !== undefined
                                ? `linear-gradient(to right, #4caf50 ${percentage}%, #eee ${percentage}%)`
                                : "#f9f9f9",
                            padding: "10px",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            listStyleType: "none",
                          }}
                        >
                          <strong>{option}</strong>
                          {votedOption !== undefined && (
                            <span style={{ float: "right" }}>
                              {percentage}%
                            </span>
                          )}
                        </li>

                        {/* Avatares fora da caixa */}
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            marginTop: "6px",
                            paddingLeft: "10px",
                          }}
                        >
                          {voters.map((v, idx) => {
                            const isObj =
                              typeof v.userId === "object" && v.userId !== null;
                            const uid = isObj ? v.userId._id : v.userId; // cobre string ou objeto
                            const uimg = isObj ? v.userId.profileImage : null;
                            const uname = isObj ? v.userId.username : null;

                            return (
                              <Link to={`/profile/${uid}`} key={uid || idx}>
                                <img
                                  src={uimg || profileplaceholder} // fallback quando não populado
                                  alt={uname || "voter"}
                                  title={uname || uid}
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </ul>
              </div>
            )}

            <ListingInteractionBox
              listingId={listing._id}
              currentCommentId={newCommentId}
              likes={listing.likes}
              likesCount={listing.likes.length}
              comments={listing.comments || []}
              commentsCount={listing.comments ? listing.comments.length : 0}
              sharesCount={listing.shares ? listing.shares.length : 0}
              isLiked={isLikedByMe(listing.likes, currentUser?._id)}
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
      </div>
    </div>
  );
};

export default ListingPage;

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
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import profileplaceholder from "../assets/images/profileplaceholder.png";
// importando o componente de interação
import ListingInteractionBox from "./ListingInteractionBox";
import { useUser } from "../context/UserContext";
import { fetchAllAds } from "./functions/addComponentFuncitons";
import { interleaveAds } from "../utils/interLeaveAds.js";
import { useMediaQuery } from "../utils/useMediaQuery.js";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const Listings = () => {
  const { currentUser } = useUser(); // Access the current user
  const [items, setItems] = useState([]); // Store the listings
  const [ads, setAds] = useState([]); // Store the ads
  const [loading, setLoading] = useState(true); // Track loading state
  const [comment, setComments] = useState([]);
  const [votedPolls, setVotedPolls] = useState({});
  // listingId when creating new comment to be available when liking new comments
  const [newCommentId, setNewCommentId] = useState("");
  const [openLeaderMenuId, setOpenLeaderMenuId] = useState(null);
  const [sharedListings, setSharedListings] = useState([]);
  const isNarrow = useMediaQuery("(max-width: 1024px)");

  // Carrega ADS
  useEffect(() => {
    fetchAllAds(setAds);
  }, []);

  // Logging whenever newCommentId changes
  useEffect(() => {
    if (newCommentId) {
      console.log("New Comment ID set in state:", newCommentId);
    }
  }, [newCommentId]); // This will log the newCommentId each time it changes.

  // Fetch all listed items from the backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseURL}/api/listings/alllistings`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Error fetching listings");
        const data = await res.json();

        // Usa feed quando existir; fallback para apenas listings como "listing"
        const raw = Array.isArray(data.feed)
          ? data.feed
          : (data.listings || []).map((l) => ({
              type: "listing",
              listing: l,
              createdAt: l.createdAt,
            }));

        // Normaliza: vira "listing com meta __feed"
        const normalized = raw.map((doc) => {
          const isRepost = doc.type === "repost" && doc.reposter;
          const original = doc.listing || doc; // segurança
          return {
            ...original,
            __feed: {
              id: doc._id || original._id,
              isRepost,
              reposter: isRepost ? doc.reposter : null,
              feedCreatedAt: doc.createdAt || original.createdAt,
            },
          };
        });

        // Ordena por quando entrou no feed (repost sobe)
        normalized.sort(
          (a, b) =>
            new Date(b.__feed?.feedCreatedAt || b.createdAt) -
            new Date(a.__feed?.feedCreatedAt || a.createdAt)
        );

        setItems(normalized);

        // Inicializa votos (se houver usuário logado)
        if (currentUser) {
          const initialVotes = {};
          normalized.forEach((listing) => {
            if (listing.type === "poll" && listing.poll?.votes?.length > 0) {
              const vote = listing.poll.votes.find((v) => {
                const uid =
                  typeof v.userId === "object" ? v.userId._id : v.userId;
                return String(uid) === String(currentUser._id);
              });
              if (vote) initialVotes[listing._id] = vote.optionIndex;
            }
          });
          setVotedPolls(initialVotes);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser !== undefined) fetchListings();
  }, [currentUser]);

  // ---- Mix: listings + ads em intervalos aleatórios ----
  // já tem items e ads carregados...
  const feed = useMemo(() => {
    if (!items.length) return [];
    if (isNarrow) {
      // mobile/tablet: mistura todos os ads no meio do feed
      return interleaveAds(items, ads, { avoidTail: 1, jitter: 1 });
    }
    // desktop: sem intercalar
    return items;
  }, [items, ads, isNarrow]);

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

  const isYouTubeLink = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  const getYouTubeVideoId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleVote = async (listingId, optionIndex) => {
    if (!currentUser) {
      alert("Você precisa estar logado para votar.");
      return;
    }

    try {
      const res = await fetch(`${baseURL}/api/listings/${listingId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: currentUser._id,
          optionIndex,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erro ao votar.");

      // Atualiza o estado local com o novo resultado da enquete
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, poll: data.updatedPoll } : item
        )
      );

      // Marca que o usuário votou
      setVotedPolls((prev) => ({
        ...prev,
        [listingId]: optionIndex,
      }));
    } catch (err) {
      console.error("Erro ao votar:", err);
      alert(err.message || "Erro ao votar");
    }
  };

  // Gera uma key única por "instância" no feed
  // Keys (cobre 'ad' também)
  const keyForListing = (it) => {
    if (it.type === "ad") {
      return `ad_${it._id}_${it.__adIndex ?? 0}_${it.createdAt || ""}`;
    }
    const rep = it.__feed?.reposter;
    const repId = typeof rep === "object" ? rep?._id : rep || "orig";
    const ts = it.__feed?.feedCreatedAt || it.createdAt || it.updatedAt || "";
    return `${it._id}__${repId}__${ts}`;
  };

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

  // Extrai um id "comparável" de qualquer formato de like
  const getLikeId = (u) => {
    if (!u) return null;
    if (typeof u === "string" || typeof u === "number") return String(u);
    if (typeof u === "object") return String(u._id || u.user || u.id || "");
    return null;
  };

  // Verifica se o usuário já curtiu
  const hasLiked = (likes, meId) => {
    const me = String(meId || "");
    return Array.isArray(likes) && likes.some((u) => getLikeId(u) === me);
  };

  // Like a ser adicionado de forma otimista (com avatar/nome p/ já aparecer)
  const makeOptimisticLike = (meId, currentUser) => ({
    _id: String(meId),
    username: currentUser?.username || null,
    profileImage: currentUser?.profileImage || "",
  });

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

  return (
    <div className="landingListingsContainer">
      {loading ? (
        <p>Loading listings...</p>
      ) : feed.length > 0 ? (
        feed.map((entry) => {
          if (entry.type === "ad") {
            const ad = entry;
            return (
              <div
                key={keyForListing(ad)}
                className="landingListingContainer adContainer"
              >
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="listing-content">
                    <div className="heading">
                      <h2 style={{ marginBottom: 8 }}>
                        {ad.title || "Anúncio"}
                      </h2>
                      {ad.description && (
                        <p style={{ textAlign: "justify" }}>{ad.description}</p>
                      )}
                    </div>
                    {ad.imageUrl && (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || "Ad"}
                        className="listingImage"
                        style={{ width: "100%", height: "auto" }}
                      />
                    )}
                  </div>
                </a>
                <div className="sponsored-tag">Patrocinado</div>
              </div>
            );
          }

          const listing = entry;
          console.log("🚨✅ listing:", listing);
          return (
            <div
              key={keyForListing(listing)}
              className="landingListingContainer"
            >
              {/* container para userInfo e adm */}
              <div className="listing header">
                {/* 1 / 2 */}
                {/* 1 / 2 */}
                <div className="userInfo">
                  {listing.userId && (
                    <>
                      {/* Agrupamento de avatares */}
                      <div className="avatarGroup">
                        {/* Autor */}
                        <Link
                          to={`/profile/${listing.userId._id}`}
                          className="avatar author"
                          aria-label={`Ver perfil de ${listing.userId.username}`}
                          style={{
                            backgroundImage: `url(${
                              listing.userId.profileImage || profileplaceholder
                            })`,
                          }}
                        />

                        {/* Reposter, se houver */}
                        {listing.__feed?.isRepost &&
                          listing.__feed.reposter &&
                          (() => {
                            const rep = listing.__feed.reposter;
                            const repId =
                              typeof rep === "object" ? rep._id : rep;
                            const repImg =
                              typeof rep === "object" ? rep.profileImage : null;
                            const repName =
                              typeof rep === "object" ? rep.username : "alguém";
                            return (
                              <Link
                                to={`/profile/${repId}`}
                                className="avatar reposter"
                                aria-label={`Repostado por ${repName}`}
                                title={`Repostado por ${repName}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  backgroundImage: `url(${
                                    repImg || profileplaceholder
                                  })`,
                                }}
                              />
                            );
                          })()}
                      </div>

                      {/* Nome + tag de repost */}
                      <div className="nameBlock">
                        <p className="userName">{listing.userId.username}</p>
                        {listing.__feed?.isRepost &&
                          listing.__feed.reposter &&
                          (() => {
                            const rep = listing.__feed.reposter;
                            const repName =
                              typeof rep === "object" ? rep.username : "alguém";
                            return (
                              <span className="repostTag">
                                repostado por @{repName}
                              </span>
                            );
                          })()}
                      </div>
                    </>
                  )}
                </div>

                {/* 2/2 */}

                {currentUser?.leader == true && (
                  <div>
                    <button
                      aria-label="Mais opções"
                      onClick={() => toggleLeaderMenu(listing._id)}
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
                      <h2>{listing.blogTitle || ""}</h2>

                      <p
                        style={{ textDecoration: "none", textAlign: "justify" }}
                      >
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
                <Link to={`openListing/${listing._id}`}>
                  <div className="poll-container">
                    <h2>{listing.poll.question}</h2>
                    <ul>
                      {listing.poll.options.map((option, index) => {
                        const totalVotes = listing.poll.votes?.length || 0;
                        const optionVotes =
                          listing.poll.votes?.filter((v) => {
                            return v.optionIndex === index;
                          }).length || 0;

                        const votedOption = votedPolls[listing._id];
                        const percentage =
                          totalVotes > 0
                            ? ((optionVotes / totalVotes) * 100).toFixed(1)
                            : 0;

                        const voters =
                          listing.poll.votes?.filter(
                            (v) => v.optionIndex === index
                          ) || [];

                        return (
                          <div key={index} style={{ marginBottom: "20px" }}>
                            {/* Bloco de votação */}
                            <li
                              onClick={() =>
                                votedOption === undefined &&
                                handleVote(listing._id, index)
                              }
                              style={{
                                cursor:
                                  votedOption === undefined
                                    ? "pointer"
                                    : "default",
                                background:
                                  votedOption !== undefined
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
                              {voters.map((v, idx) => (
                                <Link to={`profile/${v.userId._id}`} key={idx}>
                                  <img
                                    key={idx}
                                    src={
                                      v.userId?.profileImage ||
                                      profileplaceholder
                                    }
                                    alt="voter"
                                    title={v.userId?.username}
                                    style={{
                                      width: "22px",
                                      height: "22px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </ul>
                  </div>
                </Link>
              )}

              {listing.type === "link" && (
                <Link to={`openListing/${listing._id}`}>
                  <div className="listing-link">
                    {isYouTubeLink(listing.link) ? (
                      <div>
                        <iframe
                          width="100%"
                          height="220"
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                            listing.link
                          )}`}
                          title="YouTube preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: "8px", marginBottom: "10px" }}
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
                        style={{
                          color: "#2A68D8",
                          textDecoration: "underline",
                        }}
                      >
                        {listing.link}
                      </a>
                    )}
                  </div>
                </Link>
              )}

              <ListingInteractionBox
                listingId={listing._id}
                currentCommentId={newCommentId}
                likesCount={listing.likes.length}
                likes={listing.likes}
                comments={listing.comments || []}
                commentsCount={listing.comments ? listing.comments.length : 0}
                sharesCount={listing.shares ? listing.shares.length : 0}
                isLiked={isLikedByMe(listing.likes, currentUser?._id)}
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
          );
        })
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

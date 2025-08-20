// Perfil – layout responsivo com bio, denominação simplificada e localização única
import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ListingInteractionBox from "../components/ListingInteractionBox";
import "../styles/profile.css";
import coverPlaceholder from "../assets/coverPlaceholder.jpg";

import {
  fetchUserData,
  fetchListingComments,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  requestChat,
  openEditor,
  saveEdit,
  cancelEdit,
  submitMuralContent,
  getMuralContent,
} from "./functions/profilePageFunctions";
import { useProfileLogic } from "./functions/useProfileLogic";

import FiMessageCircle from "../assets/icons/FiMessageCircle.js";
import {
  FiMoreVertical,
  FiMoreHorizontal,
  FiMapPin,
  FiEdit2,
} from "react-icons/fi";
import { useSocket } from "../context/SocketContext";

const imagePlaceholder = require("../assets/images/profileplaceholder.png");

/* ---------------- helpers: normalização de denominação ---------------- */
const strip = (s = "") =>
  s
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function levenshtein(a, b) {
  a = strip(a);
  b = strip(b);
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return m[a.length][b.length];
}

function normalizeDenomination(input = "") {
  const s = strip(input);
  if (!s) return "";
  const targets = [
    { key: "protestante", aliases: ["evangelico", "evangelica", "protestant"] },
    { key: "católico", aliases: ["catolica", "catolico", "romana"] },
    { key: "ortodoxo", aliases: ["ortodoxa"] },
    { key: "anglicano", aliases: ["anglicana"] },
    { key: "luterano", aliases: ["luterana"] },
    { key: "presbiteriano", aliases: ["presbiteriana"] },
    { key: "batista", aliases: [] },
    { key: "pentecostal", aliases: [] },
  ];
  for (const t of targets) {
    if (s.includes(t.key) || t.aliases.some((a) => s.includes(a))) return t.key;
  }
  let best = { key: "", d: Infinity };
  for (const t of targets) {
    [t.key, ...t.aliases].forEach((c) => {
      const d = levenshtein(s, c);
      if (d < best.d) best = { key: t.key, d };
    });
  }
  return best.d <= 3 ? best.key : input;
}
/* --------------------------------------------------------------------- */

const Profile = () => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [sharedListings, setSharedListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTab, setCurrentTab] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showListingMenu, setShowListingMenu] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  const [newMessage, setNewMessage] = ""
  const [muralMessages, setMuralMessages] = useState([]);
  const [newMuralMessage, setNewMuralMessage] = useState("");

  // bio (apenas front por enquanto)
  const [bioEditing, setBioEditing] = useState(false);
  const [bioLocal, setBioLocal] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  const {
    handleCommentSubmit,
    handleReplySubmit,
    handleLike,
    handleCommentLike,
    handleDeleteListing,
    handleDeleteComment,
    handleShare,
  } = useProfileLogic({
    currentUser,
    userListings,
    setUserListings,
    setSharedListings,
  });

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchUserData(userId);
        setUser(data.user);
        setUserListings(data.listings);

        const initialBio = data.user?.bio || "";
        setBioLocal(initialBio);
        setBioDraft(initialBio);
      } catch {
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) getData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { items = [] } = await getMuralContent(userId);
        console.log("items:", items);
       
        setMuralMessages(items);
      } catch (err) {
        console.error("Erro ao carregar mural:", err);
      }
    })();
  }, [userId]);

  const handleSendRequest = async () => {
    const profileUserId = user._id;
    const result = await sendFriendRequest(profileUserId);
    if (result.error) alert(result.error);
    else alert("Pedido enviado!");
  };

  const handleAcceptFriend = async (requesterId) => {
    const res = await acceptFriendRequest(requesterId);
    if (res.error) alert(res.error);
    else alert("Amizade aceita!");
  };

  const handleRejectFriend = async (requesterId) => {
    const res = await rejectFriendRequest(requesterId);
    if (res.error) alert(res.error);
    else alert("Pedido recusado.");
  };

  const handleRemoveFriend = async (friendId) => {
    const res = await removeFriend(friendId);
    if (res.error) alert(res.error);
    else alert("Amigo removido.");
  };

  const renderFriendAction = () => {
    if (!currentUser || !user || currentUser._id === user._id) return null;
    const isFriend = currentUser.friends?.includes(user._id);
    const hasSentRequest = currentUser.sentFriendRequests?.includes(user._id);
    const hasReceivedRequest = currentUser.friendRequests?.includes(user._id);

    if (isFriend) {
      return (
        <span className="friend-pill" onClick={() => handleRemoveFriend(user._id)}>
          ✅ Amigo
        </span>
      );
    }
    if (hasReceivedRequest) {
      return (
        <>
          <span className="friend-pill" onClick={() => handleAcceptFriend(user._id)}>
            ✅ Aceitar
          </span>
          <span
            className="friend-pill ghost"
            onClick={() => handleRejectFriend(user._id)}
          >
            ❌ Recusar
          </span>
        </>
      );
    }
    if (hasSentRequest) return <span className="friend-pill">⏳ Pedido enviado</span>;

    // <- Botão em pílula (texto) + Adicionar
    return (
      <span className="add-friend-btn" onClick={handleSendRequest}>
        + Adicionar
      </span>
    );
  };

  const renderMoreMenu = () => (
    <div className="more-options">
      <ul>
        {currentUser._id === user._id ? (
          <li onClick={() => navigate("/settingsMenu")}>⚙️ Configurações</li>
        ) : (
          <>
            <li>🚫 Bloquear</li>
            <li>⚠️ Reportar</li>
          </>
        )}
      </ul>
    </div>
  );

  const handleAddMuralMessage = async () => {
    const text = newMuralMessage?.trim();
    if (!text) return;

    try {
      const { error, message } = await submitMuralContent(
        currentUser._id,
        userId,
        text
      );
      if (error) throw new Error(error);

      // adiciona a mensagem real retornada pela API
      setMuralMessages((prev) => [message, ...prev]);
      setNewMessage("");
    } catch (e) {
      console.error(e);
      alert(e.message || "Erro ao enviar mensagem.");
    }
  };

  if (loading) return <p className="profile-loading">Carregando perfil...</p>;
  if (error) return <p className="profile-error">{error}</p>;

  const churchId =
    typeof user?.church === "string" ? user.church : user?.church?._id;

  const churchName =
    typeof user?.church === "object"
      ? user.church?.name
      : user?.churchName || "Ver igreja"; // opcional, caso você guarde o nome separado

  const toggleListingMenu = (listingId) => {
    setShowListingMenu((prev) => (prev === listingId ? null : listingId));
  };

  if (loading) return <p className="profile-loading">Carregando perfil...</p>;
  if (error) return <p className="profile-error">{error}</p>;
  if (!user) return null;

  // preferir cidade; se não tiver, estado
  const locationText = user.city || user.state || "";

  // denominação (apenas valor)
  const denominationRaw =
    user.denomination ||
    (typeof user?.church === "object" ? user.church?.name : "") ||
    user?.churchName ||
    "";
  const denomination = normalizeDenomination(denominationRaw);

  const friendsCount = Array.isArray(user.friends) ? user.friends.length : null;

  return (
    <>
      <div className="profilePageBasicInfoContainer">
        <Header showProfileImage={false} navigate={navigate} />
        <div className="profilePageHeaderParentSection">
          <div
            className="top"
            style={{
              backgroundImage: `url(${user?.profileBackgroundCover || coverPlaceholder})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: 220,
            }}
          />
          <div className="bottom">
            <div className="headerRow">
              {/* avatar */}
              <div className="imageColumn">
                <div
                  className="ProfileProfileImage"
                  style={{
                    backgroundImage: `url(${user?.profileImage || imagePlaceholder})`,
                    backgroundPosition: "center",
                  }}
                />
              </div>

              {/* info principal */}
              <div className="infoWrapper">
                <div className="nameLine">
                  <h2 className="profile-username">
                    {user.firstName || ""} {user.lastName || ""}
                  </h2>
                  <span className="at">@{user.username}</span>
                </div>

                {/* bio */}
                <div className="bioSection">
                  {!bioEditing ? (
                    <>
                      <p className={`bio ${bioLocal ? "" : "muted"}`}>
                        {bioLocal || "Escreva uma breve bio..."}
                      </p>
                      {currentUser._id === user._id && (
                        <button
                          className="tiny ghost"
                          onClick={() => setBioEditing(true)}
                          aria-label="Editar bio"
                          title="Editar bio"
                        >
                          <FiEdit2 size={14} /> Editar
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bio-editor">
                      <textarea
                        rows={3}
                        maxLength={220}
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        placeholder="Escreva uma breve bio (até 220 caracteres)"
                      />
                      <div className="bio-actions">
                        <button
                          className="tiny"
                          onClick={() => {
                            setBioLocal(bioDraft.trim());
                            setBioEditing(false);
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          className="tiny ghost"
                          onClick={() => {
                            setBioDraft(bioLocal);
                            setBioEditing(false);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* denominação – só o valor */}
                {denomination && (
                  <div className="denomination-value">{denomination}</div>
                )}

                {/* meta: local + amigos + adicionar */}
                <div className="metaRow">
                  {locationText && (
                    <span className="locationChip">
                      <FiMapPin size={14} /> {locationText}
                    </span>
                  )}

                  <div className="metaActions">
                    <span
                      className="friends-link"
                      onClick={() => navigate(`/profile/${user._id}/friends`)}
                    >
                      {friendsCount !== null
                        ? `${friendsCount} ${
                            friendsCount === 1 ? "amigo" : "amigos"
                          }`
                        : "Amigos"}
                    </span>
                    {renderFriendAction()}
                  </div>
                </div>
              </div>

              {/* ações à direita */}
              <div className="interactionButtons">
                {(currentUser._id !== user._id ||
                  currentUser._id === user._id) && (
                  <>
                    {currentUser._id !== user._id && (
                      <button
                        className="chat-icon-button"
                        onClick={async () => {
                          const res = await requestChat(
                            currentUser?._id,
                            user?._id
                          );
                          const convId =
                            res?.conversationId || res?.conversation?._id;
                          if (!convId) return; // nada a fazer se o backend não retornou id

                          // (opcional) já entra na sala pelo socket
                          socket?.emit?.("joinPrivateChat", {
                            conversationId: convId,
                          });

                          // navega direto pra conversa; justInvited ajuda a mostrar "Aguardando..."
                          navigate(`/privateChat/${convId}`, {
                            state: { justInvited: res?.status === "pending" },
                          });
                        }}
                      >
                        <FiMessageCircle size={20} />
                      </button>
                    )}
                    <button
                      className="more-icon-button"
                      onClick={() => setShowOptions(!showOptions)}
                    >
                      <FiMoreVertical size={20} />
                    </button>
                  </>
                )}
                {showOptions && renderMoreMenu()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="profileOptions">
        <ul>
          <li
            className={currentTab === "" ? "active" : ""}
            onClick={() => setCurrentTab("")}
          >
            Listagens
          </li>
          <li
            className={currentTab === "mural" ? "active" : ""}
            onClick={() => setCurrentTab("mural")}
          >
            Mural
          </li>
        </ul>
      </div>

      {/* Conteúdo */}
      <div className="profile-container">
        {(currentTab === "" || currentTab === "mural") && (
          <div className="profile-listings">
            {currentTab === "mural" ? (
              <div className="mural-section">
                {currentUser && currentUser._id !== user._id && (
                  <div className="mural-input">
                    <textarea
                      placeholder="Deixe uma mensagem no mural..."
                      value={newMuralMessage}
                      onChange={(e) => setNewMuralMessage(e.target.value)}
                      rows={3}
                    />
                    <button onClick={handleAddMuralMessage}>Enviar</button>
                  </div>
                )}
                <div className="mural-messages">
                  {muralMessages.length === 0 ? (
                    <p>Este mural ainda não tem mensagens.</p>
                  ) : (
                    muralMessages.map((msg) => (
                      <div key={msg._id} className="mural-message">
                        <div className="sender-info">
                          <img
                            src={msg.sender?.profileImage || imagePlaceholder}
                            alt="sender"
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                            }}
                          />
                          <strong style={{ marginLeft: 8 }}>
                            {msg.sender?.username}
                          </strong>
                        </div>
                        <p style={{ marginLeft: 38 }}>{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              userListings.map((listing) => {
                const isOpen = showListingMenu === listing._id;
                return (
                  <div key={listing._id} className="profile-listing-item">
                    {currentUser._id === user._id && (
                      <div className="listingUpdateBox">
                        <button
                          className="listingMenuTrigger"
                          onClick={() => toggleListingMenu(listing._id)}
                          aria-label="Abrir menu da listagem"
                        >
                          {isOpen ? "×" : <FiMoreHorizontal size={18} />}
                        </button>
                      </div>
                    )}

                    {isOpen && (
                      <div className="listingEditMenu">
                        <ul>
                          <li
                            onClick={() =>
                              openEditor(
                                listing,
                                setEditingId,
                                setDraft,
                                setShowListingMenu
                              )
                            }
                          >
                            ✏️ Editar
                          </li>
                          <li
                            onClick={() =>
                              handleDeleteListing(listing._id, setUserListings)
                            }
                          >
                            🗑️ Excluir
                          </li>
                        </ul>
                      </div>
                    )}

                    {listing.type === "image" && listing.imageUrl && (
                      <img
                        src={listing.imageUrl}
                        alt="Listing"
                        className="profile-listing-image"
                      />
                    )}

                    {listing.type === "blog" && (
                      <div className="listing-content">
                        <h2>{listing.blogTitle || "Untitled Blog"}</h2>
                        <p>
                          {listing.blogContent?.slice(0, 150) || "No content."}
                        </p>
                      </div>
                    )}

                    {listing.type === "poll" && listing.poll && (
                      <div className="poll-container">
                        <h3>{listing.poll.question}</h3>
                        <ul>
                          {listing.poll.options.map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {editingId === listing._id && (
                      <div className="modal">
                        <div className="modal-content">
                          <div className="listing-edit-form">{/* ... */}</div>
                        </div>
                      </div>
                    )}

                    <ListingInteractionBox
                      listingId={listing._id}
                      handleLike={() => handleLike(listing._id)}
                      likesCount={listing.likes.length}
                      comments={listing.comments || []}
                      commentsCount={
                        listing.comments ? listing.comments.length : 0
                      }
                      isLiked={
                        currentUser
                          ? listing.likes.includes(currentUser._id)
                          : false
                      }
                      handleCommentSubmit={handleCommentSubmit}
                      handleReplySubmit={handleReplySubmit}
                      handleDeleteComment={handleDeleteComment}
                      handleDeleteListing={handleDeleteListing}
                      currentUser={currentUser}
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
                      handleFetchComments={fetchListingComments}
                      setItems={setUserListings}
                      handleCommentLike={handleCommentLike}
                      showDeleteButton={true}
                      handleShare={handleShare}
                      sharedListings={sharedListings}
                      userId={userId}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;

// Perfil – layout responsivo com bio, denominação simplificada e localização única
import { useEffect, useState, useRef } from "react";
import { useUser } from "../context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
// =================== components
import Header from "../components/Header";
import { ProfileHeader } from "../components/Page_Profile/ProfileHeader.js";
import ListingInteractionBox from "../components/ListingInteractionBox";
import { ManagingModal } from "../components/ManagingModal.js";
// =================== style
import "../styles/profile.css";
import coverPlaceholder from "../assets/coverPlaceholder.jpg";
import { Link } from "react-router-dom";
import profileplaceholder from "../assets/images/profileplaceholder.png";
// =================== funções
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
  handleSaveBio,
  coverSelected,
  reportUser
} from "./functions/profilePageFunctions";
import { useProfileLogic } from "./functions/useProfileLogic";
import { 
  banMember, 
  strike,
  getStrikeHistory
 } from "../functions/leaderFunctions.js";
// =================== icones
import FiMessageCircle from "../assets/icons/FiMessageCircle.js";
import {
  FiMoreVertical,
  FiMoreHorizontal,
  FiMapPin,
  FiEdit2,
} from "react-icons/fi";
// =================== helpers
import { normalizeDenomination } from "../utils/normalizeDenominations.js";

const imagePlaceholder = require("../assets/images/profileplaceholder.png");

const Profile = () => {
  // ─────────────────────────────────────────────────────
  // Contexto / roteamento
  // ─────────────────────────────────────────────────────
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  // ─────────────────────────────────────────────────────
  // Flags derivadas do usuário atual
  // ─────────────────────────────────────────────────────
  const meId = currentUser?._id ?? null;
  const isLeader = currentUser?.role === "leader";
  // ─────────────────────────────────────────────────────
  // Dados principais
  // ─────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [sharedListings, setSharedListings] = useState([]);
  // ─────────────────────────────────────────────────────
  // UI global
  // ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ─────────────────────────────────────────────────────
  // Abas / menus
  // ─────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState(""); // "" | "mural"
  const [showOptions, setShowOptions] = useState(false); // menu "mais" do perfil
  const [showListingMenu, setShowListingMenu] = useState(null); // id da listagem c/ menu aberto
  // ─────────────────────────────────────────────────────
  // Edição de listagem
  // ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  // ─────────────────────────────────────────────────────
  // Mural
  // ─────────────────────────────────────────────────────
  const [muralMessages, setMuralMessages] = useState([]);
  const [newMuralMessage, setNewMuralMessage] = useState("");
  // ─────────────────────────────────────────────────────
  // Bio
  // ─────────────────────────────────────────────────────
  const [bioEditing, setBioEditing] = useState(false);
  const [bioLocal, setBioLocal] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  // ─────────────────────────────────────────────────────
  // Moderação (líder)
  // ─────────────────────────────────────────────────────
  const [managingModal, setManagingModal] = useState(null); // id da listagem sendo gerenciada
  // Se ainda estiver usando o fluxo antigo, mantenha; caso contrário, remova:
  const [leaderMenuLevel, setLeaderMenuLevel] = useState("1"); // (LEGADO) nível do submenu
  // ─────────────────────────────────────────────────────
  // Upload de arquivos
  // ─────────────────────────────────────────────────────
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  // ─────────────────────────────────────────────────────
  // erporting
  // ─────────────────────────────────────────────────────
  const [reporting, setReporting] = useState(false);
  // ─────────────────────────────────────────────────────
  /* Valores derivados (sempre depois dos estados que usam) */
  // ─────────────────────────────────────────────────────
  const isOwner = String(currentUser?._id) === String(user?._id);
  const userBio = (user?.bio ?? "").trim();
  const localBio = (bioLocal ?? "").trim();
  const bioText = userBio || localBio;

  // Debug (remova em produção)
  console.log("is currentUser a leader?", isLeader);

  const updateProfileBackground = () => {
    if (!isOwner) return;
    fileRef.current?.click();
  };

  // quando trocar de usuário (ou quando o backend retornar nova bio), sincronize
  useEffect(() => {
    const initialBio = user?.bio ?? "";
    setBioLocal(initialBio);
    setBioDraft(initialBio);
  }, [user?._id, user?.bio]);

  useEffect(() => {
    console.log(bioDraft);
  }, [bioDraft]);

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
    currentUserId: meId,
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

  // utilizando função importada
  const handleCoverSelected = (e) => {
    coverSelected(e, setUploading, setUser);
  };

  const handleReportUser = async () => {
  if (!currentUser?._id || !userId) return;
  if (String(currentUser._id) === String(userId)) {
    alert("Você não pode reportar a si mesmo.");
    return;
  }
  if (reporting) return;

  const reason = window.prompt("Descreva rapidamente o motivo do reporte:", "");
  if (reason == null) return; // cancelou
  const trimmed = reason.trim();
  if (!trimmed) {
    alert("Por favor, informe um motivo.");
    return;
  }

  try {
    setReporting(true);
    const resp = await reportUser({
      // NÃO envie reporterId — o servidor pega do JWT (req.user._id)
      targetId: userId,
      reason: trimmed,
      source: "profile",
      context: { url: window.location.href }, // opcional, ajuda no admin
    });

    if (resp?.deduped) {
      alert("Já recebemos um reporte igual recentemente. Obrigado!");
    } else {
      alert("Obrigado! Seu reporte foi enviado para análise.");
    }

    setShowOptions(false);
  } catch (err) {
    alert(err?.message || "Não foi possível enviar o reporte.");
  } finally {
    setReporting(false);
  }
};



  const renderFriendAction = () => {
    if (!currentUser || !user || isOwner) return null;
    const isFriend = currentUser.friends?.includes(user._id);
    const hasSentRequest = currentUser.sentFriendRequests?.includes(user._id);
    const hasReceivedRequest = currentUser.friendRequests?.includes(user._id);

    if (isFriend) {
      return (
        <span
          className="friend-pill"
          onClick={() => handleRemoveFriend(user._id)}
        >
          ✅ Amigo
        </span>
      );
    }
    if (hasReceivedRequest) {
      return (
        <>
          <span
            className="friend-pill"
            onClick={() => handleAcceptFriend(user._id)}
          >
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
    if (hasSentRequest)
      return <span className="friend-pill">⏳ Pedido enviado</span>;

    // <- Botão em pílula (texto) + Adicionar
    return (
      <span className="add-friend-btn" onClick={handleSendRequest}>
        + Adicionar
      </span>
    );
  };

  const renderMoreMenu = () => (
    <div className="modal" onClick={() => setShowOptions(false)}>
      <div className="modal-content">
        <div className="more-options">
          <ul>
            {isOwner ? (
              <li onClick={() => navigate("/settingsMenu")}>
                ⚙️ Configurações
              </li>
            ) : (
              <>
                <li onClick={handleReportUser}>⚠️ Reportar</li>
                {isLeader && (
                  <ul>
                    <li onClick={() => handleBanMember()}>Banir</li>
                    <li>Strike</li>
                  </ul>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
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
      setNewMuralMessage("");
    } catch (e) {
      console.error(e);
      alert(e.message || "Erro ao enviar mensagem.");
    }
  };

  const churchId =
    typeof user?.church === "string" ? user.church : user?.church?._id;

  const churchName =
    typeof user?.church === "object"
      ? user.church?.name
      : user?.churchName || "Ver igreja"; // opcional, caso você guarde o nome separado

  const toggleListingMenu = (listingId) => {
    setShowListingMenu((prev) => (prev === listingId ? null : listingId));
  };

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

  const toggleLeaderMenu = (listingId) => {
    setManagingModal((prevId) => (prevId === listingId ? null : listingId));
  };

  const handleBanMember = () => {
    console.log("banning member");
    console.log("isLeader?", isLeader);
    console.log("userId:", userId);

    banMember({ isLeader, userId });
  };

  // redirect to main page if user has been banned
  if (user.isBanned) {
    navigate("/");
    return;
  }

  return (
    <>
      {/* <div className="modal">
      <div className="modal-content"></div>
    </div> */}
      <div className="profilePageBasicInfoContainer">
        <Header showProfileImage={false} navigate={navigate} />
        <ProfileHeader
          /* capa */
          updateProfileBackground={() => isOwner && fileRef.current?.click()}
          isOwner={isOwner}
          user={user}
          currentUser={currentUser}
          setUser={setUser}
          coverPlaceholder={coverPlaceholder}
          uploading={uploading}
          fileRef={fileRef}
          handleCoverSelected={handleCoverSelected}
          imagePlaceholder={imagePlaceholder} // importe isso no Profile.jsx
          socket={socket}
          /* bio */
          bioLocal={bioLocal}
          setBioLocal={setBioLocal}
          bioEditing={bioEditing}
          setBioEditing={setBioEditing}
          bioDraft={bioDraft}
          setBioDraft={setBioDraft}
          bioText={bioText}
          handleSaveBio={handleSaveBio} // do seu profilePageFunctions
          /* funçõezinhas externas usadas dentro do header */
          renderFriendAction={renderFriendAction}
          navigate={navigate}
          requestChat={requestChat}
          /* estado/menus */
          setShowOptions={setShowOptions}
          showOptions={showOptions}
          renderMoreMenu={renderMoreMenu} // defina como: const renderMoreMenu = () => (<div>...</div>)
          /* meta */
          locationText={user?.city || user?.state || ""}
          denomination={denomination}
          friendsCount={
            Array.isArray(user?.friends) ? user.friends.length : null
          }
        />
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
                  <div key={listing._id}>
                    {isOwner && (
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
                          <li onClick={() => handleDeleteListing(listing._id)}>
                            🗑️ Excluir
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="listing header">
                      {/* 1 / 2 */}
                      <div className="userInfo">
                        {listing.userId &&
                          (() => {
                            // é repost NESTE perfil?
                            const isRepostHere =
                              listing.__sharedByProfile === true ||
                              (String(listing.userId?._id || listing.userId) !==
                                String(user?._id) &&
                                Array.isArray(listing.shares) &&
                                listing.shares.some(
                                  (u) => String(u) === String(user?._id)
                                ));

                            const author = listing.userId; // autor original (populate)
                            const reposter = user; // dono do perfil atual

                            return (
                              <>
                                <div className="avatarGroup">
                                  {/* Autor */}
                                  <Link
                                    to={`/profile/${author._id}`}
                                    className="avatar author"
                                    aria-label={`Ver perfil de ${author.username}`}
                                    style={{
                                      backgroundImage: `url(${
                                        author.profileImage ||
                                        profileplaceholder
                                      })`,
                                    }}
                                  />

                                  {/* Reposter (apenas se for repost neste perfil) */}
                                  {isRepostHere && (
                                    <Link
                                      to={`/profile/${reposter._id}`}
                                      className="avatar reposter"
                                      aria-label={`Repostado por ${reposter.username}`}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        backgroundImage: `url(${
                                          reposter.profileImage ||
                                          profileplaceholder
                                        })`,
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
                            );
                          })()}
                      </div>

                      {/* 2/2 … mantém o resto como já está (botões, menu, etc.) */}
                      {isLeader && (
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
                    {/* =============== Leader Menu ==================== */}

                    {managingModal === listing._id && (
                      <ManagingModal
                        setManagingModal={setManagingModal}
                        setLeaderMenuLevel={setLeaderMenuLevel}
                        leaderMenuLevel={leaderMenuLevel}
                        userId={user._id} // quem sofre a ação
                        listingId={listing._id} // qual listagem esta sendo gerenciada
                        onDelete={() => handleDeleteListing(listing._id)} // ação: deletar listagem
                        onStrike={async (strikeReason) => {
                          const { ok, error } = await strike({
                            userId: user._id,
                            listingId: listing._id,
                            strikeReason,
                          });
                          if (!ok) alert(error || "Falha ao registrar strike.");
                        }}
                        getStrikeHistory = {getStrikeHistory}
                      />
                    )}

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
                          <p>
                            {listing.blogContent?.slice(0, 150) ||
                              "No content."}
                          </p>
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
                      sharesCount={listing.shares ? listing.shares.length : 0}
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

// Atualizando layout e organização do perfil com base nas instruções da Gabi

import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ListingInteractionBox from "../components/ListingInteractionBox";
import "../styles/profile.css";
import { ProfileUserFriends } from "./profileComponents/friends";
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
} from "./functions/profilePageFunctions";
import { useProfileLogic } from "./functions/useProfileLogic";
import FiMessageCircle from "../assets/icons/FiMessageCircle.js";
import { FiMoreVertical } from "react-icons/fi";

const imagePlaceholder = require("../assets/images/profileplaceholder.png");

const Profile = () => {
  const { currentUser } = useUser();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("");
  const [sharedListings, setSharedListings] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showListingMenu, setShowListingMenu] = useState(null);
  // abaixo dos outros useState
  const [editingId, setEditingId] = useState(null); // id da listagem em edição
  const [draft, setDraft] = useState({}); // rascunho da listagem atual

  const [muralMessages, setMuralMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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

  console.log("currentUser no perfil:", currentUser);

  console.log("user:", user);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchUserData(userId);
        setUser(data.user);
        setUserListings(data.listings);
      } catch (err) {
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) getData();
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
      return <span onClick={() => handleRemoveFriend(user._id)}>✅ Amigo</span>;
    }
    if (hasReceivedRequest) {
      return (
        <>
          <span onClick={() => handleAcceptFriend(user._id)}>✅ Aceitar</span>
          <span onClick={() => handleRejectFriend(user._id)}>❌ Recusar</span>
        </>
      );
    }
    if (hasSentRequest) return <span>⏳ Pedido enviado</span>;
    return <span onClick={handleSendRequest}>➕ Adicionar</span>;
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

  const handleAddMuralMessage = () => {
    if (!newMessage.trim()) return;
    const fakeMessage = {
      _id: Date.now(),
      sender: currentUser,
      text: newMessage,
      createdAt: new Date(),
    };
    setMuralMessages([fakeMessage, ...muralMessages]);
    setNewMessage("");
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

  return (
    <>
      <div className="profilePageBasicInfoContainer">
        <Header showProfileImage={false} navigate={navigate} />
        <div className="profilePageHeaderParentSection">
          <div className="top"></div>
          <div className="bottom">
            <div className="imageAndnameContainer">
              <div className="imageWrapper">
                <div
                  className="ProfileProfileImage"
                  style={{
                    backgroundImage: `url(${
                      user?.profileImage || imagePlaceholder
                    })`,
                    backgroundPosition: "center",
                  }}
                ></div>
              </div>
              <div className="infoWrapper">
                <div className="topInfo">
                  <h2 className="profile-username">
                    {user.firstName || ""} {user.lastName || ""}
                  </h2>
                  <span>@{user.username}</span>
                  <span>
                    Denominação:{" "}
                    {churchId ? (
                      <Link to={`/church/${encodeURIComponent(churchId)}`}>
                        {churchName || "Ver igreja"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="locationInfo">
                  <p>{user.city || ""}</p>
                  <p>{user.state || ""}</p>
                  {renderFriendAction()}
                  <span
                    onClick={() => navigate(`/profile/${user._id}/friends`)}
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    Amigos
                  </span>
                </div>
              </div>
              <div className="interactionButtons">
                {(currentUser._id !== user._id ||
                  currentUser._id === user._id) && (
                  <>
                    {currentUser._id !== user._id && (
                      <button
                        className="chat-icon-button"
                        onClick={() => requestChat(currentUser?._id, user?._id)}
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

      <div className="profileOptions">
        <ul>
          <li onClick={() => setCurrentTab("")}>Listagens</li>
          <li onClick={() => setCurrentTab("mural")}>Mural</li>
        </ul>
      </div>

      <div className="profile-container">
        {(currentTab === "" || currentTab === "mural") && (
          <div className="profile-listings">
            {currentTab === "mural" ? (
              <div className="mural-section">
                {currentUser && currentUser._id !== user._id && (
                  <div className="mural-input">
                    <textarea
                      placeholder="Deixe uma mensagem no mural..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
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
                        <p onClick={() => toggleListingMenu(listing._id)}>
                          {isOpen ? "x" : "menu"}
                        </p>
                      </div>
                    )}
                    {showListingMenu === listing._id && (
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
                            edit
                          </li>
                          <li>delete</li>
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
                        {listing.imageUrl && (
                          <img
                            src={listing.imageUrl}
                            alt="blog-img"
                            style={{ width: "100%", borderRadius: "8px" }}
                          />
                        )}
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
                      <div className="listing-edit-form" /* ...estilos... */>
                        {draft.type === "blog" && (
                          <>
                            <label>Título</label>
                            <input
                              value={draft.blogTitle}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  blogTitle: e.target.value,
                                }))
                              }
                            />

                            <label>Conteúdo</label>
                            <textarea
                              rows={6}
                              value={draft.blogContent}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  blogContent: e.target.value,
                                }))
                              }
                            />

                            <label>Imagem (URL)</label>
                            <input
                              value={draft.imageUrl}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  imageUrl: e.target.value,
                                }))
                              }
                            />
                          </>
                        )}

                        {draft.type === "image" && (
                          <>
                            <label>Imagem (URL)</label>
                            <input
                              value={draft.imageUrl}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  imageUrl: e.target.value,
                                }))
                              }
                            />
                            <label>Legenda</label>
                            <input
                              value={draft.caption || ""}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  caption: e.target.value,
                                }))
                              }
                            />
                          </>
                        )}

                        {draft.type === "poll" && (
                          <>
                            <label>Pergunta</label>
                            <input
                              value={draft.question}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  question: e.target.value,
                                }))
                              }
                            />
                            <label>Opções</label>
                            {draft.options?.map((opt, i) => (
                              <input
                                key={i}
                                value={opt}
                                onChange={(e) => {
                                  const arr = [...draft.options];
                                  arr[i] = e.target.value;
                                  setDraft((d) => ({ ...d, options: arr }));
                                }}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  options: [...(d.options || []), ""],
                                }))
                              }
                            >
                              + adicionar opção
                            </button>
                          </>
                        )}

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() =>
                              saveEdit(
                                listing._id,
                                draft,
                                setUserListings,
                                setEditingId,
                                setDraft,
                                setShowListingMenu
                              )
                            }
                          >
                            Salvar
                          </button>

                          <button
                            type="button"
                            onClick={() => cancelEdit(setEditingId, setDraft)}
                          >
                            Cancelar
                          </button>
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

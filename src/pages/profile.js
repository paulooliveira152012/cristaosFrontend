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
} from "./functions/profilePageFunctions";
import { useProfileLogic } from "./functions/useProfileLogic";
import FiMessageCircle from "../assets/icons/FiMessageCircle.js";

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
      } catch (err) {
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) getData();
  }, [userId]);

  const handleFetchComments = async (listingId) => {
    try {
      const comments = await fetchListingComments(listingId);
      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, comments } : item
        )
      );
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  if (loading) return <p className="profile-loading">Loading profile...</p>;
  if (error) return <p className="profile-error">{error}</p>;

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
        <li onClick={() => handleRemoveFriend(user._id)}>✅ Amigo (Remover)</li>
      );
    }
    if (hasReceivedRequest) {
      return (
        <>
          <li onClick={() => handleAcceptFriend(user._id)}>✅ Aceitar amizade</li>
          <li onClick={() => handleRejectFriend(user._id)}>❌ Recusar</li>
        </>
      );
    }
    if (hasSentRequest) return <li>⏳ Pedido enviado</li>;
    return <li onClick={handleSendRequest}>➕ Adicionar como amigo</li>;
  };

  return (
    <div className="screenWrapper">
      <div className="scrollable">
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
                      backgroundImage: `url(${user?.profileImage || imagePlaceholder})`,
                      backgroundPosition: "center",
                    }}
                  ></div>
                </div>
                <div className="infoWrapper">
                  <div className="topInfo">
                    <h2 className="profile-username">{user.username}</h2>
                    <span>@EtBilu</span>
                  </div>
                </div>
                {currentUser._id !== user._id && (
                  <div className="interactionButtons">
                    <button
                      className="chat-icon-button"
                      onClick={() => requestChat(currentUser?._id, user?._id)}
                    >
                      <FiMessageCircle size={20} />
                    </button>
                  </div>
                )}
              </div>
              <div className="locationInfo">
                <p>Sao Paulo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="profileOptions">
          <ul>
            <li onClick={() => setCurrentTab("")}>Listagens</li>
            <li onClick={() => setCurrentTab("userFriends")}>Amigos</li>
            <li onClick={() => setCurrentTab("mural")}>Mural</li>
            <li>{renderFriendAction()}</li>
            {currentUser._id === user._id && (
              <li onClick={() => navigate("/settingsMenu")}>Configurações</li>
            )}
            {currentUser._id !== user._id && (
                <ul>
                  {/* <li onClick={() => requestChat(currentUser?._id, user?._id)}>
                    Iniciar conversa
                  </li> */}
                  <li>Bloquear</li>
                  <li>Reportar</li>
                </ul> 
             )}
          </ul>
        </div>


             
             
               

        <div className="profile-container">
          {currentTab === "" && (
            <div className="profile-listings">
              {userListings.length > 0 ? (
                userListings.map((listing) => (
                  <div key={listing._id} className="profile-listing-item">
                    {/* check listing type and render appropriately */}

                    {/* if listing is an image */}
                    {listing.type === "image" && listing.imageUrl && (
                      <Link
                        to={`/openListing/${listing._id}`}
                        className="profile-listing-link"
                      >
                        {listing.imageUrl && (
                          <img
                            src={listing.imageUrl}
                            alt="Listing"
                            className="profile-listing-image"
                          />
                        )}
                      </Link>
                    )}

                    {/* if listing is a blog */}
                    {listing.type === "blog" && (
                      <Link
                        to={`/openListing/${listing._id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <div className="listing-content">
                          <h2>{listing.blogTitle || "Untitled Blog"}</h2>
                          <p
                            style={{
                              textDecoration: "none",
                              textAlign: "justify",
                            }}
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
                          {/*  */}

                          {listing.image && (
                            <img
                              src={listing.imageUrl}
                              alt={`Listing image ${listing._id}`}
                              className="listingImage"
                              style={{
                                width: "100%",
                                maxWidth: "100%",
                                height: "auto",
                                backgroundColor: "red",
                              }}
                            />
                          )}
                        </div>
                      </Link>
                    )}

                    {/* if listing is a poll */}
                    {listing.type === "poll" && listing.poll && (
                      <div className="poll-container">
                        <h2>{listing.poll.question}</h2>
                        <ul>
                          {listing.poll.options.map((option, index) => {
                            const totalVotes = listing.poll.votes?.length || 0;
                            const optionVotes =
                              listing.poll.votes?.filter(
                                (v) => v.optionIndex === index
                              ).length || 0;
                            const percentage =
                              totalVotes > 0
                                ? ((optionVotes / totalVotes) * 100).toFixed(1)
                                : 0;

                            const voters =
                              listing.poll.votes
                                ?.filter((v) => v.optionIndex === index)
                                .map((v) => v.userId) || [];

                            return (
                              <div key={index} style={{ marginBottom: "16px" }}>
                                <li
                                  style={{
                                    listStyle: "none",
                                    background: `linear-gradient(to right, #4caf50 ${percentage}%, #eee ${percentage}%)`,
                                    padding: "10px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {option}
                                  <span style={{ float: "right" }}>
                                    {percentage}%
                                  </span>
                                </li>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    marginTop: "4px",
                                    marginLeft: "4px",
                                  }}
                                >
                                  {voters.map((v, idx) => (
                                    <img
                                      key={idx}
                                      src={v?.profileImage || imagePlaceholder}
                                      alt="voter"
                                      style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "1px solid #ccc",
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="listing-link">
                      <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {listing.link}
                      </a>
                    </div>

                    <ListingInteractionBox
                      listingId={listing._id}
                      handleLike={() => handleLike(listing._id)}
                      likesCount={listing.likes.length}
                      comments={listing.comments || []}
                      commentsCount={listing.comments ? listing.comments.length : 0}
                      isLiked={currentUser ? listing.likes.includes(currentUser._id) : false}
                      handleCommentSubmit={handleCommentSubmit}
                      handleReplySubmit={handleReplySubmit}
                      handleDeleteComment={handleDeleteComment}
                      handleDeleteListing={handleDeleteListing}
                      currentUser={currentUser}
                      commentLikesCount={(comment) => (comment.likes ? comment.likes.length : 0)}
                      isCommentLiked={(comment) =>
                        comment.likes && Array.isArray(comment.likes)
                          ? comment.likes.includes(currentUser._id)
                          : false
                      }
                      commentCommentsCount={(comment) =>
                        comment.replies ? comment.replies.length : 0
                      }
                      handleFetchComments={handleFetchComments}
                      setItems={setUserListings}
                      handleCommentLike={handleCommentLike}
                      showDeleteButton={true}
                      handleShare={handleShare}
                      sharedListings={sharedListings}
                      userId={userId}
                    />
                  </div>
                ))
              ) : (
                <p className="profile-no-listings">
                  No listings available for {user.username}.
                </p>
              )}
            </div>
          )}
        </div>

        {currentTab === "userFriends" && <ProfileUserFriends user={user} />}
      
      </div>
    </div>
  );
};

export default Profile;

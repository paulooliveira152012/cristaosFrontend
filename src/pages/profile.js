import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ListingInteractionBox from "../components/ListingInteractionBox";
// import { SettingsMenu } from "./SettingsMenu";
import "../styles/profile.css";
import { ProfileUserFriends } from "./profileComponents/friends";

// funcoes para interação
import {
  fetchUserData,
  fetchListingComments,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "./functions/profilePageFunctions";

import { useProfileLogic } from "./functions/useProfileLogic";

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
  const [sharedListings, setSharedListings] = useState([]); // guarda os IDs compartilhados

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

  console.log(currentUser);

  // Fetch user data and listings
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

    if (userId) {
      getData();
    }
  }, [userId]);

  // rota para buscar os comentarios
  const handleFetchComments = async (listingId) => {
    try {
      const comments = await fetchListingComments(listingId);
      console.log("Comments fetched:", comments);

      setUserListings((prevItems) =>
        prevItems.map((item) =>
          item._id === listingId ? { ...item, comments } : item
        )
      );
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  console.log("User Listings: ", userListings);

  if (loading) return <p className="profile-loading">Loading profile...</p>;
  if (error) return <p className="profile-error">{error}</p>;

  const handleSendRequest = async () => {
    const profileUserId = user._id;

    const result = await sendFriendRequest(profileUserId);
    if (result.error) {
      alert(result.error);
    } else {
      alert("Pedido enviado!");
    }
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
          <li onClick={() => handleAcceptFriend(user._id)}>
            ✅ Aceitar amizade
          </li>
          <li onClick={() => handleRejectFriend(user._id)}>❌ Recusar</li>
        </>
      );
    }

    if (hasSentRequest) {
      return <li>⏳ Pedido enviado</li>;
    }

    return <li onClick={handleSendRequest}>➕ Adicionar como amigo</li>;
  };

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div
        className="ProfileProfileImage"
        style={{
          backgroundImage: `url(${user?.profileImage || imagePlaceholder})`,
          backgroundPosition: "center",
        }}
      ></div>
      <div className="profile-header">
        <h2 className="profile-username">{user.username}</h2>
      </div>
      {currentTab && currentTab === null}{" "}
      {
        <div className="profile-container">
          {/* 
        container para opcoes de:
          firends, 
          mural (onde outras pessoas podem escrever coisas), 
          adicionar amigo / remover amigo, 
          mandar mensage,
          bloquear,
          reportar,
        */}

          <div className="profileOptions">
            <ul>
              <li onClick={() => setCurrentTab("")}>Listagens</li>
              <li onClick={() => setCurrentTab("userFriends")}>Amigos</li>
              <li onClick={() => setCurrentTab("mural")}>Mural</li>
              <li>{renderFriendAction()}</li>
              {/* <li onClick={() => setCurrentTab("settings")}>Configurações</li> */}
              <li onClick={() => navigate("/settingsMenu")}>Configurações</li>
              {currentUser._id !== user._id && (
                <ul>
                  <li>Iniciar conversa</li>
                  <li>Bloquear</li>
                  <li>Reportar</li>
                </ul>
              )}

              {/* 
              {currentUser._id === user._id && (
              )} */}
            </ul>
          </div>

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
                          {listing.poll.options.map((option, index) => (
                            <li key={index}>{option}</li>
                          ))}
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
                      handleFetchComments={handleFetchComments}
                      setItems={setUserListings} //Use userListings
                      handleCommentLike={handleCommentLike}
                      showDeleteButton={true}
                      handleShare={handleShare}
                      sharedListings={sharedListings} // 🆕
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
      }
      {currentTab === "userFriends" && <ProfileUserFriends user={user} />}
      {/* {currentTab === "settings" && <SettingsMenu />} */}
    </div>
  );
};

export default Profile;

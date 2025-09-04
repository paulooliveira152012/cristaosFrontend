// pages/Profile.jsx (esqueleto reduzido mostrando as peças)
import { useMemo, useState, useCallback } from "react";
import { useUser } from "../context/UserContext.js";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext.js";
import Header from "../components/Header.js";
import Tabs from "../components/Page_Profile/Tabs.js";
import ProfileHeader from "../components/Page_Profile/ProfileHeader.js";
import FriendActions from "../components/Page_Profile/FriendActions.js";
import TopActions from "../components/Page_Profile/TopActions.js";
import MuralSection from "../components/Page_Profile/MuralSection.js";
import ListingCard from "../components/Page_Profile/ListingCard.js"; // você já tem/ou cria
import { ManagingModal } from "../components/ManagingModal.js";
import ListingInteractionBox from "../components/ListingInteractionBox.js";

import { useProfileData } from "../components/Page_Profile/hooks/useProfileData.js";
import { useMural } from "../hooks/useMural.js";
import { useBioEditor } from "../components/Page_Profile/hooks/useBioEditor.js";
import { useCoverUpload } from "../components/Page_Profile/hooks/useCoverUpload.js";
import { useProfileLogic } from "./functions/useProfileLogic.js";
import { normalizeDenomination } from "../utils/normalizeDenominations.js";
import coverPlaceholder from "../assets/coverPlaceholder.jpg";

import {
  requestChat,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  openEditor,
  // setEditingId,
  fetchListingComments
} from "./functions/profilePageFunctions.js";

import { strike } from "../functions/leaderFunctions.js";

export default function Profile() {
  const { currentUser } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { user, setUser, userListings, setUserListings, loading } =
    useProfileData(userId);
  const { messages: muralMessages, post: postMural } = useMural(
    userId,
    currentUser
  );
  const {
    editing: bioEditing,
    setEditing: setBioEditing,
    bioLocal,
    setBioLocal,
    bioDraft,
    setBioDraft,
    save: saveBio,
    bioText,
  } = useBioEditor(user, setUser);
  const {
    fileRef,
    uploading,
    triggerSelect,
    onChange: onSelectCover,
  } = useCoverUpload(setUser, String(currentUser?._id) === String(user?._id));

  const isOwner = String(currentUser?._id) === String(user?._id);
  const isLeader = currentUser?.role === "leader";

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

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
    currentUserId: currentUser?._id ?? null,
    userListings,
    setUserListings,
    setSharedListings: () => {}, // se usar
  });

  const [currentTab, setCurrentTab] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showListingMenu, setShowListingMenu] = useState(null);
  const [managingModal, setManagingModal] = useState(null);
  const [leaderMenuLevel, setLeaderMenuLevel] = useState("1");

  const locationText = user?.city || user?.state || "";
  const denomination = useMemo(
    () =>
      normalizeDenomination(
        user?.denomination ||
          (typeof user?.church === "object" ? user?.church?.name : "") ||
          user?.churchName ||
          ""
      ),
    [user]
  );
  const friendsCount = Array.isArray(user?.friends)
    ? user.friends.length
    : null;

  const handleChat = useCallback(async () => {
    const res = await requestChat(currentUser?._id, user?._id);
    const convId = res?.conversationId || res?.conversation?._id;
    if (!convId) return;
    socket?.emit?.("joinPrivateChat", { conversationId: convId });
    navigate(`/privateChat/${convId}`, {
      state: { justInvited: res?.status === "pending" },
    });
  }, [currentUser?._id, user?._id, socket, navigate]);

  const MoreMenu = (
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
                <li>🚫 Bloquear</li>
                <li>⚠️ Reportar</li>
                {isLeader && (
                  <ul>
                    <li /* onClick={() => ... banMember} */>Banir</li>
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

  if (!user) return null;
  if (user.isBanned) {
    navigate("/");
    return null;
  }

  return (
    <>
      <div className="profilePageBasicInfoContainer">
        <Header showProfileImage={false} navigate={navigate} />

        <ProfileHeader
          user={user}
          isOwner={isOwner}
          uploading={uploading}
          fileRef={fileRef}
          onSelectCover={onSelectCover}
          onTriggerSelect={triggerSelect}
          bioEditing={bioEditing}
          setBioEditing={setBioEditing}
          bioDraft={bioDraft}
          setBioDraft={setBioDraft}
          bioText={bioText}
          onSaveBio={saveBio}
          locationText={locationText}
          denomination={denomination}
          friendsCount={friendsCount}
          onClickFriends={() => navigate(`/profile/${user._id}/friends`)}
          FriendActionsSlot={
            <FriendActions
              currentUser={currentUser}
              profileUser={user}
              onSend={async () => {
                const result = await sendFriendRequest(user._id);
                if (result.error) alert(result.error);
                else alert("Pedido enviado!");
              }}
              onAccept={async (id) => {
                const res = await acceptFriendRequest(id);
                if (res.error) alert(res.error);
                else alert("Amizade aceita!");
              }}
              onReject={async (id) => {
                const res = await rejectFriendRequest(id);
                if (res.error) alert(res.error);
                else alert("Pedido recusado.");
              }}
              onRemove={async (id) => {
                const res = await removeFriend(id);
                if (res.error) alert(res.error);
                else alert("Amigo removido.");
              }}
            />
          }
        />

        <TopActions
          canChat={!!currentUser && !isOwner}
          onChat={handleChat}
          onToggleMore={() => setShowOptions((v) => !v)}
          showMore={showOptions}
          MoreMenu={MoreMenu}
        />
      </div>

      <Tabs currentTab={currentTab} onChange={setCurrentTab} />

      <div className="profile-container">
        {(currentTab === "" || currentTab === "mural") && (
          <div className="profile-listings">
            {currentTab === "mural" ? (
              <MuralSection
                canPost={!!currentUser && currentUser._id !== user._id}
                onPost={postMural}
                messages={muralMessages}
                imagePlaceholder={require("../assets/images/profileplaceholder.png")}
              />
            ) : (
              userListings.map((listing) => {
                const isOpen = showListingMenu === listing._id;
                return (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    profileUser={user}
                    isOwner={isOwner}
                    isLeader={isLeader}
                    isOwnerMenuOpen={isOpen}
                    onToggleOwnerMenu={() =>
                      setShowListingMenu((prev) =>
                        prev === listing._id ? null : listing._id
                      )
                    }
                    onOpenEdit={(l) =>
                      openEditor(l, setEditingId, setDraft, setShowListingMenu)
                    }
                    onDelete={() => handleDeleteListing(listing._id)}
                    isManageOpen={managingModal === listing._id}
                    onOpenManage={() => setManagingModal(listing._id)}
                    onCloseManage={() => setManagingModal(null)}
                    // InteractionBox callbacks
                    handleLike={handleLike}
                    handleCommentSubmit={handleCommentSubmit}
                    handleReplySubmit={handleReplySubmit}
                    handleDeleteComment={handleDeleteComment}
                    handleCommentLike={handleCommentLike}
                    fetchListingComments={fetchListingComments}
                    setUserListings={setUserListings}
                    currentUser={currentUser}
                    userId={userId}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal de moderação reutilizável */}
      {typeof managingModal === "string" && (
        <ManagingModal
          setManagingModal={setManagingModal}
          setLeaderMenuLevel={setLeaderMenuLevel}
          leaderMenuLevel={leaderMenuLevel}
          userId={user._id}
          listingId={managingModal}
          onDelete={() => handleDeleteListing(managingModal)}
          onStrike={async (reason) => {
            const { ok, error } = await strike({
              userId: user._id,
              listingId: managingModal,
              strikeReason: reason,
            });
            if (!ok) alert(error || "Falha ao registrar strike.");
          }}
        />
      )}
    </>
  );
}
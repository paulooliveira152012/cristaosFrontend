import { 
  FiEdit2,
  FiMapPin,
  FiMessageCircle,
  FiMoreVertical,
} from "react-icons/fi"

export const ProfileHeader = ({
    // ====== props visuais da capa ======
  updateProfileBackground,     // () => void (abrir seletor de arquivo)
  isOwner,                     // boolean
  user,                        // objeto do usuário
  currentUser,
  setUser,
  coverPlaceholder,            // opcional (se não vier, usa defaultCoverPlaceholder)
  uploading,                   // boolean de upload em andamento
  fileRef,                     // ref do <input type="file">
  handleCoverSelected,         // (e) => void (onChange do input)
  imagePlaceholder,            // opcional (fallback do avatar)
  socket,

  // ====== Bio ======
  bioLocal,
  setBioLocal,
  bioEditing,                  // boolean
  setBioEditing,               // (bool) => void
  bioDraft,                    // string
  setBioDraft,                 // (str) => void
  bioText,                     // string já calculada (user.bio || local)
  onSaveBio,                   // (text) => void|Promise

  // ===== Functions ====
  handleSaveBio,
  renderFriendAction,
  navigate,
  requestChat,

  // state
  setShowOptions,
  showOptions,
  renderMoreMenu,


  // ====== Meta ======
  locationText,                // string (cidade/estado já resolvido)
  denomination,                // string (normalizada)
  friendsCount,                // number|null
  onClickFriends,              // () => void

  // ====== Slot p/ ações de amizade ======
  FriendActionsSlot,           // ReactNode

}) => {

  console.log("user no ProfileHeader component:", user)
  return (
    <div className="profilePageHeaderParentSection">
      <>
        <div
          className="top"
          onClick={updateProfileBackground}
          role={isOwner ? "button" : undefined}
          tabIndex={isOwner ? 0 : -1}
          onKeyDown={(e) =>
            isOwner &&
            (e.key === "Enter" || e.key === " ") &&
            updateProfileBackground()
          }
          style={{
            backgroundImage: `url(${
              user?.profileCoverImage || coverPlaceholder
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: 220,
            cursor: isOwner ? "pointer" : "default",
            position: "relative",
          }}
        >
          {isOwner && (
            <div
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                fontSize: 12,
              }}
            >
              {uploading ? "Enviando..." : "Trocar capa"}
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleCoverSelected}
        />
      </>
      <div className="bottom">
        <div className="headerRow">
          {/* avatar */}
          <div className="imageColumn">
            <div
              className="ProfileProfileImage"
              style={{
                backgroundImage: `url(${
                  user?.profileImage || imagePlaceholder
                })`,
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

            {/* Bio — todos veem; só o dono edita */}
            <div className="bioSection">
              {!bioEditing ? (
                <>
                  {isOwner ? (
                    <p className={`bio ${bioLocal ? "" : "muted"}`}>
                      {bioText || "Escreva uma breve bio..."}
                    </p>
                  ) : (
                    <p className={`bio ${bioLocal ? "" : "muted"}`}>
                      {bioText || ""}
                    </p>
                  )}

                  {isOwner && (
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
              ) : isOwner ? (
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
                      onClick={async () => {
                        const trimmed = (bioDraft || "").trim();
                        setBioLocal(trimmed); // atualiza visual na hora
                        setBioEditing(false);
                        try {
                          // mantém sua assinatura atual:
                          await handleSaveBio(trimmed);
                          // otimismo: reflita no objeto user p/ evitar voltar a renderizar a antiga
                          setUser((u) => (u ? { ...u, bio: trimmed } : u));
                        } catch (e) {
                          console.error(e);
                          alert("Falha ao salvar bio");
                          // opcional: reverter bioLocal se quiser
                        }
                      }}
                    >
                      Salvar
                    </button>
                    <button
                      className="tiny ghost"
                      onClick={() => {
                        setBioDraft(bioLocal || ""); // garante string
                        setBioEditing(false);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
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
            {currentUser && (
              <>
                {!isOwner && (
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
                  <FiMoreVertical size={20} className="more-icon-button" />
                </button>
              </>
            )}
            {showOptions && renderMoreMenu()}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useNotification } from "./context/NotificationContext.js";
import PTR from "pulltorefreshjs";
import { ScrollToTop } from "./utils/ScrollToTop.js";

// páginas
import Landing from "./pages/landing";
import OpenListing from "./pages/listing";
import LiveRoom from "./pages/liveRoom";
import MainChat from "./pages/mainChat.js";
import Chat from "./pages/chat.js";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NewListing from "./pages/newListing";
import Profile from "./pages/profile";
import { Notifications } from "./pages/notifications.js";
import Reels from "./pages/reels.js";
import Donate from "./pages/Donate";
import PasswordResetLink from "./pages/passwordLinkRequest.js";
import PasswordReset from "./pages/PasswordReset.js";
import VerifyAccount from "./pages/verifyAccount.js";
import VerifyEmailUpdate from "./pages/verifyEmailUpdate.js";
import AllUsersPage from "./pages/allUsers.js";
import AdManagement from "./pages/adManagement.js";
import AddAd from "./pages/AddAd.js";
import EditAd from "./pages/EditAd.js";
import DeleteAd from "./pages/DeleteAd.js";
import ViewAds from "./pages/ViewAds.js";
import GlobeChurches from "./pages/Globo.js";
import FriendsList from "./pages/FriendsList.js";

// páginas do menu
import BibleStudiesByBook from "./pages/menuPages/BibleStudiesByBook.js";
import BibleStudiesByTheme from "./pages/menuPages/BibleStudiesByTheme.js";
import ChurchSupport from "./pages/menuPages/ChurchSupport.js";
import CommunityForum from "./pages/menuPages/CommunityForum.js";
import ContactUs from "./pages/menuPages/ContactUs.js";
import CounselingSessions from "./pages/menuPages/CounselingSessions.js";
import FindGathering from "./pages/menuPages/FindGathering.js";
import PlatformGuidelines from "./pages/menuPages/PlatformGuidelines.js";
import PrivateRooms from "./pages/menuPages/PrivateRooms.js";
import Promotions from "./pages/menuPages/Promotions.js";
import Suggestions from "./pages/menuPages/Suggestions.js";
import SettingsMenu from "./pages/SettingsMenu.js";
import ResendVerification from "./pages/resend-verification.js";
import PrivateChat from "./pages/PrivateChat.js";
import PrivacyPolicy from "./pages/menuPages/PrivacyPolicy.js";
import TermsOfUse from "./pages/menuPages/TermsOfUse.js";
import Church from "./pages/Church.js";
import Admin from "./pages/Admin.js";

// router/contexts
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { RoomProvider, useRoom } from "./context/RoomContext";
import { AudioProvider } from "./context/AudioContext";
import { SocketProvider, useSocket } from "./context/SocketContext.js";
import { DarkModeProvider } from "./context/DarkModeContext.js";
import { NotificationProvider } from "./context/NotificationContext.js";
import ProtectedRoute from "./components/ProtectedRoutes.js";

// UI
import "./styles/style.css";
import "./styles/darkMode.css";
import "./styles/base/global.css";
import SideMenuFullScreen from "./components/SideMenuFullScreen.js";
import SideAddSection from "./components/SideAddSection.js";
import Footer from "./components/Footer.js";

import { UnreadProvider } from "./context/UnreadContext.js";

// ---- NOVO: faz o socket entrar na sala pessoal do usuário logado ----
// 1) entra na sala pessoal do usuário
function SocketSetupBridge() {
  const { socket } = useSocket();
  const { currentUser } = useUser();

  useEffect(() => {
    // garante que temos a instância e a API .on/.emit
    if (!socket || typeof socket.on !== "function" || !currentUser?._id) return;

    // no padrão novo, o back lê o userId do JWT no handshake
    // só precisamos emitir "addUser" após conectar
    const register = () => socket.emit("addUser");
    if (socket.connected) register();
    socket.on("connect", register);
    return () => socket.off("connect", register);
  }, [socket, currentUser?._id]);

  return null;
}

// 2) ouve notificações em tempo real e acende badge
function NotificationsSocketBridge() {
  const { socket } = useSocket();
  const { setUnreadCount, setNotifications } = useNotification();
  const { currentUser } = useUser();

  useEffect(() => {
    if (!socket || typeof socket.on !== "function" || !currentUser?._id) return;

    const onNew = (notif) => {
      if (String(notif?.recipient) !== String(currentUser._id)) return;
      setUnreadCount?.((n) => n + 1);
      setNotifications?.(true);
    };

    socket.on("newNotification", onNew);

    return () => socket.off("newNotification", onNew);
  }, [socket, currentUser?._id, setUnreadCount, setNotifications]);

  return null;
}

// Componente para exibir o ícone da sala minimizada globalmente
const MinimizedStatus = () => {
  const location = useLocation();
  const { minimizedRoom } = useRoom();
  if (!minimizedRoom || location.pathname.includes("/liveRoom")) return null;

  return (
    <div
      style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}
    >
      <Link
        to={`/liveRoom/${minimizedRoom._id}`}
        state={{ sala: minimizedRoom }}
        className="minimizedRoomLink"
      >
        <div className="minimizedRoomIcon" style={styles.minimizedRoom}>
          <img
            src={minimizedRoom.roomImage || "defaultIcon.png"}
            alt={minimizedRoom.roomTitle}
            style={{ width: "50px", height: "50px", borderRadius: "50%" }}
          />
          <p>{minimizedRoom.roomTitle}</p>
        </div>
      </Link>
    </div>
  );
};

// App raiz: GARANTA que exista apenas UM SocketProvider no projeto
const App = () => {
  return (
    <SocketProvider>
      <DarkModeProvider>
        <Router>
          <AppWithLocation />
        </Router>
      </DarkModeProvider>
    </SocketProvider>
  );
};

const AppWithLocation = () => {
  const location = useLocation();
  const ptrRef = useRef(null);
  const scrollRef = useRef(null);

  const shouldShowFooter =
    !location.pathname.startsWith("/mainChat") &&
    !location.pathname.startsWith("/liveRoom") &&
    !location.pathname.startsWith("/privateChat");

  const hideSideMenu = ["/login"];
  const shouldShowSideMenu = !hideSideMenu.includes(location.pathname);

  // ⬇️ Pull-to-refresh global (sem deslocar layout)
  useEffect(() => {
    // destrói anterior (hot-reload / troca de rota)
    ptrRef.current?.destroy?.();
    ptrRef.current = null;

    // rotas onde o gesto pode atrapalhar
    const disabled =
      location.pathname.startsWith("/liveRoom") ||
      location.pathname.startsWith("/mainChat") ||
      location.pathname.startsWith("/privateChat");
      location.pathname.startsWith("/globe"); // 👈 aqui

    if (disabled) return;


    // usa o contêiner que rola no seu layout
    const selector = ".scrollable";
    const el = document.querySelector(selector);
    if (!el) return;

    ptrRef.current = PTR.init({
      mainElement: selector,
      triggerElement: selector,
      distThreshold: 70,
      distMax: 100,
      distReload: 70,
      refreshTimeout: 300,

      shouldPullToRefresh() {
        // ❌ não puxa para atualizar se o menu estiver aberto
        if (document.body.dataset.menuOpen === "1") return false;

        // ✅ só permite quando o feed principal está no topo
        return el.scrollTop === 0;
      },
      onRefresh() {
        // se preferir, dispare um evento e cada página lida com seu fetch
        // window.dispatchEvent(new CustomEvent("app:refresh"));
        window.location.reload();
        return Promise.resolve();
      },
      // overlay fixo (não desloca o conteúdo)
      getMarkup() {
        return `
          <div class="ptr-overlay">
            <div class="ptr-icon">↓</div>
            <div class="ptr-spinner"></div>
          </div>
        `;
      },
      getStyles() {
        return `
    .ptr-overlay{
      position: fixed; top:0; left:0; right:0; height:64px;
      display:flex; align-items:center; justify-content:center;
      z-index:9999; pointer-events:none;
    }

    /* ⬇️ seta escondida por padrão */
    .ptr-icon{ 
      display:none;
      color: transparent;
      font-size:18px; 
      transition:transform .2s ease, opacity .2s ease; 
    }

    /* ⬇️ mostra a seta somente durante o gesto (puxando/segurando) */
    .ptr--pull .ptr-icon,
    .ptr--release .ptr-icon { 
      display:block; 
    }

    .ptr-spinner{
      width:22px; height:22px; border:2px solid #cfcfcf; border-top-color:#2A68D8;
      border-radius:50%; display:none; animation:ptr-spin 1s linear infinite;
    }

    .ptr--release .ptr-icon{ transform:translateY(6px) rotate(180deg); }

    /* ⬇️ durante refresh: some a seta e mostra o spinner */
    .ptr--refresh .ptr-icon{ display:none; }
    .ptr--refresh .ptr-spinner{ display:block; }

    @keyframes ptr-spin { to { transform: rotate(360deg); } }
  `;
      },
    });

    return () => {
      ptrRef.current?.destroy?.();
      ptrRef.current = null;
    };
  }, [location.pathname]);

  return (
    <UserProvider>
      <RoomProvider>
        <AudioProvider>
          <UnreadProvider>
            <NotificationProvider>
              {/* ponte que liga socket ⇄ usuário logado para notificações */}
              <SocketSetupBridge />
              <NotificationsSocketBridge />

              <div className="mainParentContainer">
                {/* 1st side menu */}
                <div className="sideMenuContainerWideScreen">
                  {shouldShowSideMenu && <SideMenuFullScreen />}
                </div>

                {/* 2nd main content */}
                <div className="screenWrapper">
                  <div className="scrollable" ref={scrollRef}>
                    <ScrollToTop targetRef={scrollRef} />

                    <div
                      style={{
                        flex: 1,
                        margin: "0 auto",
                        width: "100%",
                        maxWidth: 800,
                        position: "relative",
                        height: "100vh",
                      }}
                    >
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route
                          path="/openListing/:id"
                          element={<OpenListing />}
                        />
                        <Route
                          path="/liveRoom/:roomId"
                          element={<LiveRoom />}
                        />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/login" element={<Login />} />
                        <Route
                          path="/resend-verification"
                          element={<ResendVerification />}
                        />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                          path="/verifyAccount"
                          element={<VerifyAccount />}
                        />
                        <Route
                          path="/confirm-email-update/:token"
                          element={<VerifyEmailUpdate />}
                        />
                        <Route path="/newlisting" element={<NewListing />} />
                        <Route path="/profile/:userId" element={<Profile />} />
                        <Route
                          path="/notifications"
                          element={<Notifications />}
                        />
                        <Route path="/donate" element={<Donate />} />
                        <Route
                          path="/passwordResetLink"
                          element={<PasswordResetLink />}
                        />
                        <Route
                          path="/passwordReset"
                          element={<PasswordReset />}
                        />
                        <Route
                          path="/guidelines"
                          element={<PlatformGuidelines />}
                        />
                        <Route
                          path="/bibleStudiesBook"
                          element={<BibleStudiesByBook />}
                        />
                        <Route
                          path="/bibleStudiesTheme"
                          element={<BibleStudiesByTheme />}
                        />
                        <Route
                          path="/privateRooms"
                          element={<PrivateRooms />}
                        />
                        <Route path="/suggestions" element={<Suggestions />} />
                        <Route path="/contactUs" element={<ContactUs />} />
                        <Route
                          path="/findGathering"
                          element={<FindGathering />}
                        />
                        <Route
                          path="/counselingSessions"
                          element={<CounselingSessions />}
                        />
                        <Route
                          path="/churchSupport"
                          element={<ChurchSupport />}
                        />
                        <Route path="/promotions" element={<Promotions />} />
                        <Route
                          path="/communityForum"
                          element={<CommunityForum />}
                        />
                        <Route
                          path="/settingsMenu"
                          element={<SettingsMenu />}
                        />
                        <Route path="/allUsers" element={<AllUsersPage />} />
                        <Route path="/mainChat" element={<MainChat />} />
                        <Route
                          path="/privateChat/:id"
                          element={<PrivateChat />}
                        />
                        <Route
                          path="/privacyPolicy"
                          element={<PrivacyPolicy />}
                        />
                        <Route path="/termsOfUse" element={<TermsOfUse />} />
                        <Route path="/reels" element={<Reels />} />
                        <Route
                          path="/addManagement"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <AdManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ads/add"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <AddAd />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ads/edit"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <EditAd />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ads/delete"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <DeleteAd />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ads/view"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <ViewAds />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/globe" element={<GlobeChurches />} />
                        <Route path="/church/:id" element={<Church />} />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute requiredRole="lider">
                              <Admin />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="*"
                          element={<h1>404 - Página não encontrada</h1>}
                        />
                        <Route
                          path="/profile/:userId/friends"
                          element={<FriendsList />}
                        />
                      </Routes>

                      <MinimizedStatus />
                    </div>
                  </div>

                  {shouldShowFooter && (
                    <div className="footerFixedWrapper">
                      <div className="footerContainer">
                        <Footer />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3rd ads container */}
                <div className="sideMenuContainerWideScreen">
                  {shouldShowSideMenu && <SideAddSection />}
                </div>
              </div>
            </NotificationProvider>
          </UnreadProvider>
        </AudioProvider>
      </RoomProvider>
    </UserProvider>
  );
};

const styles = {
  minimizedRoom: {
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
};

export default App;

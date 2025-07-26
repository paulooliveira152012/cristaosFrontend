import { useLocation } from "react-router-dom";
// Importar a página inicial
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
import Donate from "./pages/Donate";
import PasswordResetLink from "./pages/passwordLinkRequest.js";
import PasswordReset from "./pages/PasswordReset.js";
import VerifyAccount from "./pages/verifyAccount.js";
import VerifyEmailUpdate from "./pages/verifyEmailUpdate.js";

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
// Importar router, route e
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { RoomProvider, useRoom } from "./context/RoomContext";
import { AudioProvider } from "./context/AudioContext";
import { SocketProvider } from "./context/SocketContext.js";
import { DarkModeProvider } from "./context/DarkModeContext.js"; // ✅ novo

import "./styles/style.css";
import SideMenuFullScreen from "./components/SideMenuFullScreen.js";
import Footer from "./components/Footer.js";
import "./styles/darkMode.css";


// Componente para exibir o ícone da sala minimizada globalmente
const MinimizedStatus = () => {
  const location = useLocation();
  const { minimizedRoom } = useRoom();
  if (!minimizedRoom || location.pathname.includes("/liveRoom")) return null;

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      <Link to={`/liveRoom/${minimizedRoom._id}`} state={{ sala: minimizedRoom }} className="minimizedRoomLink">
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

// Componente App principal
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

// App com localização
const AppWithLocation = () => {
  const location = useLocation();

  const shouldShowFooter =
    !location.pathname.startsWith("/mainChat") &&
    !location.pathname.startsWith("/liveRoom") &&
    !location.pathname.startsWith("/privateChat/:id") 
    ;

  const hideSideMenu = ["/login"];
  const shouldShowSideMenu = !hideSideMenu.includes(location.pathname);

  return (
    <UserProvider>
      <RoomProvider>
        <AudioProvider>
          <div className="mainParentContainer">
            <div className="sideMenuContainerWideScreen">
              {/* COLOCAR O MENU AQUI */}
              {shouldShowSideMenu && <SideMenuFullScreen />}
            </div>

            <div
              style={{
                flex: 2,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                minHeight: "100vh",
                overflowY: "auto",
              }}
              id="scrollableContainer"
            >
              <div
                style={{
                  flex: 1,
                  margin: "0 auto",
                  width: "100%",
                  maxWidth: 800,
                }}
              >
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/openListing/:id" element={<OpenListing />} />
                  <Route path="/liveRoom/:roomId" element={<LiveRoom />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/login" element={<Login />} />

                  <Route
                    path="/resend-verification"
                    element={<ResendVerification />}
                  />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verifyAccount" element={<VerifyAccount />} />

                  <Route
                    path="/confirm-email-update/:token"
                    element={<VerifyEmailUpdate />}
                  />

                  <Route path="/newlisting" element={<NewListing />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/passwordResetLink" element={<PasswordResetLink />} />
                  <Route path="/passwordReset" element={<PasswordReset />} />
                  <Route path="/guidelines" element={<PlatformGuidelines />} />
                  <Route
                    path="/bibleStudies"
                    element={<BibleStudiesByBook />}
                  />
                  <Route
                    path="/bibleStudies"
                    element={<BibleStudiesByTheme />}
                  />
                  <Route path="/privateRooms" element={<PrivateRooms />} />
                  <Route path="/suggestions" element={<Suggestions />} />
                  <Route path="/contactUs" element={<ContactUs />} />
                  <Route path="/findGathering" element={<FindGathering />} />
                  <Route path="/counselingSessions" element={<CounselingSessions />} />
                  <Route path="/churchSupport" element={<ChurchSupport />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/communityForum" element={<CommunityForum />} />
                  <Route path="/settingsMenu" element={<SettingsMenu />} />
                  <Route path="/mainChat" element={<MainChat />} />
                  <Route path="/privateChat/:id" element={<PrivateChat />} />
                </Routes>
                <MinimizedStatus />
              </div>

              {shouldShowFooter && (
                <div style={{ position: "sticky", bottom: 0 }}>
                  <Footer />
                </div>
              )}
            </div>

            <div className="sideMenuContainerWideScreen"></div>
          </div>
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

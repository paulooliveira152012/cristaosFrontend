// Importar a página inicial
import Landing from "./pages/landing";
import OpenListing from "./pages/listing";
import LiveRoom from "./pages/liveRoom";
import Chat from "./pages/chat";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NewListing from "./pages/newListing";
import Profile from "./pages/profile";
import Donate from "./pages/Donate";
import PasswordResetLink from "./pages/passwordLinkRequest.js";
import PasswordReset from "./pages/PasswordReset.js";
import VerifyAccount from "./pages/verifyAccount.js";
// paginas do menu
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
// Importar router, route e
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { RoomProvider, useRoom } from "./context/RoomContext";
import { AudioProvider } from "./context/AudioContext";
import { useLocation } from "react-router-dom";

import "./styles/style.css";
import SideMenuFullScreen from "./components/SideMenuFullScreen.js";
import Footer from "./components/Footer.js";

// Componente para exibir o ícone da sala minimizada globalmente
const MinimizedStatus = () => {
  const location = useLocation();
  const { minimizedRoom } = useRoom(); // Obter minimizedRoom do contexto

  // console.log("Minimized room state:", minimizedRoom); // Log the state to check if it's being updated

  if (!minimizedRoom) return null; // Se não houver sala minimizada, não exibe nada

  // verificar se a rota atual e a liveRoom
  if (location.pathname.includes("/liveRoom")) {
    return null; // Nao renderizar nada se estiver dentro da liveRoom
  }

  return (
    <div
      style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}
    >
      <Link
        to={`/liveRoom/${minimizedRoom._id}`} // Pass the room ID in the URL
        state={{ sala: minimizedRoom }} // Also pass the sala object in the state
        className="minimizedRoomLink"
      >
        <div className="minimizedRoomIcon" style={styles.minimizedRoom}>
          <img
            src={minimizedRoom.roomImage || "defaultIcon.png"} // Ensure the image is correct
            alt={minimizedRoom.roomTitle}
            style={{ width: "50px", height: "50px", borderRadius: "50%" }}
          />
          <p>{minimizedRoom.roomTitle}</p>
        </div>
      </Link>
    </div>
  );
};

// Criar o componente App
const App = () => {
  return (
    <RoomProvider>
      {" "}
      {/* Make sure RoomProvider is wrapping the entire app */}
      <Router>
        <AudioProvider>
          <UserProvider>
            <div className="mainParentContainer">
              {/* flex 1 */}
              <div className="sideMenuContainerWideScreen">
                {/* COLOCAR O MENU AQUI */}
                

                <SideMenuFullScreen />
                
                
              </div>
              {/* flex 2 */}
              <div
                style={{
                  // backgroundColor: "red",
                  flex: 2,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  minHeight: "100vh",
                  overflowY: "auto"
                }}

                id="scrollableContainer"
              >
                {/* Wrap your entire app in a div with global styling */}
                <div
                  style={{
                    // maxWidth: "800px",
                    flex: 1,
                    margin: "0 auto",
                    width: "100%",
                    maxWidth: 800,
                    // position: "relative",
                  }}
                >
                  <Routes>
                    {/* Implementar rotas */}
                    <Route path="/" element={<Landing />} />
                    <Route path="openListing/:id" element={<OpenListing />} />
                    <Route path="liveRoom/:roomId" element={<LiveRoom />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                    <Route path="verifyAccount" element={<VerifyAccount />} />
                    <Route path="newlisting" element={<NewListing />} />
                    <Route path="profile/:userId" element={<Profile />} />
                    <Route path="donate" element={<Donate />} />
                    <Route
                      path="passwordResetLink"
                      element={<PasswordResetLink />}
                    />
                    <Route path="passwordReset" element={<PasswordReset />} />
                    <Route path="guidelines" element={<PlatformGuidelines />} />
                    <Route
                      path="bibleStudies"
                      element={<BibleStudiesByBook />}
                    />
                    <Route
                      path="bibleStudies"
                      element={<BibleStudiesByTheme />}
                    />
                    <Route path="privateRooms" element={<PrivateRooms />} />
                    <Route path="suggestions" element={<Suggestions />} />
                    <Route path="contactUs" element={<ContactUs />} />
                    <Route path="findGathering" element={<FindGathering />} />
                    <Route
                      path="counselingSessions"
                      element={<CounselingSessions />}
                    />
                    <Route path="churchSupport" element={<ChurchSupport />} />
                    <Route path="promotions" element={<Promotions />} />
                    <Route path="communityForum" element={<CommunityForum />} />
                  </Routes>
                  {/* Display the minimized room globally */}
                  <MinimizedStatus />
                </div>

                {/* Footer posicionado dentro do flex:2 */}
                <div style={{ position: "sticky", bottom: 0 }}>
                  <Footer />
                </div>
              </div>{" "}
              {/* final da div flex 2 */}
              <div className="sideMenuContainerWideScreen"></div>
            </div>
          </UserProvider>
        </AudioProvider>
      </Router>
    </RoomProvider>
  );
};

// CSS styles for the minimized room icon
const styles = {
  minimizedRoom: {
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
};

// Exportar o componente App
export default App;

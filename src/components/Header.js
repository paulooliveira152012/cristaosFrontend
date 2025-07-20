import React, { useState, useEffect } from "react";
import "../styles/header.css";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import imagePlaceholder from "../assets/images/profileplaceholder.png";
import SettingsIcon from "../assets/icons/settingIcon";
import SideMenu from "./SideMenu";
import BackArrow from "../assets/icons/Arrow_left";
import CloseIcon from "../assets/icons/closeIcon";

// Import the functions from the headerFunctions.js file
import { handleLogout, handleBack } from "./functions/headerFunctions";

const Header = ({
  showBackButton = false,
  showLoginButton = true,
  showLogoutButton = true,
  showWelcomeMessage = true,
  showProfileImage = true,
  showSettingsIcon = false,
  showBackArrow = true,
  showCloseIcon = false,
  openLiveSettings, // Accept openLiveSettings as a prop
  roomId, // Pass the roomId as a prop
  roomTitle = "", // Default value to an empty string
  onBack, // New prop for custom button behavior
  showLeaveButton = false,
  handleLeaveRoom, // Pass the handleLeaveRoom function as a prop
  socket, // Add socket as a prop for back navigation
  navigate, // Pass navigate as a prop from parent
}) => {
  // Consume the user from the useUser hook
  const { currentUser, logout } = useUser();

  // State to control the modal visibility and new room title
  const [newRoomTitle, setNewRoomTitle] = useState(roomTitle); // Add state for room title
  const [showSideMenu, setShowSideMenu] = useState(false);

  // Use effect to initialize the room title if it's defined later
  useEffect(() => {
    setNewRoomTitle(roomTitle || ""); // Ensure newRoomTitle is an empty string if undefined
  }, [roomTitle]);

  // Function to toggle the SideMenu visibility
  const toggleSideMenu = () => {
    setShowSideMenu((prev) => !prev); // Toggle the state
  };

  useEffect(() => {
    if (showSideMenu) {
      document.getElementById("scrollableContainer").classList.add("no-scroll");
    } else {
      document
        .getElementById("scrollableContainer")
        .classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [showSideMenu]);

  return (
    <div
      className="stickyHeader"
    >
      {/* Conditionally render SideMenu based on showSideMenu */}
      {showSideMenu && <SideMenu closeMenu={toggleSideMenu} />}
      <div className="header">
        <div className="left-section">
          {/* Conditionally render the Back button */}
          {showBackButton && (
            <button
              onClick={() =>
                handleBack(onBack, navigate, socket, roomId, currentUser?._id)
              }
              className="back-button"
            >
              Voltar
            </button>
          )}

          {/* Conditionally render the back icon */}
          {/* Conditionally render the back icon */}
          {showBackArrow && (
            <BackArrow
              onClick={() => {
                if (onBack) {
                  onBack(); // Call onBack if it is defined
                } else if (navigate) {
                  navigate(-1); // Default behavior: go back in history
                } else {
                  console.warn("onBack function is not defined");
                }
              }}
            />
          )}

          {/* Conditionally render profile image */}
          {showProfileImage && currentUser && (
            <div
              className="headerProfileImage"
              style={{
                backgroundImage: `url(${
                  currentUser?.profileImage || imagePlaceholder
                })`,
                backgroundPosition: "center",
              }}
              onClick={toggleSideMenu}
            ></div>
          )}
        </div>

        <div className="right-section">
          {/* Conditionally render login or logout */}
          {!currentUser && showLoginButton ? (
            <Link to={"/login"} className="link">
              <button className="login-button">Login</button>
            </Link>
          ) : (
            currentUser && (
              <div className="user-section">
                {showWelcomeMessage && (
                  <p className="welcome-message">
                    Bem Vindo, {currentUser.username}
                  </p>
                )}
                {showLogoutButton && (
                  <button
                    onClick={() => handleLogout(logout, navigate)}
                    className="logout-button"
                  >
                    Logout
                  </button>
                )}
              </div>
            )
          )}

          {/* Conditionally render exit room button */}
          {showLeaveButton && (
            <button onClick={handleLeaveRoom} className="leaveRoomButton">
              Sair
            </button>
          )}

          {/* Conditionally render close icon */}
          {showCloseIcon && (
            <CloseIcon
              onClick={handleLeaveRoom}
              style={{ alignSelf: "center", cursor: "pointer" }}
            />
          )}

          {/* Conditionally render settings icon */}
          {showSettingsIcon && (
            <SettingsIcon className="settingsIcon" onClick={openLiveSettings} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;

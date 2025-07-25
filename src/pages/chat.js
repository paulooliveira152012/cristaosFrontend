import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import "../styles/chat.css";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [privateChats, setPrivateChats] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPrivateChats = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/dm/userConversations/${currentUser._id}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        setPrivateChats(data);
      } catch (err) {
        console.error("Erro ao buscar conversas privadas:", err);
      }
    };

    fetchPrivateChats();
  }, [currentUser]);

  return (
    <div className="chatPageWrapper">
      <Header showProfileImage={false} navigate={navigate} />

      <div className="chatSidebar">
        <h3>Suas Conversas</h3>
        <ul>
          <li
            onClick={() => navigate("/mainChat")}
            className="chatPreview"
          >
            💬 Chat Principal
          </li>

          {privateChats.map((chat) => (
            <li
              key={chat._id}
              onClick={() => navigate(`/privateChat/${chat._id}`)}
              className="chatPreview"
            >
              Conversa com:{" "}
              {chat.participants
                .filter((p) => p._id !== currentUser._id)
                .map((p) => p.username)
                .join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chat;

// utils/chatComponentFunctions.js
import { useEffect } from "react";
import socket from "../../socket";

export const useSocketConnectionLogger = () => {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);
};

export const useJoinRoomChat = (roomId, currentUser, setMessages, scrollToBottom) => {
  useEffect(() => {
    if (!roomId || !currentUser) return;

    socket.emit("joinRoomChat", { roomId, user: currentUser });
    socket.emit("requestChatHistory", { roomId });

    const handleChatHistory = (history) => {
      console.log("\ud83d\udcdc Histórico:", history);
      setMessages(history);
      scrollToBottom(false);
    };

    socket.on("chatHistory", handleChatHistory);

    return () => {
      socket.emit("leaveRoomChat", { roomId });
      socket.off("chatHistory", handleChatHistory);
    };
  }, [roomId, currentUser]);
};

export const useReceiveMessage = (setMessages) => {
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      console.log("\ud83d\udce9 Mensagem recebida via socket:", newMessage);
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, []);
};

export const useListenMessageDeleted = (roomId, setMessages) => {
  useEffect(() => {
    const handleDelete = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    socket.on("messageDeleted", handleDelete);

    return () => {
      socket.off("messageDeleted", handleDelete);
    };
  }, [roomId]);
};

export const useAutoScrollToBottom = (messages, isAtBottom, scrollToBottom) => {
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);
};

export const sendMessageUtil = ({ currentUser, message, roomId, setMessage, scrollToBottom, inputRef }) => {
  if (!currentUser || message.trim() === "") {
    alert("Please log in to send messages");
    return;
  }

  const newMessage = {
    userId: currentUser._id,
    username: currentUser.username,
    profileImage: currentUser.profileImage,
    message,
    roomId,
    timestamp: new Date(),
  };

  console.log("Emitting message to the server", newMessage);
  socket.emit("sendMessage", newMessage);

  setMessage("");
  scrollToBottom();
  inputRef.current?.focus();
};

export const handleDeleteMessageUtil = ({ messageId, currentUser, roomId }) => {
  if (currentUser) {
    socket.emit("deleteMessage", {
      messageId,
      userId: currentUser._id,
      roomId,
    });
  }
};

export const handleToggleMicrophoneUtil = async ({
  micState,
  toggleMicrophone,
  roomId,
  currentUser,
}) => {
  try {
    const newMicState = !micState;
    await toggleMicrophone(newMicState);

    socket.emit("micStatusChanged", {
      roomId,
      userId: currentUser._id,
      micOpen: newMicState,
    });
  } catch (error) {
    console.error("Error toggling microphone:", error);
  }
};

export const getRandomDarkColor = () => {
  const r = Math.floor(Math.random() * 150);
  const g = Math.floor(Math.random() * 150);
  const b = Math.floor(Math.random() * 150);
  return `rgb(${r}, ${g}, ${b})`;
};

export const handleScrollUtil = (ref, setIsAtBottom) => {
  const container = ref.current;
  if (container) {
    const isUserAtBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 20;

    setIsAtBottom(isUserAtBottom);
  }
};

export const scrollToBottomUtil = (ref, smooth = true) => {
  const container = ref.current;
  if (!container) return;
  const behavior = smooth ? "smooth" : "auto";
  container.scrollTo({ top: container.scrollHeight, behavior });
};

// src/components/MinimizedIcon.js
import React from "react";
import { useNavigate } from "react-router-dom";

const MinimizedIcon = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate back to the live room
    navigate("/liveRoom");
  };

  return (
    <div onClick={handleClick} style={{ position: "fixed", bottom: 20, right: 20, cursor: "pointer" }}>
      <img src="/path/to/minimized-icon.png" alt="Minimized Room" />
    </div>
  );
};

export default MinimizedIcon;
